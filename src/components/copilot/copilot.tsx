import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Plus, Sparkles, X } from "lucide-react";
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

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: COPILOT_URL,
        fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
          const res = await fetch(input, init);
          const id = res.headers.get("x-thread-id");
          if (id) setThreadId(id);
          return res;
        }) as typeof fetch,
      }),
    []
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onFinish: () => {
      // The exchange bumped the thread (or created one) — refresh the menu.
      refreshThreads();
    },
    onError: (error) => {
      toast.error(
        error.message.includes("copilot_unavailable")
          ? t("copilot.error.unavailable")
          : t("copilot.error.generic")
      );
    },
  });

  const busy = status === "submitted" || status === "streaming";

  const send = useCallback(
    async (text: string) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        toast.error(t("copilot.error.generic"));
        return;
      }
      void sendMessage(
        { text },
        {
          headers: { Authorization: `Bearer ${token}` },
          body: { shipmentId, locale, threadId },
        }
      );
    },
    [sendMessage, shipmentId, locale, threadId, t]
  );

  const newChat = useCallback(() => {
    if (busy) return;
    setMessages([]);
    setThreadId(null);
  }, [busy, setMessages]);

  const switchThread = useCallback(
    async (id: string) => {
      if (busy || id === threadId) return;
      try {
        const rows = await fetchThreadMessages(id);
        setMessages(rowsToUIMessages(rows));
        setThreadId(id);
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
          <Sparkles className="text-primary size-4 shrink-0" />
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

        <MessageList messages={messages} busy={busy} onExampleClick={send} />

        <Composer disabled={busy} onSend={send} />
      </div>
    </aside>
  );
}
