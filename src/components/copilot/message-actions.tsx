import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

// Action row under a finished assistant message (FR-CP-11 + FR-CP-17).
// Votes are analytics events only (PostHog copilot_feedback) — no DB
// table unless Langfuse (GRD-121) wants them paired with traces.
interface MessageActionsProps {
  text: string;
  messageId: string;
  threadId: string | null;
}

export function MessageActions({
  text,
  messageId,
  threadId,
}: MessageActionsProps) {
  const { t } = useTranslation();
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copilot.actions.copied"));
    } catch {
      toast.error(t("copilot.error.generic"));
    }
  }

  function sendVote(next: "up" | "down") {
    if (vote === next) return; // already counted
    setVote(next);
    track("copilot_feedback", {
      vote: next,
      message_id: messageId,
      thread_id: threadId,
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={t("copilot.actions.copy")}
        className="text-muted-foreground hover:text-foreground"
        onClick={copy}
      >
        <Copy />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={t("copilot.actions.thumbsUp")}
        aria-pressed={vote === "up"}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          vote === "up" && "text-foreground"
        )}
        onClick={() => sendVote("up")}
      >
        <ThumbsUp className={cn(vote === "up" && "fill-current")} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={t("copilot.actions.thumbsDown")}
        aria-pressed={vote === "down"}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          vote === "down" && "text-foreground"
        )}
        onClick={() => sendVote("down")}
      >
        <ThumbsDown className={cn(vote === "down" && "fill-current")} />
      </Button>
    </div>
  );
}
