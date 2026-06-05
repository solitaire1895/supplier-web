-- 1. Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  stripe_customer_id text,
  active_plan text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Suppliers Table
create table public.suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  platform text,
  category text,
  moq integer default 1,
  status text default 'active',
  image_url text,
  contact_info jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Products Table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  niche text,
  category text,
  margin text,
  demand text,
  buy_price numeric,
  sell_price numeric,
  image_url text,
  ai_score integer,
  is_trending boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create User Favorites Table (Junction)
create table public.user_favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint one_favorite_target check (
    (product_id is not null and supplier_id is null) or
    (product_id is null and supplier_id is not null)
  )
);

-- 5. Create Reviews Table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete cascade,
  rating integer check (rating >= 1 and rating <= 5),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint one_review_target check (
    (product_id is not null and supplier_id is null) or
    (product_id is null and supplier_id is not null)
  )
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.user_favorites enable row level security;
alter table public.reviews enable row level security;

-- Policies for Profiles
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Policies for Suppliers & Products
create policy "Public can view suppliers" on public.suppliers for select using (true);
create policy "Admins can manage suppliers" on public.suppliers for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Public can view products" on public.products for select using (true);
create policy "Admins can manage products" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Policies for Favorites
create policy "Users can manage their own favorites" on public.user_favorites for all using (auth.uid() = user_id);

-- Policies for Reviews
create policy "Anyone can read reviews" on public.reviews for select using (true);
create policy "Users can manage their own reviews" on public.reviews for all using (auth.uid() = user_id);

-- Profile Sync Trigger
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
