-- ============================================================
-- Support Feedback — schema, security, and realtime
-- Matches app/dashboard/support/page.tsx and the admin Support tab
-- ============================================================

-- 1. TABLE
create table if not exists public.support_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating int not null check (rating >= 1 and rating <= 5),
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists support_feedback_user_id_idx
  on public.support_feedback (user_id);
create index if not exists support_feedback_created_at_idx
  on public.support_feedback (created_at desc);

-- 2. ROW LEVEL SECURITY
alter table public.support_feedback enable row level security;

-- Users can insert their own feedback
drop policy if exists "Users can insert own feedback" on public.support_feedback;
create policy "Users can insert own feedback"
  on public.support_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can read their own feedback
drop policy if exists "Users can read own feedback" on public.support_feedback;
create policy "Users can read own feedback"
  on public.support_feedback for select
  to authenticated
  using (auth.uid() = user_id);

-- Admins can read ALL feedback (for the admin Support tab)
drop policy if exists "Admins can read all feedback" on public.support_feedback;
create policy "Admins can read all feedback"
  on public.support_feedback for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'super_admin')
    )
  );

-- Admins can update feedback status (open -> resolved)
drop policy if exists "Admins can update feedback" on public.support_feedback;
create policy "Admins can update feedback"
  on public.support_feedback for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'super_admin')
    )
  );

-- 3. REALTIME
-- Enables the postgres_changes subscriptions used on both
-- the user support page and the admin Support tab.
alter publication supabase_realtime add table public.support_feedback;
