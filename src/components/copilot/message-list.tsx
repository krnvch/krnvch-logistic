import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { UIMessage } from "ai";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: UIMessage[];
  busy: boolean;
  onExampleClick: (text: string) => void;
}

function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export function MessageList({
  messages,
  busy,
  onExampleClick,
}: MessageListProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];
  const showThinking =
    busy &&
    (!lastMessage || lastMessage.role === "user" || !messageText(lastMessage));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, showThinking]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-end gap-2 p-4">
        <p className="text-muted-foreground text-sm">
          {t("copilot.empty.title")}
        </p>
        {(["q1", "q2", "q3"] as const).map((key) => (
          <Button
            key={key}
            variant="outline"
            className="h-auto justify-start py-2 text-left font-sans whitespace-normal"
            onClick={() => onExampleClick(t(`copilot.empty.${key}`))}
          >
            {t(`copilot.empty.${key}`)}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-3 p-4">
        {messages.map((message) => {
          const text = messageText(message);
          if (!text) return null;
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] border-2 px-3 py-2 text-sm whitespace-pre-wrap",
                isUser
                  ? "bg-secondary text-secondary-foreground self-end"
                  : "bg-card text-card-foreground self-start"
              )}
            >
              {!isUser && (
                <Sparkles className="text-primary mr-1.5 mb-0.5 inline size-3.5" />
              )}
              {text}
            </div>
          );
        })}
        {showThinking && (
          <div className="text-muted-foreground flex items-center gap-2 self-start px-1 text-sm">
            <Loader2 className="size-3.5 animate-spin" />
            {t("copilot.thinking")}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
