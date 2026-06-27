-- ============================================================
-- Nexusply: RLS + Full-Text Search hardening
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENABLE RLS
-- ------------------------------------------------------------
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity     ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. PRODUCTS — readable by any authenticated user;
--    admins can do everything.
--    (Single SELECT policy + single ALL policy avoids overlap.)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_admin_write"          ON public.products;

-- All authenticated users can read products
CREATE POLICY "products_select_authenticated"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

-- Admins can insert / update / delete
CREATE POLICY "products_admin_write"
  ON public.products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- ------------------------------------------------------------
-- 3. SUPPLIERS — same pattern as products
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "suppliers_select_authenticated" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_admin_write"          ON public.suppliers;

CREATE POLICY "suppliers_select_authenticated"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "suppliers_admin_write"
  ON public.suppliers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- ------------------------------------------------------------
-- 4. REVIEWS — authenticated users can read all;
--    users insert their own; admins can do everything.
--    Consolidated into two non-overlapping policies.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "reviews_select_authenticated" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own"           ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_write"          ON public.reviews;

-- Any authenticated user can read
CREATE POLICY "reviews_select_authenticated"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

-- Users insert/update/delete their own rows; admins can touch any row
CREATE POLICY "reviews_write"
  ON public.reviews FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- ------------------------------------------------------------
-- 5. PROFILES — users read/update their own row;
--    admins can read/update/delete any row.
--    Consolidated to avoid overlapping SELECT / UPDATE policies.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read_all"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_all"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete"      ON public.profiles;

-- SELECT: own row OR admin
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- UPDATE: own row OR admin
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- DELETE: admin only
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- ------------------------------------------------------------
-- 6. USER_FAVORITES — fully scoped to owner
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "favorites_all_own" ON public.user_favorites;

CREATE POLICY "favorites_all_own"
  ON public.user_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. SOURCING_REQUESTS — owner can insert/read their own;
--    admins can read all.
--    Consolidated SELECT to avoid overlap.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sourcing_insert_own"      ON public.sourcing_requests;
DROP POLICY IF EXISTS "sourcing_select_own"      ON public.sourcing_requests;
DROP POLICY IF EXISTS "sourcing_admin_read_all"  ON public.sourcing_requests;

-- SELECT: own rows OR admin
CREATE POLICY "sourcing_select"
  ON public.sourcing_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- INSERT: own rows only
CREATE POLICY "sourcing_insert_own"
  ON public.sourcing_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8. USER_ACTIVITY — owner can insert/read their own
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "activity_insert_own" ON public.user_activity;
DROP POLICY IF EXISTS "activity_select_own" ON public.user_activity;

CREATE POLICY "activity_insert_own"
  ON public.user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activity_select_own"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 9. FULL-TEXT SEARCH (search_vector) for products & suppliers
-- ============================================================

-- ---- PRODUCTS ----
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name,        '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category,    '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_vector ON public.products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON public.products USING gin(search_vector);

-- Backfill existing rows
UPDATE public.products
SET search_vector =
    setweight(to_tsvector('english', coalesce(name,        '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category,    '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C');

-- ---- SUPPLIERS ----
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.suppliers_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name,              '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category,          '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.supplied_products, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.platform,          '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suppliers_search_vector ON public.suppliers;
CREATE TRIGGER trg_suppliers_search_vector
  BEFORE INSERT OR UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.suppliers_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_suppliers_search_vector
  ON public.suppliers USING gin(search_vector);

-- Backfill existing rows
UPDATE public.suppliers
SET search_vector =
    setweight(to_tsvector('english', coalesce(name,              '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category,          '')), 'B') ||
    setweight(to_tsvector('english', coalesce(supplied_products, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(platform,          '')), 'C');

-- ============================================================
-- 10. Performance indexes for ordering / joins
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_created_at   ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at  ON public.suppliers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id     ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_user_created ON public.sourcing_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id    ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_supplier_id   ON public.reviews(supplier_id);
