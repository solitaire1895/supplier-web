-- ============================================================
-- Nexusply: Full database hardening script
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 0a. ADMIN CHECK HELPER
--    A security-definer function so every policy can call
--    is_admin() instead of repeating the profiles subquery.
--    This also prevents recursive RLS on the profiles table.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;

-- ------------------------------------------------------------
-- 0b. CREATE MISSING TABLES
--    Must run BEFORE ENABLE ROW LEVEL SECURITY and policies.
--    All statements are idempotent (CREATE TABLE IF NOT EXISTS).
-- ------------------------------------------------------------

-- Core tables (products, suppliers, profiles) are assumed to
-- already exist from the initial Supabase project setup.
-- We only create the auxiliary tables that may be missing.

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id  uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id)  ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_favorites_has_target CHECK (
    (supplier_id IS NOT NULL AND product_id IS NULL) OR
    (supplier_id IS NULL     AND product_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id  uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id)  ON DELETE CASCADE,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_has_target CHECK (
    (supplier_id IS NOT NULL AND product_id IS NULL) OR
    (supplier_id IS NULL     AND product_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.sourcing_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id  uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE SET NULL,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_activity (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('view_product', 'view_supplier', 'search')),
  target_id     uuid,
  meta_data     jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 1. ENABLE RLS
--    ENABLE ROW LEVEL SECURITY is idempotent in Postgres —
--    it is a no-op when RLS is already enabled.
-- ------------------------------------------------------------
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity     ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. PRODUCTS
--    SELECT  — any authenticated user
--    INSERT / UPDATE / DELETE — admins only
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_admin_write"          ON public.products;
DROP POLICY IF EXISTS "products_admin_insert"         ON public.products;
DROP POLICY IF EXISTS "products_admin_update"         ON public.products;
DROP POLICY IF EXISTS "products_admin_delete"         ON public.products;

CREATE POLICY "products_select_authenticated"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "products_admin_insert"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 3. SUPPLIERS
--    SELECT  — any authenticated user
--    INSERT / UPDATE / DELETE — admins only
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "suppliers_select_authenticated" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_admin_write"          ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_admin_insert"         ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_admin_update"         ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_admin_delete"         ON public.suppliers;

CREATE POLICY "suppliers_select_authenticated"
  ON public.suppliers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "suppliers_admin_insert"
  ON public.suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "suppliers_admin_update"
  ON public.suppliers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "suppliers_admin_delete"
  ON public.suppliers
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 4. REVIEWS
--    SELECT  — any authenticated user
--    INSERT  — own rows only
--    UPDATE / DELETE — own rows OR admin
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "reviews_select_authenticated" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own"           ON public.reviews;
DROP POLICY IF EXISTS "reviews_write"                ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own_or_admin"  ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own_or_admin"  ON public.reviews;

CREATE POLICY "reviews_select_authenticated"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "reviews_insert_own"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_update_own_or_admin"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "reviews_delete_own_or_admin"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------
-- 5. PROFILES
--    SELECT  — own row OR admin
--    UPDATE  — own row OR admin
--    DELETE  — admin only
--    INSERT  — blocked (profiles created via auth trigger only)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_select"           ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"           ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete"           ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 6. USER_FAVORITES — fully scoped to owner
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "favorites_all_own"    ON public.user_favorites;
DROP POLICY IF EXISTS "favorites_select_own" ON public.user_favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.user_favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.user_favorites;

CREATE POLICY "favorites_select_own"
  ON public.user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own"
  ON public.user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own"
  ON public.user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. SOURCING_REQUESTS
--    SELECT — own rows OR admin
--    INSERT — own rows only
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sourcing_insert_own"     ON public.sourcing_requests;
DROP POLICY IF EXISTS "sourcing_select_own"     ON public.sourcing_requests;
DROP POLICY IF EXISTS "sourcing_admin_read_all" ON public.sourcing_requests;
DROP POLICY IF EXISTS "sourcing_select"         ON public.sourcing_requests;

CREATE POLICY "sourcing_select"
  ON public.sourcing_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "sourcing_insert_own"
  ON public.sourcing_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8. USER_ACTIVITY — owner can insert / read their own rows
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "activity_insert_own" ON public.user_activity;
DROP POLICY IF EXISTS "activity_select_own" ON public.user_activity;

CREATE POLICY "activity_select_own"
  ON public.user_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "activity_insert_own"
  ON public.user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 9. FULL-TEXT SEARCH — search_vector columns + triggers
-- ============================================================

-- ---- PRODUCTS ----
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name::text,        '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category::text,    '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description::text, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_search_vector ON public.products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON public.products USING gin(search_vector);

-- Backfill existing rows
UPDATE public.products
SET search_vector =
    setweight(to_tsvector('english', coalesce(name::text,        '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category::text,    '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description::text, '')), 'C');

-- ---- SUPPLIERS ----
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.suppliers_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name::text,              '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category::text,          '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.supplied_products::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.platform::text,          '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_suppliers_search_vector ON public.suppliers;
CREATE TRIGGER trg_suppliers_search_vector
  BEFORE INSERT OR UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.suppliers_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_suppliers_search_vector
  ON public.suppliers USING gin(search_vector);

-- Backfill existing rows
UPDATE public.suppliers
SET search_vector =
    setweight(to_tsvector('english', coalesce(name::text,              '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category::text,          '')), 'B') ||
    setweight(to_tsvector('english', coalesce(supplied_products::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(platform::text,          '')), 'C');

-- ============================================================
-- 10. Performance indexes for ordering / joins
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_created_at  ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON public.suppliers(created_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id    ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_user_id     ON public.sourcing_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_created_at  ON public.sourcing_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id   ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_supplier_id  ON public.reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_id     ON public.user_activity(user_id);

-- ============================================================
-- 11. AUTO-CREATE PROFILE ON SIGNUP (auth trigger)
--    Ensures a profiles row always exists for every new user.
--    Safe to re-run — uses CREATE OR REPLACE + DROP IF EXISTS.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, active_plan, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user',
    'free',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
