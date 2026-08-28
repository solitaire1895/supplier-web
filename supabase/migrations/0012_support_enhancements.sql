-- ============================================================
-- Support Chat Enhancements — categories, ticket IDs, agent assignment
-- Extends the support_conversations table from 0011_support_chat.sql
-- ============================================================

-- 1. ADD COLUMNS (idempotent — uses do blocks to check existence)

-- category column
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'support_conversations'
      and column_name = 'category'
  ) then
    alter table public.support_conversations
      add column category text;
  end if;
end $$;

-- ticket_id column with auto-generated value
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'support_conversations'
      and column_name = 'ticket_id'
  ) then
    alter table public.support_conversations
      add column ticket_id text unique default ('TKT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)));
  end if;
end $$;

-- assigned_agent column
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'support_conversations'
      and column_name = 'assigned_agent'
  ) then
    alter table public.support_conversations
      add column assigned_agent text;
  end if;
end $$;

-- 2. UPDATE STATUS CONSTRAINT to support 4 statuses
-- Drop old constraint and add new one
alter table public.support_conversations drop constraint if exists support_conversations_status_check;
alter table public.support_conversations
  add constraint support_conversations_status_check
  check (status in ('open', 'waiting', 'resolved', 'closed'));

-- 3. INDEXES
create index if not exists support_conversations_ticket_id_idx
  on public.support_conversations (ticket_id);

create index if not exists support_conversations_category_idx
  on public.support_conversations (category);

create index if not exists support_conversations_assigned_agent_idx
  on public.support_conversations (assigned_agent);

-- 4. UPDATE RLS POLICIES
-- Users can still only see their own conversations (already set in 0011)
-- Admins can still see all (already set in 0011)
-- No policy changes needed — existing policies cover the new columns automatically.

-- 5. REALTIME (already enabled in 0011, no changes needed)