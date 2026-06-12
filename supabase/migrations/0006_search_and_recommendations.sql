-- 1. Add Description Columns
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add Full-Text Search to Suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create a function to update the search vector for suppliers
CREATE OR REPLACE FUNCTION suppliers_search_trigger() RETURNS trigger AS $$
BEGIN
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.platform, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.supplied_products, '')), 'D');
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_suppliers_search_update
BEFORE INSERT OR UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION suppliers_search_trigger();

-- Initialize search_vector for existing suppliers
UPDATE public.suppliers SET name = name;

-- Create GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_suppliers_search ON public.suppliers USING GIN(search_vector);


-- 3. Add Full-Text Search to Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create a function to update the search vector for products
CREATE OR REPLACE FUNCTION products_search_trigger() RETURNS trigger AS $$
BEGIN
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.niche, '')), 'C');
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_products_search_update
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION products_search_trigger();

-- Initialize search_vector for existing products
UPDATE public.products SET name = name;

-- Create GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN(search_vector);


-- 3. Create User Activity Table for Recommendations
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL, -- 'view_product', 'view_supplier', 'search'
  target_id uuid, -- ID of the product or supplier
  meta_data jsonb, -- search query or other details
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity" 
ON public.user_activity FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity" 
ON public.user_activity FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Function for Recommendations based on activity
CREATE OR REPLACE FUNCTION get_recommended_products(p_user_id UUID, p_limit INTEGER DEFAULT 4)
RETURNS SETOF public.products AS $$
BEGIN
  RETURN QUERY
  WITH recent_niches AS (
    -- Get niches from recently viewed products or searched terms
    SELECT DISTINCT p.niche
    FROM public.user_activity ua
    JOIN public.products p ON ua.target_id = p.id
    WHERE ua.user_id = p_user_id AND ua.activity_type = 'view_product'
    ORDER BY ua.created_at DESC
    LIMIT 5
  )
  SELECT p.*
  FROM public.products p
  WHERE p.niche IN (SELECT niche FROM recent_niches)
    AND p.id NOT IN (
      SELECT product_id FROM public.user_favorites WHERE user_id = p_user_id AND product_id IS NOT NULL
    )
  ORDER BY p.ai_score DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_recommended_suppliers(p_user_id UUID, p_limit INTEGER DEFAULT 4)
RETURNS SETOF public.suppliers AS $$
BEGIN
  RETURN QUERY
  WITH recent_categories AS (
    -- Get categories from recently viewed suppliers
    SELECT DISTINCT s.category
    FROM public.user_activity ua
    JOIN public.suppliers s ON ua.target_id = s.id
    WHERE ua.user_id = p_user_id AND ua.activity_type = 'view_supplier'
    ORDER BY ua.created_at DESC
    LIMIT 5
  )
  SELECT s.*
  FROM public.suppliers s
  WHERE s.category IN (SELECT category FROM recent_categories)
    AND s.id NOT IN (
      SELECT supplier_id FROM public.user_favorites WHERE user_id = p_user_id AND supplier_id IS NOT NULL
    )
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
