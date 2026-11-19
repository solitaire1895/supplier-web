-- ============================================================
-- Migration 0022: Nexus AI assistant, daily message counter
-- ============================================================
-- One row per user per day (Africa/Douala calendar day, computed by the app).
-- Only the server (service role) reads or writes it: RLS is on with no policies.
--
-- consume_assistant_message() checks the limit and counts the message in ONE
-- statement, so two requests at the same moment cannot both pass the last slot.
-- refund_assistant_message() gives the message back when the AI failed before
-- answering.
--
-- Run once in the Supabase SQL editor. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assistant_usage (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day     date NOT NULL,
  count   integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (user_id, day)
);

ALTER TABLE public.assistant_usage ENABLE ROW LEVEL SECURITY;

-- Returns the new count, or NULL when the user is already at the limit.
CREATE OR REPLACE FUNCTION public.consume_assistant_message(p_user_id uuid, p_day date, p_limit integer)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $func$
  INSERT INTO public.assistant_usage AS u (user_id, day, count)
  SELECT p_user_id, p_day, 1
  WHERE p_limit > 0
  ON CONFLICT (user_id, day) DO UPDATE
    SET count = u.count + 1
    WHERE u.count < p_limit
  RETURNING count;
$func$;

CREATE OR REPLACE FUNCTION public.refund_assistant_message(p_user_id uuid, p_day date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $func$
  UPDATE public.assistant_usage
  SET count = count - 1
  WHERE user_id = p_user_id AND day = p_day AND count > 0;
$func$;

REVOKE ALL ON FUNCTION public.consume_assistant_message(uuid, date, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_assistant_message(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_assistant_message(uuid, date, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_assistant_message(uuid, date) TO service_role;
