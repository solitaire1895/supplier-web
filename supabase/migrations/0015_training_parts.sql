-- ============================================================
-- 0015 — TRAINING PLAYLISTS (multiple videos per training)
-- ============================================================
-- A training of type 'video' can now hold MANY videos (a playlist).
-- Each row in training_parts is one playlist entry. Uploaded files
-- keep living in the private 'trainings' bucket (150 MB per file,
-- enforced by the app — Supabase also enforces its own per-file cap
-- depending on the plan tier).
-- ============================================================

-- 1. Training parts table
create table public.training_parts (
  id uuid default gen_random_uuid() primary key,
  training_id uuid references public.trainings(id) on delete cascade not null,
  position integer default 0 not null,
  title text,
  file_path text,
  external_url text,
  file_name text,
  file_size bigint,
  duration_minutes integer,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Index for the playlist order
create index if not exists training_parts_training_idx
  on public.training_parts (training_id, position asc);

-- 3. Enable RLS
alter table public.training_parts enable row level security;

-- 4. Policies (mirrors the trainings table)

-- Partner-plan users AND admins can read playlist parts
drop policy if exists "Partners and admins can view training parts" on public.training_parts;
create policy "Partners and admins can view training parts"
  on public.training_parts for select
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

-- Admins can manage playlist parts
drop policy if exists "Admins can manage training parts" on public.training_parts;
create policy "Admins can manage training parts"
  on public.training_parts for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- 5. Backfill: trainings that already have an uploaded video on the
--    parent row become a single-part playlist automatically, so the
--    whole system treats 'parts' as the single source for playlists.
insert into public.training_parts (training_id, position, file_path, file_name, file_size, duration_minutes)
select t.id, 0, t.file_path, t.file_name, t.file_size, t.duration_minutes
from public.trainings t
where t.type = 'video'
  and t.file_path is not null
  and not exists (
    select 1 from public.training_parts p where p.training_id = t.id
  );
