import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { UIMessage } from "ai";
import { Loader2, Rabbit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCopilot } from "./copilot-context";
import { ChainItem, type ChainState } from "./chain-item";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { ApprovalCard, type ApprovalDecideHandler } from "./approval-card";
import { asApprovalPart } from "./approval-utils";
import { ThinkingBlock } from "./thinking-block";
import { mergeAdjacentReasoning } from "./reasoning-utils";

interface MessageListProps {
  messages: UIMessage[];
  busy: boolean;
  threadId: string | null;
  onExampleClick: (text: string) => void;
  onDecide: ApprovalDecideHandler;
}

type UIPart = UIMessage["parts"][number];

function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function toolPartInfo(
  part: UIPart
): { name: string; state: ChainState } | null {
  const isStatic = part.type.startsWith("tool-");
  if (!isStatic && part.type !== "dynamic-tool") return null;
  const raw = part as unknown as { toolName?: string; state?: string };
  const name = isStatic
    ? part.type.slice("tool-".length)
    : (raw.toolName ?? "");
  const state: ChainState =
    raw.state === "output-error"
      ? "error"
      : raw.state === "output-available"
        ? "done"
        : "working";
  return { name, state };
}

// Chain metric slot (FR-CP-13/Stage D): a compact right-aligned figure
// for tools whose result has an obvious headline number.
function toolMetric(
  part: UIPart,
  t: (key: string, options?: Record<string, unknown>) => string
): string | undefined {
  if (part.type !== "tool-get_shipment_overview") return undefined;
  const raw = part as unknown as {
    state?: string;
    output?: { total_orders?: number };
  };
  if (raw.state !== "output-available") return undefined;
  const count = raw.output?.total_orders;
  return typeof count === "number"
    ? t("copilot.chain.ordersMetric", { count })
    : undefined;
}

// Greeting + suggestion pills (FR-CP-10) — shown while the thread is empty.
function Greeting({ onPick }: { onPick: (text: string) => void }) {
  const { t } = useTranslation();
  const { firstName } = useCopilot();

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 p-4">
      <div className="flex flex-col gap-3">
        <Rabbit className="text-primary size-7" />
        <h3 className="font-heading text-lg font-semibold">
          {firstName
            ? t("copilot.greeting", { name: firstName })
            : t("copilot.greetingPlain")}
        </h3>
        <p className="text-muted-foreground text-sm">{t("copilot.subtitle")}</p>
      </div>
      <div className="flex flex-col items-start gap-2">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {t("copilot.empty.title")}
        </p>
        {(["q1", "q2", "q3"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border px-2.5 py-1 text-left text-sm transition-colors"
            onClick={() => onPick(t(`copilot.empty.${key}`))}
          >
            {t(`copilot.empty.${key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  busy,
  threadId,
  onExampleClick,
  onDecide,
}: MessageListProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];
  // The global spinner only covers the gap before ANYTHING renders —
  // once reasoning/tool/text parts stream, they carry their own state.
  const hasVisibleParts =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some(
      (p) =>
        (p.type === "text" && p.text) ||
        (p.type === "reasoning" &&
          (p as unknown as { text?: string }).text?.trim()) ||
        p.type.startsWith("tool-")
    );
  const showThinking =
    busy && (!lastMessage || lastMessage.role === "user" || !hasVisibleParts);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, showThinking]);

  if (messages.length === 0) {
    return <Greeting onPick={onExampleClick} />;
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-3 p-4">
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <div
                key={message.id}
                className="bg-secondary text-secondary-foreground max-w-[85%] self-end border-2 px-3 py-2 text-sm whitespace-pre-wrap"
              >
                {messageText(message)}
              </div>
            );
          }

          // Assistant: no bubble (FR-CP-09) — chain items and markdown
          // blocks render in stream order on the panel background.
          const isStreaming = busy && message === lastMessage;
          const text = messageText(message);
          return (
            <div key={message.id} className="flex flex-col gap-0.5">
              {mergeAdjacentReasoning(message.parts).map((part, i) => {
                if (part.type === "text") {
                  return part.text ? (
                    <Markdown key={i} text={part.text} />
                  ) : null;
                }
                // Mira's reasoning → collapsible thinking block (FR-CP-16).
                if (part.type === "reasoning" && "streaming" in part) {
                  return (
                    <ThinkingBlock
                      key={i}
                      text={part.text}
                      streaming={part.streaming}
                    />
                  );
                }
                // Write tools render as approval cards (FR-CP-15)…
                const approval = asApprovalPart(part);
                if (approval) {
                  return (
                    <ApprovalCard key={i} part={approval} onDecide={onDecide} />
                  );
                }
                // …read tools as chain items (FR-CP-13).
                const tool = toolPartInfo(part);
                return tool ? (
                  <ChainItem
                    key={i}
                    toolName={tool.name}
                    state={tool.state}
                    metric={toolMetric(part, t)}
                  />
                ) : null;
              })}
              {!isStreaming && text && (
                <MessageActions
                  text={text}
                  messageId={message.id}
                  threadId={threadId}
                />
              )}
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
