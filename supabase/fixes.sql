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
-- 2. PRODUCTS / SUPPLIERS — readable by any authenticated user
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
CREATE POLICY "products_select_authenticated"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "suppliers_select_authenticated" ON public.suppliers;
CREATE POLICY "suppliers_select_authenticated"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- 3. REVIEWS — anyone authenticated can read; users write their own
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "reviews_select_authenticated" ON public.reviews;
CREATE POLICY "reviews_select_authenticated"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. PROFILES — user can read/update only their own row
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- 5. USER_FAVORITES — fully scoped to owner
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "favorites_all_own" ON public.user_favorites;
CREATE POLICY "favorites_all_own"
  ON public.user_favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. SOURCING_REQUESTS — owner can insert/read their own
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sourcing_insert_own" ON public.sourcing_requests;
CREATE POLICY "sourcing_insert_own"
  ON public.sourcing_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sourcing_select_own" ON public.sourcing_requests;
CREATE POLICY "sourcing_select_own"
  ON public.sourcing_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7. USER_ACTIVITY — owner can insert/read their own
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "activity_insert_own" ON public.user_activity;
CREATE POLICY "activity_insert_own"
  ON public.user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_select_own" ON public.user_activity;
CREATE POLICY "activity_select_own"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 8. FULL-TEXT SEARCH (search_vector) for products & suppliers
-- ============================================================

-- ---- PRODUCTS ----
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
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
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C');

-- ---- SUPPLIERS ----
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.suppliers_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.supplied_products, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.platform, '')), 'C');
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
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(supplied_products, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(platform, '')), 'C');

-- ============================================================
-- 9. Performance indexes for ordering / joins
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_created_at   ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at  ON public.suppliers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id     ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_user_created ON public.sourcing_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id    ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_supplier_id   ON public.reviews(supplier_id);

-- ============================================================
-- 10. ADMIN write access to products & suppliers
--     Requires profiles.role IN ('admin', 'super_admin').
--     Admin server actions run as the logged-in user (anon key),
--     so they need explicit write policies here.
-- ============================================================
DROP POLICY IF EXISTS "products_admin_write" ON public.products;
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

DROP POLICY IF EXISTS "suppliers_admin_write" ON public.suppliers;
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

-- Admin can also read all profiles (needed for admin user management panel)
DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all"
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

-- Admin can update any profile (e.g. changing roles, plans)
DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
CREATE POLICY "profiles_admin_update_all"
  ON public.profiles FOR UPDATE
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

-- Admin can delete profiles
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admin can read all sourcing requests
DROP POLICY IF EXISTS "sourcing_admin_read_all" ON public.sourcing_requests;
CREATE POLICY "sourcing_admin_read_all"
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

-- Admin can read all reviews
DROP POLICY IF EXISTS "reviews_admin_write" ON public.reviews;
CREATE POLICY "reviews_admin_write"
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
