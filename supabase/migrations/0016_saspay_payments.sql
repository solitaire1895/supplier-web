-- ============================================================
-- Migration 0016: SasPay plan payments (replaces Stripe)
-- ============================================================
-- SasPay has no subscriptions: every payment buys one plan period
-- (30 days by default). This migration adds:
--   1. plan_payments          - one row per checkout we open
--   2. saspay_webhook_events  - delivery log for debugging/support
--   3. fulfill_plan_payment() - atomic, idempotent "payment -> plan" step
--   4. expire_lapsed_plans()  - downgrades profiles whose period ended
--   5. protect_profile_billing_fields trigger - users can no longer
--      grant themselves a plan/role through the profiles RLS policy
-- ============================================================

-- ------------------------------------------------------------
-- 1. plan_payments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plan_payments (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan                   text NOT NULL CHECK (plan IN ('explorateur', 'importateur', 'partenaire')),
  amount                 numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency               text NOT NULL,
  period_days            integer NOT NULL DEFAULT 30 CHECK (period_days > 0),
  status                 text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'expired')),
  saspay_session_id      text UNIQUE,
  saspay_checkout_url    text,
  saspay_transaction_id  text,
  paid_amount            numeric(12, 2),
  paid_at                timestamptz,
  period_start           timestamptz,
  period_end             timestamptz,
  last_error             text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- One SasPay transaction can never pay for two plan periods.
CREATE UNIQUE INDEX IF NOT EXISTS plan_payments_transaction_uidx
  ON public.plan_payments (saspay_transaction_id)
  WHERE saspay_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS plan_payments_user_idx
  ON public.plan_payments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS plan_payments_pending_idx
  ON public.plan_payments (created_at DESC)
  WHERE status = 'pending';

ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;

-- Users may read their own payments; only the server (service role) writes.
DROP POLICY IF EXISTS "Users can view their own plan payments" ON public.plan_payments;
CREATE POLICY "Users can view their own plan payments"
  ON public.plan_payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------
-- 2. saspay_webhook_events (delivery log)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saspay_webhook_events (
  id              text PRIMARY KEY,          -- sha256 of timestamp + raw body
  event           text NOT NULL,
  transaction_id  text,
  payload         jsonb NOT NULL,
  outcome         text,
  error           text,
  received_at     timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz
);

ALTER TABLE public.saspay_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view SasPay webhook events" ON public.saspay_webhook_events;
CREATE POLICY "Admins can view SasPay webhook events"
  ON public.saspay_webhook_events FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 3. fulfill_plan_payment()
--
-- Locks the payment and the profile, so concurrent webhook
-- retries and the return-page verification can never apply the
-- same payment twice.
--
-- Period rules:
--   - Same plan still running   -> extend from the current expiry
--   - Different paid plan still running -> remaining time is
--     converted at the price ratio (old price / new price) and
--     carried over, so upgrading never loses money already paid
--   - Otherwise                 -> start now
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fulfill_plan_payment(
  p_payment_id     uuid,
  p_transaction_id text,
  p_paid_amount    numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_payment   public.plan_payments%ROWTYPE;
  v_profile   public.profiles%ROWTYPE;
  v_old_price numeric;
  v_remaining interval := interval '0';
  v_start     timestamptz := now();
  v_end       timestamptz;
BEGIN
  SELECT * INTO v_payment FROM public.plan_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'plan payment % not found', p_payment_id;
  END IF;

  IF v_payment.status = 'paid' THEN
    RETURN jsonb_build_object(
      'outcome', 'already_paid',
      'plan', v_payment.plan,
      'plan_expires_at', v_payment.period_end
    );
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_payment.user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile % not found for payment %', v_payment.user_id, p_payment_id;
  END IF;

  IF v_profile.plan_expires_at IS NOT NULL
     AND v_profile.plan_expires_at > now()
     AND v_profile.active_plan IS DISTINCT FROM 'free' THEN

    IF v_profile.active_plan = v_payment.plan THEN
      v_remaining := v_profile.plan_expires_at - now();
    ELSE
      -- Price the user actually paid for the plan they are leaving.
      SELECT amount INTO v_old_price
      FROM public.plan_payments
      WHERE user_id = v_payment.user_id
        AND plan = v_profile.active_plan
        AND status = 'paid'
      ORDER BY paid_at DESC
      LIMIT 1;

      IF v_old_price IS NOT NULL AND v_payment.amount > 0 THEN
        v_remaining := (v_profile.plan_expires_at - now()) * (v_old_price / v_payment.amount);
      END IF;
    END IF;
  END IF;

  v_end := v_start + v_remaining + make_interval(days => v_payment.period_days);

  UPDATE public.plan_payments
  SET status                = 'paid',
      saspay_transaction_id = COALESCE(p_transaction_id, saspay_transaction_id),
      paid_amount           = p_paid_amount,
      paid_at               = now(),
      period_start          = v_start,
      period_end            = v_end,
      last_error            = NULL,
      updated_at            = now()
  WHERE id = p_payment_id;

  UPDATE public.profiles
  SET active_plan         = v_payment.plan,
      subscription_status = 'active',
      plan_expires_at     = v_end
  WHERE id = v_payment.user_id;

  RETURN jsonb_build_object(
    'outcome', 'fulfilled',
    'plan', v_payment.plan,
    'plan_expires_at', v_end
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.fulfill_plan_payment(uuid, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_plan_payment(uuid, text, numeric) TO service_role;

-- ------------------------------------------------------------
-- 4. expire_lapsed_plans()
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_lapsed_plans()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.profiles
  SET active_plan         = 'free',
      subscription_status = 'free'
  WHERE active_plan IS DISTINCT FROM 'free'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$func$;

REVOKE ALL ON FUNCTION public.expire_lapsed_plans() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_lapsed_plans() TO service_role;

-- Schedule it every 15 minutes when pg_cron is enabled
-- (Supabase Dashboard -> Database -> Extensions -> pg_cron).
-- The app also treats an expired plan as 'free' when it reads the
-- profile, so access is correct even before this job runs.
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'expire-lapsed-plans';
    PERFORM cron.schedule('expire-lapsed-plans', '*/15 * * * *', 'SELECT public.expire_lapsed_plans()');
  ELSE
    RAISE NOTICE 'pg_cron is not enabled: enable it, then re-run this block to schedule expire_lapsed_plans()';
  END IF;
END;
$cron$;

-- ------------------------------------------------------------
-- 5. Protect billing / role columns on profiles
--
-- The existing policy "Users can update their own profile" lets a
-- user update ANY column of their row, including active_plan and
-- role. This trigger silently keeps those columns unchanged unless
-- the write comes from the server (service role), a SECURITY
-- DEFINER function (runs as postgres), or an admin.
--
-- It is SECURITY INVOKER on purpose: current_user must be the
-- caller's role, not the function owner.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $func$
DECLARE
  v_protected text[] := ARRAY[
    'role', 'active_plan', 'subscription_status', 'plan_expires_at',
    'trial_ends_at', 'stripe_customer_id', 'stripe_subscription_id', 'status'
  ];
  v_old jsonb;
  v_new jsonb;
  k     text;
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR COALESCE(auth.role(), '') = 'service_role'
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role            := 'user';
    NEW.active_plan     := 'free';
    NEW.plan_expires_at := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE: restore every protected column that exists on the table.
  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);
  FOREACH k IN ARRAY v_protected LOOP
    IF v_old ? k THEN
      v_new := jsonb_set(v_new, ARRAY[k], v_old -> k);
    END IF;
  END LOOP;
  NEW := jsonb_populate_record(NEW, v_new);
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS protect_profile_billing_fields ON public.profiles;
CREATE TRIGGER protect_profile_billing_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_billing_fields();
