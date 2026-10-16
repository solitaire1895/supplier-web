-- ============================================================
-- Migration 0017: multi-currency plan payments (West & Central Africa)
-- ============================================================
-- Plans can now be paid in XOF, XAF, NGN, GHS, GNF, CDF, GMD, SLE,
-- LRD, CVE, MRU and STN (see lib/currencies.ts).
--
--   - plan_payments.country      ISO2 country the customer paid from
--   - plan_payments.base_amount  plan price in the base currency (XAF),
--     so unused time can be credited fairly on a plan change even when
--     the two payments were made in different currencies
--   - fulfill_plan_payment() now uses base_amount for that ratio
-- ============================================================

ALTER TABLE public.plan_payments ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.plan_payments ADD COLUMN IF NOT EXISTS base_amount numeric(12, 2);

-- Rows created before this migration were all charged in XAF.
UPDATE public.plan_payments
SET base_amount = amount
WHERE base_amount IS NULL AND currency = 'XAF';

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
  v_old_base  numeric;
  v_new_base  numeric;
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
      -- Renewal: stack on top of the remaining time.
      v_remaining := v_profile.plan_expires_at - now();
    ELSE
      -- Plan change: convert the remaining time at the base-price ratio.
      SELECT base_amount INTO v_old_base
      FROM public.plan_payments
      WHERE user_id = v_payment.user_id
        AND plan = v_profile.active_plan
        AND status = 'paid'
        AND base_amount IS NOT NULL
      ORDER BY paid_at DESC
      LIMIT 1;

      v_new_base := COALESCE(v_payment.base_amount, CASE WHEN v_payment.currency = 'XAF' THEN v_payment.amount END);

      IF v_old_base IS NOT NULL AND v_new_base IS NOT NULL AND v_new_base > 0 THEN
        v_remaining := (v_profile.plan_expires_at - now()) * (v_old_base / v_new_base);
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
