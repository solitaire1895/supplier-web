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
--   - search_path option removed; all table refs are fully
--     schema-qualified (public.profiles) so it is not needed.
--   - ON CONFLICT (id) used instead of ON CONSTRAINT to avoid
--     dependency on the exact constraint name.
--
-- ⚠️  If your existing function sets additional fields
--     (e.g. stripe_customer_id, avatar_url, referral_code, etc.)
--     add those columns/values to the INSERT below before running.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


-- ------------------------------------------------------------
-- STEP 3: Ensure the trigger exists (safe to re-run)
--
-- Uses standard $$ delimiter for the DO block (the function
-- body above is already closed so there is no nesting issue).
-- Wrapped in an exception handler so that if the migration
-- runner lacks DDL rights on auth.users the rest of the
-- migration still completes successfully.
-- ------------------------------------------------------------
DO $$
BEGIN
  -- Drop the old trigger if it exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

  -- Recreate it pointing at the updated function
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING
      'Could not (re)create on_auth_user_created trigger on auth.users — '
      'insufficient privilege. Create it manually in the Supabase dashboard '
      'or via the Auth → Hooks UI.';
  WHEN others THEN
    RAISE WARNING
      'Unexpected error while (re)creating on_auth_user_created trigger: %', SQLERRM;
END;
$$;


-- ------------------------------------------------------------
-- STEP 4: Backfill existing trialing users
--
-- Logic:
--   - Only touches rows where subscription_status = 'trialing'
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
  subscription_status = 'trialing'
  -- Only shorten trials that are currently set beyond 7 days
  AND trial_ends_at > (created_at + interval '7 days');


-- ------------------------------------------------------------
-- Verification queries (optional — run manually to confirm)
-- ------------------------------------------------------------
-- SELECT id, email, created_at, trial_ends_at, subscription_status
-- FROM public.profiles
-- WHERE subscription_status = 'trialing'
-- ORDER BY created_at DESC
-- LIMIT 20;
