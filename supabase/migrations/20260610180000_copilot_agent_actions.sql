-- ============================================================
-- Mira Stage C (GRD-125): agent_actions audit + idempotent
-- message persistence
-- ============================================================
-- 1) agent_actions — audit log of every write Mira performs (PRD §4a).
--    Insert-only from the copilot Edge Function under the CALLER's JWT;
--    each user can read only their own rows. Every approval decision is
--    recorded, including rejections and failed executions.
-- 2) chat_messages.message_id — the AI SDK UIMessage id. The HITL
--    approval flow finishes one assistant message across TWO requests
--    (tool call → approval → continuation), so persistence becomes an
--    upsert keyed by (thread_id, message_id) instead of blind inserts.
-- ============================================================

CREATE TABLE public.agent_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id   uuid REFERENCES public.chat_threads(id) ON DELETE SET NULL,
  tool_name   text NOT NULL,
  args        jsonb NOT NULL,
  result      text NOT NULL CHECK (result IN ('approved', 'rejected', 'error')),
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agent_actions_user_created_idx
  ON public.agent_actions (user_id, created_at DESC);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

-- Users write and read only their own audit rows. No UPDATE/DELETE
-- policy on purpose: an audit log is append-only.
CREATE POLICY "agent_actions_insert_own"
  ON public.agent_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "agent_actions_select_own"
  ON public.agent_actions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.agent_actions FROM anon;

-- Idempotent persistence: the same UIMessage is saved twice when an
-- approval continues a turn, so writes become upserts on
-- (thread_id, message_id). Pre-Stage-C rows are backfilled with their
-- own row id — that is exactly the id the client replayed them under.
-- The index is total (not partial): PostgREST's ON CONFLICT cannot
-- target partial unique indexes.
ALTER TABLE public.chat_messages ADD COLUMN message_id text;
UPDATE public.chat_messages SET message_id = id::text;
ALTER TABLE public.chat_messages ALTER COLUMN message_id SET NOT NULL;

CREATE UNIQUE INDEX chat_messages_thread_message_uidx
  ON public.chat_messages (thread_id, message_id);
