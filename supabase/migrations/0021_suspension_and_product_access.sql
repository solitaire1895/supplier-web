-- ============================================================
-- Migration 0021: suspended accounts lose paid access; product reads stay paid-only
-- ============================================================
-- 1. profiles.status ('active' | 'suspended') is set by the admin panel but no
--    migration created it. Add it if it is missing.
-- 2. has_active_plan() now also requires the account not to be suspended, so a
--    suspended account loses winning products, supplier contacts and trainings.
-- 3. Drop the open products read policy that the old supabase/fixes.sql created
--    ("USING (true)"). Policies are OR'ed, so if fixes.sql was run after 0019 it
--    gave every logged-in account (free ones included) all winning products.
--
-- Run once in the Supabase SQL editor. Idempotent.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

CREATE OR REPLACE FUNCTION public.has_active_plan(p_plans text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active_plan = ANY (p_plans)
      AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
      AND COALESCE(p.status, 'active') <> 'suspended'
  );
$func$;

REVOKE ALL ON FUNCTION public.has_active_plan(text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.has_active_plan(text[]) TO authenticated;

DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
