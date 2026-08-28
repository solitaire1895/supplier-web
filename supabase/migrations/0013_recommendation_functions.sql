-- ============================================================
-- Recommendation Functions — get_recommended_products & get_recommended_suppliers
-- These functions are called by lib/supabase/queries.ts and lib/supabase/actions.ts
-- via .rpc(). If they don't exist, the app logs PGRST202 errors.
-- This migration is idempotent (safe to run multiple times).
-- ============================================================

-- 1. Ensure user_activity table exists (from 0006, in case it wasn't run)
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  target_id uuid,
  meta_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_activity if not already enabled
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Policies (drop + recreate to avoid duplicates)
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity;
CREATE POLICY "Users can insert their own activity"
  ON public.user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. get_recommended_products function
CREATE OR REPLACE FUNCTION public.get_recommended_products(p_user_id UUID, p_limit INTEGER DEFAULT 4)
RETURNS SETOF public.products AS $$
BEGIN
  RETURN QUERY
  WITH recent_niches AS (
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
  ORDER BY p.ai_score DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_recommended_suppliers function
CREATE OR REPLACE FUNCTION public.get_recommended_suppliers(p_user_id UUID, p_limit INTEGER DEFAULT 4)
RETURNS SETOF public.suppliers AS $$
BEGIN
  RETURN QUERY
  WITH recent_categories AS (
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