-- 1. Add full_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Update handle_new_user to include full_name from user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure reviews table exists (already exists from 0001, but just in case)
-- We don't need to recreate it if it exists.

-- 4. Enable RLS on reviews (if not already enabled)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- 6. Create clean policies for reviews
CREATE POLICY "Anyone can read reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Add a function to get average rating (optional but useful)
CREATE OR REPLACE FUNCTION get_average_rating(p_id UUID, is_product BOOLEAN)
RETURNS NUMERIC AS $$
BEGIN
  IF is_product THEN
    RETURN (SELECT AVG(rating) FROM public.reviews WHERE product_id = p_id);
  ELSE
    RETURN (SELECT AVG(rating) FROM public.reviews WHERE supplier_id = p_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
