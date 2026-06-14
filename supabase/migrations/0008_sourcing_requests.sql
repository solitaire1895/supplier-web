-- Create Sourcing Requests Table
CREATE TABLE IF NOT EXISTS public.sourcing_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  status text DEFAULT 'contacted' CHECK (status IN ('contacted', 'negotiating', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sourcing_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own sourcing requests" 
ON public.sourcing_requests FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sourcing requests" 
ON public.sourcing_requests FOR SELECT 
USING (
  exists (select 1 from public.profiles where id = auth.uid() and role IN ('admin', 'super_admin'))
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sourcing_user ON public.sourcing_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_supplier ON public.sourcing_requests(supplier_id);
