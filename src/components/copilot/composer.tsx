import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function Composer({ disabled, onSend }: ComposerProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");

  const canSend = !disabled && text.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="flex items-end gap-2 border-t-2 p-4">
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
        placeholder={t("copilot.placeholder")}
        rows={2}
        className="max-h-32 min-h-9 resize-none"
        disabled={disabled}
      />
      <Button
        size="icon"
        aria-label={t("copilot.send")}
        onClick={submit}
        disabled={!canSend}
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  );
}
