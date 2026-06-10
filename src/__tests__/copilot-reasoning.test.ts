import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { mergeAdjacentReasoning } from "@/components/copilot/reasoning-utils";

type UIPart = UIMessage["parts"][number];

function reasoning(text: string, state = "done"): UIPart {
  return { type: "reasoning", text, state } as unknown as UIPart;
}

function textPart(text: string): UIPart {
  return { type: "text", text } as UIPart;
}

describe("mergeAdjacentReasoning", () => {
  it("merges consecutive reasoning parts into one block", () => {
    const parts = mergeAdjacentReasoning([
      reasoning("Step one."),
      reasoning("Step two."),
      textPart("Answer"),
    ]);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatchObject({
      type: "reasoning",
      text: "Step one.\n\nStep two.",
      streaming: false,
    });
    expect(parts[1].type).toBe("text");
  });

  it("keeps reasoning blocks separated by other parts apart", () => {
    const tool = {
      type: "tool-get_shipment_overview",
      toolCallId: "c1",
      state: "output-available",
    } as unknown as UIPart;
    const parts = mergeAdjacentReasoning([
      reasoning("Before tool"),
      tool,
      reasoning("After tool"),
    ]);
    expect(parts.map((p) => p.type)).toEqual([
      "reasoning",
      "tool-get_shipment_overview",
      "reasoning",
    ]);
  });

  it("drops empty reasoning — models without thoughts degrade to nothing", () => {
    const parts = mergeAdjacentReasoning([
      reasoning("  "),
      textPart("Answer"),
    ]);
    expect(parts).toHaveLength(1);
    expect(parts[0].type).toBe("text");
  });

  it("reports streaming from the newest merged chunk", () => {
    const parts = mergeAdjacentReasoning([
      reasoning("Done part", "done"),
      reasoning("Live part", "streaming"),
    ]);
    expect(parts[0]).toMatchObject({ streaming: true });
  });

  it("passes non-reasoning parts through untouched", () => {
    const input = [textPart("hello")];
    expect(mergeAdjacentReasoning(input)).toEqual(input);
  });
});
