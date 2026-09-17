-- ============================================================
-- 0014 — TRAINING SYSTEM (Partner-plan exclusive content)
-- ============================================================
-- Trainings are premium content reserved for the highest plan
-- ('partenaire'). Files live in a PRIVATE storage bucket and are
-- served to eligible users via short-lived signed URLs generated
-- server-side (see lib/supabase/queries.ts getTrainings()).
-- ============================================================

-- 1. Trainings table
create table public.trainings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text not null check (type in ('document', 'video', 'link')),
  file_path text,              -- path inside the private 'trainings' bucket
  external_url text,           -- used when type = 'link' (YouTube, Vimeo...)
  file_name text,              -- original file name (display / download)
  file_size bigint,            -- size in bytes (display only)
  duration_minutes integer,
  sort_order integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Listing order index
create index if not exists trainings_sort_idx
  on public.trainings (sort_order asc, created_at desc);

-- 3. Enable RLS
alter table public.trainings enable row level security;

-- 4. Table policies
-- Partner-plan users AND admins can read training records.
-- (The application layer additionally blocks non-Partner users from
--  querying at all — this is the defense-in-depth layer.)
drop policy if exists "Partners and admins can view trainings" on public.trainings;
create policy "Partners and admins can view trainings"
  on public.trainings for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (
          active_plan = 'partenaire'
          or role in ('admin', 'super_admin')
        )
    )
  );

-- Admins can manage trainings
drop policy if exists "Admins can manage trainings" on public.trainings;
create policy "Admins can manage trainings"
  on public.trainings for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 5. PRIVATE storage bucket for training files
--    (no public access — files are only reachable through signed URLs)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('trainings', 'trainings', false)
on conflict (id) do update set public = false;

-- 6. Storage policies

-- Admins can upload training files
drop policy if exists "Admins upload training files" on storage.objects;
create policy "Admins upload training files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trainings'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Admins can replace training files
drop policy if exists "Admins update training files" on storage.objects;
create policy "Admins update training files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'trainings'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Admins can delete training files
drop policy if exists "Admins delete training files" on storage.objects;
create policy "Admins delete training files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trainings'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Partner-plan users and admins can read training files.
-- NOTE: this policy is what authorizes `createSignedUrl` for eligible
-- users on the private bucket. Signed URLs bypass RLS once generated,
-- which is why they are short-lived (1 hour) and only created server-side
-- after the plan check in getTrainings().
drop policy if exists "Partners and admins can read training files" on storage.objects;
create policy "Partners and admins can read training files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'trainings'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (
          active_plan = 'partenaire'
          or role in ('admin', 'super_admin')
        )
    )
  );
