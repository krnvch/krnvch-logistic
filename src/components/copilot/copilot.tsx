import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { Plus, Rabbit, Volume2, VolumeX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useChatThreads, fetchThreadMessages } from "@/hooks/use-chat-threads";
import { useCopilot } from "./copilot-context";
import { MessageList } from "./message-list";
import { Composer } from "./composer";
import { ThreadSwitcher } from "./thread-switcher";
import { rowsToUIMessages } from "./thread-utils";
import { autoApprovable, type ApprovalToolName } from "./approval-utils";
import {
  speak,
  speechSupported,
  stopSpeaking,
  stripMarkdownForSpeech,
  unspokenTail,
} from "./voice-utils";

const VOICE_KEY = "grida-mira-voice";

const COPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot`;

const SHIPMENT_PATH = /^\/shipments\/([^/]+)$/;

// Push panel: a flex sibling of the routed page (see App.tsx), so opening
// it shrinks the page instead of overlaying it. Always mounted — the
// conversation survives close/open and route changes. Threads persist
// server-side (GRD-124); the active thread id arrives on the response's
// x-thread-id header when the Edge Function creates one lazily.
export default function Copilot() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { open, setOpen } = useCopilot();
  const [threadId, setThreadId] = useState<string | null>(null);

  const { threads, deleteThread, refreshThreads } = useChatThreads(open);

  const shipmentId = location.pathname.match(SHIPMENT_PATH)?.[1];
  const locale = i18n.language === "ru" ? "ru" : "en";

  // Per-thread auto-allow list (FR-CP-15). Client state only — resets
  // with a new chat / thread switch; nothing persisted in Stage C.
  const [allowedTools, setAllowedTools] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  // Voice output (GRD-127): when on, Mira's finished answers are read
  // aloud via the OS speech synthesis. Persisted across sessions.
  const [voiceOn, setVoiceOn] = useState(
    () => speechSupported() && localStorage.getItem(VOICE_KEY) === "on"
  );
  // A message grows across approval continuations — track how much of
  // each message has been spoken so only the new tail is read.
  const spokenRef = useRef(new Map<string, number>());
  const voiceOnRef = useRef(voiceOn);

  const toggleVoice = useCallback(() => {
    setVoiceOn((prev) => {
      const next = !prev;
      voiceOnRef.current = next;
      localStorage.setItem(VOICE_KEY, next ? "on" : "off");
      if (!next) stopSpeaking();
      return next;
    });
  }, []);

  // Approval continuations are sent by the transport itself (no send()
  // call), so auth + context move into prepareSendMessagesRequest. The
  // ref keeps it reading CURRENT values without rebuilding the transport.
  const requestContext = useRef({ shipmentId, locale, threadId });
  useEffect(() => {
    requestContext.current = { shipmentId, locale, threadId };
  }, [shipmentId, locale, threadId]);

  const transport = useMemo(
    () =>
      // requestContext.current is read inside prepareSendMessagesRequest,
      // which runs at request time (event-ish), never during render; the
      // linter can't see past the useMemo factory boundary.
      // eslint-disable-next-line react-hooks/refs
      new DefaultChatTransport({
        api: COPILOT_URL,
        fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
          const res = await fetch(input, init);
          const id = res.headers.get("x-thread-id");
          if (id) setThreadId(id);
          return res;
        }) as typeof fetch,
        prepareSendMessagesRequest: async ({ messages, body }) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: { messages, ...requestContext.current, ...body },
          };
        },
      }),
    []
  );

  const { messages, sendMessage, status, setMessages, addToolResult } =
    useChat({
      transport,
      // HITL (GRD-125): once every tool call in the last step has an
      // output — i.e. the user decided on the approval card — the chat
      // resends itself so the Edge Function can execute and continue.
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      onFinish: ({ message }) => {
        // The exchange bumped the thread (or created one) — refresh the menu.
        refreshThreads();
        // Voice output: read the finished answer's NEW text aloud —
        // final text only, never reasoning or approval cards.
        if (voiceOnRef.current && message.role === "assistant") {
          const full = stripMarkdownForSpeech(
            message.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
          );
          const tail = unspokenTail(
            full,
            spokenRef.current.get(message.id) ?? 0
          );
          spokenRef.current.set(message.id, full.length);
          if (tail) speak(tail, requestContext.current.locale);
        }
      },
      onError: (error) => {
        // Gemini free-tier rate limit surfaces as a stream error chunk —
        // tell the user to wait instead of a generic "something broke".
        const isQuota =
          error.message.includes("quota") ||
          error.message.includes("RESOURCE_EXHAUSTED") ||
          error.message.includes("rate-limit") ||
          error.message.includes("rate limit");
        toast.error(
          error.message.includes("copilot_unavailable")
            ? t("copilot.error.unavailable")
            : isQuota
              ? t("copilot.error.quota")
              : t("copilot.error.generic")
        );
      },
    });

  const busy = status === "submitted" || status === "streaming";

  const send = useCallback(
    async (text: string) => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error(t("copilot.error.generic"));
        return;
      }
      stopSpeaking(); // don't talk over the user's new question
      void sendMessage({ text });
    },
    [sendMessage, t]
  );

  const decide = useCallback(
    (
      toolCallId: string,
      toolName: ApprovalToolName,
      decision: "approved" | "rejected",
      always = false
    ) => {
      if (always) {
        setAllowedTools((prev) => new Set(prev).add(toolName));
      }
      void addToolResult({
        tool: toolName,
        toolCallId,
        output: { decision },
      });
    },
    [addToolResult]
  );

  const revokeTool = useCallback((toolName: string) => {
    setAllowedTools((prev) => {
      const next = new Set(prev);
      next.delete(toolName);
      return next;
    });
  }, []);

  // Closing the panel silences Mira mid-sentence.
  useEffect(() => {
    if (!open) stopSpeaking();
  }, [open]);

  // Auto-approve allow-listed tools in the newest assistant message;
  // the card renders collapsed as "pre-approved".
  useEffect(() => {
    for (const part of autoApprovable(messages, allowedTools)) {
      void addToolResult({
        tool: part.toolName,
        toolCallId: part.toolCallId,
        output: { decision: "approved", auto: true },
      });
    }
  }, [messages, allowedTools, addToolResult]);

  const newChat = useCallback(() => {
    if (busy) return;
    stopSpeaking();
    spokenRef.current.clear();
    setMessages([]);
    setThreadId(null);
    setAllowedTools(new Set());
  }, [busy, setMessages]);

  const switchThread = useCallback(
    async (id: string) => {
      if (busy || id === threadId) return;
      try {
        const rows = await fetchThreadMessages(id);
        stopSpeaking();
        setMessages(rowsToUIMessages(rows));
        setThreadId(id);
        setAllowedTools(new Set());
      } catch {
        toast.error(t("copilot.error.generic"));
      }
    },
    [busy, threadId, setMessages, t]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteThread(id);
      if (id === threadId) {
        setMessages([]);
        setThreadId(null);
        setAllowedTools(new Set());
      }
    },
    [deleteThread, threadId, setMessages]
  );

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "bg-background shrink-0 overflow-hidden border-l-2 transition-[width] duration-300 ease-in-out",
        open ? "w-full sm:w-[30rem]" : "w-0 border-l-0"
      )}
    >
      <div className="flex h-full w-screen flex-col sm:w-[30rem]">
        <div className="flex items-center gap-1.5 border-b-2 p-3">
          <Rabbit className="text-primary size-4 shrink-0" />
          <span className="font-heading shrink-0 text-sm font-semibold">
            {t("copilot.title")}
          </span>
          <span className="text-muted-foreground/40 shrink-0">/</span>
          <ThreadSwitcher
            threads={threads}
            currentThreadId={threadId}
            disabled={busy}
            onSelect={switchThread}
            onNew={newChat}
            onDelete={handleDelete}
          />
          <div className="flex-1" />
          {speechSupported() && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                voiceOn ? t("copilot.voice.off") : t("copilot.voice.on")
              }
              aria-pressed={voiceOn}
              className={cn(voiceOn && "text-primary")}
              onClick={toggleVoice}
            >
              {voiceOn ? (
                <Volume2 className="size-4" />
              ) : (
                <VolumeX className="size-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("copilot.thread.new")}
            onClick={newChat}
            disabled={busy || (messages.length === 0 && !threadId)}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("copilot.close")}
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <MessageList
          messages={messages}
          busy={busy}
          threadId={threadId}
          onExampleClick={send}
          onDecide={decide}
        />

        <Composer
          disabled={busy}
          onSend={send}
          allowedTools={allowedTools}
          onRevokeTool={revokeTool}
        />
      </div>
    </aside>
  );
}
