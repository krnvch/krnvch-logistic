import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCopilot } from "./copilot-context";
import { MessageList } from "./message-list";
import { Composer } from "./composer";

const COPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot`;

const SHIPMENT_PATH = /^\/shipments\/([^/]+)$/;

// Push panel: a flex sibling of the routed page (see App.tsx), so opening
// it shrinks the page instead of overlaying it. Always mounted — the
// conversation survives close/open and route changes.
export default function Copilot() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { open, setOpen } = useCopilot();

  const shipmentId = location.pathname.match(SHIPMENT_PATH)?.[1];
  const locale = i18n.language === "ru" ? "ru" : "en";

  const transport = useMemo(
    () => new DefaultChatTransport({ api: COPILOT_URL }),
    []
  );

  const { messages, sendMessage, status } = useChat({
    transport,
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
          body: { shipmentId, locale },
        }
      );
    },
    [sendMessage, shipmentId, locale, t]
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
        <div className="flex items-start justify-between border-b-2 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading flex items-center gap-2 font-semibold">
              <Sparkles className="text-primary size-4" />
              {t("copilot.title")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("copilot.subtitle")}
            </p>
          </div>
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
