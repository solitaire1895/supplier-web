-- ============================================================
-- Migration 0019: security hardening (audit 2026-10)
-- ============================================================
-- 1. Supplier direct contacts (whatsapp, wechat, private_email) move to
--    their own table, readable only by Partner accounts with a live plan
--    and by admins. Before, every logged-in account (free ones included)
--    could read them straight from public.suppliers.
-- 2. Winning products are readable only by plans that include them
--    (explorateur, importateur, partenaire, not expired) and admins.
-- 3. Recommendation functions run as the caller (SECURITY INVOKER) and
--    use auth.uid(): they no longer bypass RLS or accept another user's id.
-- 4. Trainings / training parts / training files honour plan_expires_at.
--
-- Run once in the Supabase SQL editor. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: does the caller hold one of these plans, unexpired?
-- ------------------------------------------------------------
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
  );
$func$;

REVOKE ALL ON FUNCTION public.has_active_plan(text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.has_active_plan(text[]) TO authenticated;

-- ------------------------------------------------------------
-- 1. supplier_contacts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  supplier_id   uuid PRIMARY KEY REFERENCES public.suppliers(id) ON DELETE CASCADE,
  whatsapp      text,
  wechat        text,
  private_email text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Copy existing contacts, then drop the exposed columns.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'whatsapp'
  ) THEN
    INSERT INTO public.supplier_contacts (supplier_id, whatsapp, wechat, private_email)
    SELECT id, whatsapp, wechat, private_email
    FROM public.suppliers
    WHERE whatsapp IS NOT NULL OR wechat IS NOT NULL OR private_email IS NOT NULL
    ON CONFLICT (supplier_id) DO UPDATE
      SET whatsapp = EXCLUDED.whatsapp,
          wechat = EXCLUDED.wechat,
          private_email = EXCLUDED.private_email;

    ALTER TABLE public.suppliers
      DROP COLUMN IF EXISTS whatsapp,
      DROP COLUMN IF EXISTS wechat,
      DROP COLUMN IF EXISTS private_email;
  END IF;
END $$;

ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_partner_or_admin" ON public.supplier_contacts;
CREATE POLICY "contacts_select_partner_or_admin"
  ON public.supplier_contacts FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_active_plan(ARRAY['partenaire']));

DROP POLICY IF EXISTS "contacts_admin_write" ON public.supplier_contacts;
CREATE POLICY "contacts_admin_write"
  ON public.supplier_contacts FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 2. products: only plans that include winning products
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
DROP POLICY IF EXISTS "Public can view products"      ON public.products;
DROP POLICY IF EXISTS "products_select_plan"          ON public.products;
CREATE POLICY "products_select_plan"
  ON public.products FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR public.has_active_plan(ARRAY['explorateur', 'importateur', 'partenaire'])
  );

-- ------------------------------------------------------------
-- 3. Recommendations: run as the caller, scoped to auth.uid().
--    p_user_id is kept for API compatibility but ignored.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_recommended_products(p_user_id UUID, p_limit INTEGER DEFAULT 4)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $func$
BEGIN
  RETURN QUERY
  WITH recent_niches AS (
    SELECT p.niche
    FROM public.user_activity ua
    JOIN public.products p ON ua.target_id = p.id
    WHERE ua.user_id = auth.uid()
      AND ua.activity_type = 'view_product'
      AND p.niche IS NOT NULL
    GROUP BY p.niche
    ORDER BY max(ua.created_at) DESC
    LIMIT 5
  )
  SELECT p.*
  FROM public.products p
  WHERE p.niche IN (SELECT niche FROM recent_niches)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_favorites f
      WHERE f.user_id = auth.uid() AND f.product_id = p.id
    )
  ORDER BY p.ai_score DESC NULLS LAST, p.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 20);
END;
$func$;

CREATE OR REPLACE FUNCTION public.get_recommended_suppliers(p_user_id UUID, p_limit INTEGER DEFAULT 4)
RETURNS SETOF public.suppliers
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $func$
BEGIN
  RETURN QUERY
  WITH recent_categories AS (
    SELECT s.category
    FROM public.user_activity ua
    JOIN public.suppliers s ON ua.target_id = s.id
    WHERE ua.user_id = auth.uid()
      AND ua.activity_type = 'view_supplier'
      AND s.category IS NOT NULL
    GROUP BY s.category
    ORDER BY max(ua.created_at) DESC
    LIMIT 5
  )
  SELECT s.*
  FROM public.suppliers s
  WHERE s.category IN (SELECT category FROM recent_categories)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_favorites f
      WHERE f.user_id = auth.uid() AND f.supplier_id = s.id
    )
  ORDER BY s.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 20);
END;
$func$;

-- ------------------------------------------------------------
-- 4. Trainings honour plan expiry
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Partners and admins can view trainings" ON public.trainings;
CREATE POLICY "Partners and admins can view trainings"
  ON public.trainings FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_active_plan(ARRAY['partenaire']));

DO $$
BEGIN
  IF to_regclass('public.training_parts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Partners and admins can view training parts" ON public.training_parts';
    EXECUTE 'CREATE POLICY "Partners and admins can view training parts" ON public.training_parts
             FOR SELECT TO authenticated
             USING (public.is_admin() OR public.has_active_plan(ARRAY[''partenaire'']))';
  END IF;
END $$;

DROP POLICY IF EXISTS "Partners and admins can read training files" ON storage.objects;
CREATE POLICY "Partners and admins can read training files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'trainings'
    AND (public.is_admin() OR public.has_active_plan(ARRAY['partenaire']))
  );
