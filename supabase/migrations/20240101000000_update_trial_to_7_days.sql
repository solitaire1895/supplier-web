-- ============================================================
-- Migration: Reduce trial period to 7 days
-- ============================================================
-- 1. Update the column default on profiles.trial_ends_at
-- 2. Recreate handle_new_user() trigger function with 7-day trial
-- 3. Backfill existing trialing users who still have a future
--    trial_ends_at that is more than 7 days from their created_at
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Change the column default to 7 days from now
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ALTER COLUMN trial_ends_at
  SET DEFAULT (now() + interval '7 days');


-- ------------------------------------------------------------
-- STEP 2: Recreate the handle_new_user trigger function
--
-- Notes:
--   - All table refs are fully schema-qualified (public.profiles).
--   - A named dollar-quote tag ($func$) is used for the body so
--     it can never be confused with any $$ used elsewhere.
--   - Instead of ON CONFLICT (which some Supabase migration
--     runners reject inside SECURITY DEFINER functions), we guard
--     the INSERT with a NOT EXISTS check so duplicate rows are
--     silently skipped without relying on conflict handling.
--
-- ⚠️  If your existing function sets additional fields
--     (e.g. stripe_customer_id, avatar_url, referral_code, etc.)
--     add those columns/values to the INSERT below before running.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) THEN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      active_plan,
      subscription_status,
      trial_ends_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'user',
      'free',
      'trialing',
      now() + interval '7 days'
    );
  END IF;

  RETURN NEW;
END;
$func$;


-- ------------------------------------------------------------
-- STEP 3: Trigger on auth.users
--
-- ⚠️  Supabase restricts DDL on the auth schema from migration
--     files run via the CLI or dashboard SQL editor.
--     You MUST create (or re-create) this trigger manually:
--
--     Option A — Supabase Dashboard
--       Authentication → Hooks → "After user created"
--       Point it at: public.handle_new_user
--
--     Option B — SQL Editor (as a superuser / postgres role)
--       DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--       CREATE TRIGGER on_auth_user_created
--         AFTER INSERT ON auth.users
--         FOR EACH ROW
--         EXECUTE FUNCTION public.handle_new_user();
--
-- ------------------------------------------------------------


-- ------------------------------------------------------------
-- STEP 4: Backfill existing trialing users
--
-- Logic:
--   - Only touches rows where subscription_status is 'free' or
--     'trialing', and active_plan is 'free'
--   - Never touches paid plans, even if their status is odd
--   - Only shrinks the window — never extends it
--   - Sets trial_ends_at = created_at + 7 days
--   - If that date is already in the past, sets it to NOW()
--     so the trial is immediately expired rather than giving
--     extra time.
-- ------------------------------------------------------------
UPDATE public.profiles
SET trial_ends_at =
  CASE
    -- created_at + 7 days is still in the future → use it
    WHEN (created_at + interval '7 days') > now()
      THEN created_at + interval '7 days'
    -- created_at + 7 days already passed → expire immediately
    ELSE now()
  END
WHERE
  -- Apply to free/trialing users only
  subscription_status IN ('free', 'trialing')
  -- Never touch paid plans, even if their status is odd
  AND active_plan = 'free'
  -- Only shorten trials that are currently set beyond 7 days
  AND trial_ends_at > (created_at + interval '7 days');


-- ------------------------------------------------------------
-- Verification queries (optional — run manually to confirm)
-- ------------------------------------------------------------
-- SELECT id, email, created_at, trial_ends_at, subscription_status
-- FROM public.profiles
-- WHERE subscription_status IN ('free', 'trialing')
-- ORDER BY created_at DESC
-- LIMIT 20;
