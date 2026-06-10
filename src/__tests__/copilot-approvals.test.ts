import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import {
  approvalStatus,
  asApprovalPart,
  autoApprovable,
  type ApprovalPart,
} from "@/components/copilot/approval-utils";

type UIPart = UIMessage["parts"][number];

function toolPart(
  toolName: string,
  state: string,
  output?: unknown
): UIPart {
  return {
    type: `tool-${toolName}`,
    toolCallId: `call-${toolName}-${state}`,
    state,
    input: { shipment_id: "s-1", order_number: "1024" },
    ...(output !== undefined ? { output } : {}),
  } as unknown as UIPart;
}

function assistantMessage(id: string, parts: UIPart[]): UIMessage {
  return { id, role: "assistant", parts } as UIMessage;
}

describe("asApprovalPart", () => {
  it("narrows approval-tool parts", () => {
    const part = asApprovalPart(toolPart("mark_order_done", "input-available"));
    expect(part).not.toBeNull();
    expect(part!.toolName).toBe("mark_order_done");
    expect(part!.input?.order_number).toBe("1024");
  });

  it("ignores read tools and non-tool parts", () => {
    expect(
      asApprovalPart(toolPart("get_shipment_overview", "output-available"))
    ).toBeNull();
    expect(asApprovalPart({ type: "text", text: "hi" } as UIPart)).toBeNull();
  });
});

describe("approvalStatus", () => {
  function status(state: string, output?: unknown) {
    return approvalStatus(
      asApprovalPart(toolPart("undo_done", state, output)) as ApprovalPart
    );
  }

  it("is pending while the input streams and while undecided", () => {
    expect(status("input-streaming")).toBe("pending");
    expect(status("input-available")).toBe("pending");
  });

  it("follows the decision once the output exists", () => {
    expect(status("output-available", { decision: "approved" })).toBe(
      "approved"
    );
    expect(
      status("output-available", {
        decision: "approved",
        executed: true,
        result: { is_done: true },
      })
    ).toBe("approved");
    expect(
      status("output-available", { decision: "rejected", executed: true })
    ).toBe("rejected");
  });

  it("reports an error when execution failed or errored", () => {
    expect(
      status("output-available", {
        decision: "approved",
        executed: true,
        error: "order 1024 not found in this shipment",
      })
    ).toBe("error");
    expect(status("output-error")).toBe("error");
  });
});

describe("autoApprovable", () => {
  const allowMark = new Set(["mark_order_done"]);

  it("returns pending allow-listed calls from the last assistant message", () => {
    const messages = [
      assistantMessage("m1", [toolPart("mark_order_done", "input-available")]),
    ];
    const parts = autoApprovable(messages, allowMark);
    expect(parts).toHaveLength(1);
    expect(parts[0].toolName).toBe("mark_order_done");
  });

  it("skips tools that are not allow-listed", () => {
    const messages = [
      assistantMessage("m1", [toolPart("undo_done", "input-available")]),
    ];
    expect(autoApprovable(messages, allowMark)).toHaveLength(0);
  });

  it("skips already-decided calls", () => {
    const messages = [
      assistantMessage("m1", [
        toolPart("mark_order_done", "output-available", {
          decision: "approved",
        }),
      ]),
    ];
    expect(autoApprovable(messages, allowMark)).toHaveLength(0);
  });

  it("ignores older messages — only the newest proposal auto-approves", () => {
    const messages = [
      assistantMessage("m1", [toolPart("mark_order_done", "input-available")]),
      assistantMessage("m2", [{ type: "text", text: "done" } as UIPart]),
    ];
    expect(autoApprovable(messages, allowMark)).toHaveLength(0);
  });

  it("is inert with an empty allow-list or no messages", () => {
    expect(autoApprovable([], allowMark)).toHaveLength(0);
    expect(
      autoApprovable(
        [
          assistantMessage("m1", [
            toolPart("mark_order_done", "input-available"),
          ]),
        ],
        new Set()
      )
    ).toHaveLength(0);
  });
});
