-- 0. Create a function to check if the current user is an admin or super_admin
-- Using SECURITY DEFINER to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. Add new columns to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS contact_url TEXT,
ADD COLUMN IF NOT EXISTS supplied_products TEXT;

-- 2. Update Profiles Policy to allow Admins to see all profiles
-- Drop existing policy first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or Admins can view all" ON public.profiles;

CREATE POLICY "Users can view their own profile or Admins can view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  public.is_admin()
);

-- 3. Fix RLS for Suppliers (Allow Admins full access)
DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;

CREATE POLICY "Admins can manage suppliers" 
ON public.suppliers 
FOR ALL 
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- 4. Fix RLS for Products (Allow Admins full access)
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);
