-- ============================================================
-- Migration 0018: fix get_recommended_products / get_recommended_suppliers
-- ============================================================
-- Both functions used "SELECT DISTINCT x ... ORDER BY ua.created_at",
-- which Postgres rejects (42P10: ORDER BY expressions must appear in the
-- select list), so recommendations were always empty. The most recent
-- niches/categories are now picked with GROUP BY + max(created_at).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_recommended_products(p_user_id UUID, p_limit INTEGER DEFAULT 4)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  RETURN QUERY
  WITH recent_niches AS (
    SELECT p.niche
    FROM public.user_activity ua
    JOIN public.products p ON ua.target_id = p.id
    WHERE ua.user_id = p_user_id
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
      WHERE f.user_id = p_user_id AND f.product_id = p.id
    )
  ORDER BY p.ai_score DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit;
END;
$func$;

CREATE OR REPLACE FUNCTION public.get_recommended_suppliers(p_user_id UUID, p_limit INTEGER DEFAULT 4)
RETURNS SETOF public.suppliers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  RETURN QUERY
  WITH recent_categories AS (
    SELECT s.category
    FROM public.user_activity ua
    JOIN public.suppliers s ON ua.target_id = s.id
    WHERE ua.user_id = p_user_id
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
      WHERE f.user_id = p_user_id AND f.supplier_id = s.id
    )
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$func$;
