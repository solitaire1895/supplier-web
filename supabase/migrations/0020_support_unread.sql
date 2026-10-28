-- ============================================================
-- Migration 0020: in-app support notifications (unread tracking)
-- ============================================================
-- Each conversation remembers when the customer and the support team
-- last read it. A message is unread for one side when the OTHER side
-- sent it after that side's last read.
--
-- Run once in the Supabase SQL editor. Idempotent.
-- ============================================================

ALTER TABLE public.support_conversations
  ADD COLUMN IF NOT EXISTS user_last_read_at  timestamptz,
  ADD COLUMN IF NOT EXISTS admin_last_read_at timestamptz;

-- Existing history counts as read, so nobody gets a flood of old "new" messages.
UPDATE public.support_conversations
SET user_last_read_at  = COALESCE(user_last_read_at, now()),
    admin_last_read_at = COALESCE(admin_last_read_at, now());

CREATE INDEX IF NOT EXISTS support_messages_conversation_created_idx
  ON public.support_messages (conversation_id, created_at);

-- ------------------------------------------------------------
-- Unread counts for the caller, per conversation.
--   scope 'user'  : admin replies in the caller's own conversations
--   scope 'admin' : customer messages in any conversation (admins only)
-- SECURITY INVOKER: the existing RLS policies decide what is visible.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.support_unread()
RETURNS TABLE (conversation_id uuid, scope text, unread integer, last_message_at timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $func$
  SELECT c.id, 'user'::text, count(m.id)::int, max(m.created_at)
  FROM public.support_conversations c
  JOIN public.support_messages m ON m.conversation_id = c.id
  WHERE c.user_id = auth.uid()
    AND m.sender_role = 'admin'
    AND m.created_at > COALESCE(c.user_last_read_at, '-infinity'::timestamptz)
  GROUP BY c.id
  UNION ALL
  SELECT c.id, 'admin'::text, count(m.id)::int, max(m.created_at)
  FROM public.support_conversations c
  JOIN public.support_messages m ON m.conversation_id = c.id
  WHERE public.is_admin()
    AND m.sender_role = 'user'
    AND m.created_at > COALESCE(c.admin_last_read_at, '-infinity'::timestamptz)
  GROUP BY c.id;
$func$;

REVOKE ALL ON FUNCTION public.support_unread() FROM public;
GRANT EXECUTE ON FUNCTION public.support_unread() TO authenticated;

-- ------------------------------------------------------------
-- Mark a conversation read for one side. Only touches the read
-- marker, so it cannot be used to change anything else.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_support_read(p_conversation_id uuid, p_scope text DEFAULT 'user')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF p_scope = 'admin' THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
    END IF;
    UPDATE public.support_conversations
    SET admin_last_read_at = now()
    WHERE id = p_conversation_id;
  ELSE
    UPDATE public.support_conversations
    SET user_last_read_at = now()
    WHERE id = p_conversation_id
      AND user_id = auth.uid();
  END IF;
END;
$func$;

REVOKE ALL ON FUNCTION public.mark_support_read(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_support_read(uuid, text) TO authenticated;
