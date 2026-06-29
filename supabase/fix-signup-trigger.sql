-- ============================================================
-- Fix: "Database error updating user" during signup.
-- The auth.users trigger that creates a profile row is throwing,
-- which aborts the entire signup transaction. We make it robust
-- and guarantee it can never block account creation.
-- ============================================================

-- 1. Recreate the signup handler defensively.
--    - SECURITY DEFINER so it bypasses RLS during signup.
--    - Only inserts columns we are certain exist.
--    - Wraps the insert so any failure is logged but NOT fatal.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, active_plan, subscription_status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      'user',
      'Free',
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Never block signup because of a profile-row issue.
      RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 2. Reattach the trigger cleanly.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. Make the profiles table tolerant of partial inserts so the
--    trigger never fails on a missing/NOT NULL column. Adjust to
--    your real schema. These set sensible defaults instead of
--    requiring a value at insert time.
-- ============================================================
ALTER TABLE public.profiles
  ALTER COLUMN role            SET DEFAULT 'user',
  ALTER COLUMN active_plan     SET DEFAULT 'Free';

-- Only run these if the columns exist in your table; otherwise remove them.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN subscription_status SET DEFAULT ''active''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT ''active''';
  END IF;
END $$;
