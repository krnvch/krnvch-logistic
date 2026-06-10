import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, SendHorizontal, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
  /** Per-thread auto-allowed write tools (FR-CP-15). */
  allowedTools: ReadonlySet<string>;
  onRevokeTool: (toolName: string) => void;
}

// Permission settings (Wally pattern): an icon in the input row opens
// the session allow-list; unchecking revokes auto-approval.
function PermissionSettings({
  allowedTools,
  onRevokeTool,
}: Pick<ComposerProps, "allowedTools" | "onRevokeTool">) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("copilot.permissions.label")}
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuLabel>{t("copilot.permissions.title")}</DropdownMenuLabel>
        {allowedTools.size === 0 ? (
          <p className="text-muted-foreground px-2 py-1.5 text-xs">
            {t("copilot.permissions.empty")}
          </p>
        ) : (
          [...allowedTools].map((toolName) => (
            <DropdownMenuCheckboxItem
              key={toolName}
              checked
              onCheckedChange={() => onRevokeTool(toolName)}
            >
              {t(`copilot.permissions.tool.${toolName}`, {
                defaultValue: toolName,
              })}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Composer({
  disabled,
  onSend,
  allowedTools,
  onRevokeTool,
}: ComposerProps) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState("");

  // Push-to-talk (GRD-127): hold the mic, speak, release — the live
  // transcript lands in the textarea for review before sending. The
  // text present when the mic was pressed is kept as a prefix.
  const baseTextRef = useRef("");
  const { supported, listening, start, stop } = useSpeechRecognition(
    i18n.language,
    (transcript) => {
      const base = baseTextRef.current;
      setText(base ? `${base} ${transcript}` : transcript);
    }
  );

  function micDown() {
    if (disabled || listening) return;
    baseTextRef.current = text.trim();
    start();
  }

  const canSend = !disabled && text.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="border-t-2 p-4 pb-2">
      <div className="flex items-end gap-2">
        <PermissionSettings
          allowedTools={allowedTools}
          onRevokeTool={onRevokeTool}
        />
        <Textarea
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setText(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            listening ? t("copilot.voice.listening") : t("copilot.placeholder")
          }
          rows={2}
          className="max-h-32 min-h-9 resize-none"
          disabled={disabled}
        />
        {supported && (
          <Button
            variant={listening ? "default" : "outline"}
            size="icon"
            aria-label={t("copilot.voice.holdToTalk")}
            aria-pressed={listening}
            className={cn("touch-none", listening && "animate-pulse")}
            disabled={disabled}
            onPointerDown={micDown}
            onPointerUp={stop}
            onPointerLeave={stop}
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
          >
            <Mic className="size-4" />
          </Button>
        )}
        <Button
          size="icon"
          aria-label={t("copilot.send")}
          onClick={submit}
          disabled={!canSend}
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
      <p className="text-muted-foreground/70 mt-2 text-xs">
        {t("copilot.disclaimer")}
      </p>
    </div>
  );
}
