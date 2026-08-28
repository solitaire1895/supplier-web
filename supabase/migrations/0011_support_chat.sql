-- ============================================================
-- Support Chat System — conversations + messages
-- Replaces the simple support_feedback form with a real chat.
-- Used by app/dashboard/support/page.tsx (user) and the admin
-- Support tab in components/admin/admin-dashboard-client.tsx
-- ============================================================

-- 1. CONVERSATIONS TABLE
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default 'Support Request',
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. MESSAGES TABLE
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 3. INDEXES
create index if not exists support_conversations_user_id_idx
  on public.support_conversations (user_id);

create index if not exists support_conversations_status_idx
  on public.support_conversations (status);

create index if not exists support_conversations_updated_at_idx
  on public.support_conversations (updated_at desc);

create index if not exists support_messages_conversation_id_idx
  on public.support_messages (conversation_id);

create index if not exists support_messages_created_at_idx
  on public.support_messages (created_at);

-- 4. ROW LEVEL SECURITY

-- ── support_conversations ──
alter table public.support_conversations enable row level security;

-- Users can insert their own conversations
drop policy if exists "Users can insert own conversations" on public.support_conversations;
create policy "Users can insert own conversations"
  on public.support_conversations for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can read their own conversations
drop policy if exists "Users can read own conversations" on public.support_conversations;
create policy "Users can read own conversations"
  on public.support_conversations for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can update their own conversations (e.g. change subject)
drop policy if exists "Users can update own conversations" on public.support_conversations;
create policy "Users can update own conversations"
  on public.support_conversations for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can read ALL conversations
drop policy if exists "Admins can read all conversations" on public.support_conversations;
create policy "Admins can read all conversations"
  on public.support_conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'super_admin')
    )
  );

-- Admins can update any conversation (e.g. mark resolved)
drop policy if exists "Admins can update any conversation" on public.support_conversations;
create policy "Admins can update any conversation"
  on public.support_conversations for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'super_admin')
    )
  );

-- ── support_messages ──
alter table public.support_messages enable row level security;

-- Users can insert messages into their own conversations
drop policy if exists "Users can insert own messages" on public.support_messages;
create policy "Users can insert own messages"
  on public.support_messages for insert
  to authenticated
  with check (
    sender_role = 'user'
    and auth.uid() = sender_id
    and exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

-- Users can read messages from their own conversations
drop policy if exists "Users can read own messages" on public.support_messages;
create policy "Users can read own messages"
  on public.support_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

-- Admins can read ALL messages
drop policy if exists "Admins can read all messages" on public.support_messages;
create policy "Admins can read all messages"
  on public.support_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'super_admin')
    )
  );

-- Admins can insert messages into any conversation
drop policy if exists "Admins can insert messages" on public.support_messages;
create policy "Admins can insert messages"
  on public.support_messages for insert
  to authenticated
  with check (
    sender_role = 'admin'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(p.role) in ('admin', 'super_admin')
    )
  );

-- 5. REALTIME
-- Enables live chat updates for both users and admins.
alter publication supabase_realtime add table public.support_conversations;
alter publication supabase_realtime add table public.support_messages;

-- 6. HELPER: auto-update conversation.updated_at on new message
-- Keeps the conversation list sorted by latest activity.
create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.support_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_insert_update_conversation
  on public.support_messages;

create trigger on_message_insert_update_conversation
  after insert on public.support_messages
  for each row
  execute function public.update_conversation_timestamp();