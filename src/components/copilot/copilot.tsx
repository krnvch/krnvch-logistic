import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { MessageList } from "./message-list";
import { Composer } from "./composer";

const COPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot`;

const SHIPMENT_PATH = /^\/shipments\/([^/]+)$/;

export default function Copilot() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);

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
    <>
      <Button
        size="icon-lg"
        className="fixed right-6 bottom-6 z-40"
        aria-label={t("copilot.launcher.aria")}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b-2">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" />
              {t("copilot.title")}
            </SheetTitle>
            <SheetDescription>{t("copilot.subtitle")}</SheetDescription>
          </SheetHeader>

          <MessageList messages={messages} busy={busy} onExampleClick={send} />

          <Composer disabled={busy} onSend={send} />
        </SheetContent>
      </Sheet>
    </>
  );
}
