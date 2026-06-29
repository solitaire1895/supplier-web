-- ============================================================
-- Fix: ensure every authenticated user can read/create/update
-- their own profile row. Resolves "profile card not showing".
-- ============================================================

-- 1. Make sure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop conflicting/old policies (safe if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 3. SELECT own profile (authenticated users only)
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. INSERT own profile (needed for the client-side upsert fallback)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 5. UPDATE own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 6. Backfill profile rows for any existing auth users who are
--    missing one (e.g. signed up before the trigger existed).
--    Plain SQL INSERT ... ON CONFLICT is used here because
--    ON CONFLICT is not valid inside a PL/pgSQL anonymous block
--    when combined with INSERT ... SELECT.
-- ============================================================
INSERT INTO public.profiles (id, email, full_name, role, active_plan, subscription_status)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  'user',
  'Free',
  'active'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. Auto-create a profile whenever a new auth user signs up.
--    SECURITY DEFINER + explicit search_path set at the function
--    level (most portable across Supabase Postgres versions).
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  RETURN NEW;
END;
$$;

-- ============================================================
-- 8. Drop and recreate the trigger. Wrapped in a DO block so
--    that if Supabase restricts the DROP on auth.users for your
--    role, it raises a notice instead of aborting the script.
-- ============================================================
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not drop trigger on auth.users — may need superuser. Continuing.';
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
