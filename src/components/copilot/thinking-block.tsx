import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

// Collapsible thinking block (FR-CP-16, Wally pattern): Mira's reasoning
// renders above the answer, collapsed by default. While the model is
// still thinking the label pulses; expanding shows the raw thoughts as
// a quoted, muted timeline. Messages without reasoning render nothing.
interface ThinkingBlockProps {
  text: string;
  streaming: boolean;
}

export function ThinkingBlock({ text, streaming }: ThinkingBlockProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1 py-0.5">
      <button
        type="button"
        className={cn(
          "text-muted-foreground hover:text-foreground flex items-center gap-2 self-start text-sm transition-colors",
          streaming && "animate-pulse"
        )}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Brain className="size-3.5 shrink-0" />
        <span>
          {streaming ? t("copilot.thinking") : t("copilot.thought.title")}
        </span>
        {open ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
      </button>
      {open && (
        <div className="text-muted-foreground border-l-2 pl-3 text-sm [&_p]:my-1">
          <Markdown text={text} />
        </div>
      )}
    </div>
  );
}
