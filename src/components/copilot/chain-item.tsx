import { useTranslation } from "react-i18next";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// One line of Mira's activity chain (FR-CP-13): what tool ran and its state.
// Flat for now (one tool); the API leaves room for the Wally nested/metric
// variants — children below the label, a right-aligned metric slot.
export type ChainState = "working" | "done" | "error";

interface ChainItemProps {
  toolName: string;
  state: ChainState;
  metric?: string;
}

export function ChainItem({ toolName, state, metric }: ChainItemProps) {
  const { t } = useTranslation();

  const label =
    state === "error"
      ? t("copilot.chain.error")
      : t(`copilot.chain.${toolName}.${state}`, {
          defaultValue: t(`copilot.chain.generic.${state}`),
        });

  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center gap-2 py-0.5 text-sm",
        state === "error" && "text-destructive"
      )}
    >
      {state === "working" ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
      ) : state === "error" ? (
        <X className="size-3.5 shrink-0" />
      ) : (
        <Search className="size-3.5 shrink-0" />
      )}
      <span
        className={cn("min-w-0 flex-1", state === "working" && "animate-pulse")}
      >
        {label}
      </span>
      {metric && <span className="shrink-0 text-xs">{metric}</span>}
    </div>
  );
}
