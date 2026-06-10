import type { UIMessage } from "ai";

type UIPart = UIMessage["parts"][number];

export interface ReasoningView {
  type: "reasoning";
  text: string;
  streaming: boolean;
}

/**
 * Gemini can emit several consecutive reasoning parts per step; the UI
 * shows them as ONE thinking block. Merges adjacent reasoning parts
 * (joining text), leaves everything else untouched, and drops empty
 * reasoning (models without thoughts degrade to nothing — FR-CP-16).
 */
export function mergeAdjacentReasoning(
  parts: UIPart[]
): Array<UIPart | ReasoningView> {
  const out: Array<UIPart | ReasoningView> = [];
  for (const part of parts) {
    if (part.type !== "reasoning") {
      out.push(part);
      continue;
    }
    const raw = part as unknown as { text?: string; state?: string };
    const text = (raw.text ?? "").trim();
    if (!text) continue;
    const prev = out[out.length - 1];
    if (prev && prev.type === "reasoning" && "streaming" in prev) {
      prev.text += "\n\n" + text;
      prev.streaming = raw.state === "streaming";
    } else {
      out.push({
        type: "reasoning",
        text,
        streaming: raw.state === "streaming",
      });
    }
  }
  return out;
}
