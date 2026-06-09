-- ============================================================
-- MIRA STAGE B: persistent chat threads  (GRD-124, AD-Copilot-05)
-- ============================================================
-- Two tables back Mira's chat history:
--   chat_threads   — one row per conversation
--   chat_messages  — AI SDK UIMessage parts stored VERBATIM as jsonb
--
-- Why verbatim parts (AD-Copilot-05): the parts array is the lossless
-- representation of a turn — text, tool calls with inputs/outputs,
-- reasoning, approval states. Replaying history re-renders activity
-- chains and (Stage C) approval cards with zero mapping code, and new
-- part types need no migration.
--
-- Security model: owner-only RLS on both tables. The copilot Edge
-- Function reads/writes them with the CALLER's JWT — no service role,
-- so these policies are the only access path that matters.
-- ============================================================

CREATE TABLE public.chat_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  -- context hint only; the thread outlives the shipment
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  parts      jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_threads_user_recency_idx
  ON public.chat_threads (user_id, updated_at DESC);

CREATE INDEX chat_messages_thread_idx
  ON public.chat_messages (thread_id, created_at);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Owner-only: a user sees and touches only their own threads.
CREATE POLICY "chat_threads_owner"
  ON public.chat_threads
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Messages inherit ownership from their thread.
CREATE POLICY "chat_messages_owner"
  ON public.chat_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id AND t.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id AND t.user_id = (SELECT auth.uid())
    )
  );

-- anon never touches chat data.
REVOKE ALL ON public.chat_threads FROM anon;
REVOKE ALL ON public.chat_messages FROM anon;
