import { useTranslation } from "react-i18next";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Action row under a finished assistant message (FR-CP-11).
// Copy only for Stage A; thumbs up/down join in Stage D (FR-CP-17).
export function MessageActions({ text }: { text: string }) {
  const { t } = useTranslation();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copilot.actions.copied"));
    } catch {
      toast.error(t("copilot.error.generic"));
    }
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
    </div>
  );
}
