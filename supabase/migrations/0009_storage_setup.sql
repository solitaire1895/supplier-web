
-- 1. Ensure the bucket exists and is public
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

-- 2. Clean up existing policies to avoid "already exists" errors
-- Use a DO block for cleaner handling if needed, but simple drop statements are usually fine if permissions allow.
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Upload" on storage.objects;
drop policy if exists "Admin Update" on storage.objects;
drop policy if exists "Admin Delete" on storage.objects;
drop policy if exists "Authenticated Select" on storage.buckets;

-- 3. Bucket Policies
-- Allow authenticated users to see buckets (often required for the client to verify bucket existence)
create policy "Authenticated Select"
on storage.buckets for select
to authenticated
using ( true );

-- 4. Object Policies

-- Allow public access to read files in the 'uploads' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'uploads' );

-- Allow authenticated admins (admin or super_admin) to upload files
create policy "Admin Upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'uploads' AND
  exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role in ('admin', 'super_admin')
  )
);

-- Allow authenticated admins to update files
create policy "Admin Update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'uploads' AND
  exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role in ('admin', 'super_admin')
  )
);

-- Allow authenticated admins to delete files
create policy "Admin Delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'uploads' AND
  exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role in ('admin', 'super_admin')
  )
);
