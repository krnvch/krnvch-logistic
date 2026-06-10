import type { UIMessage } from "ai";

// ============================================================
// HITL approval protocol — client side (GRD-125, AD-Copilot-06).
// Kept in sync with supabase/functions/copilot/index.ts: the client
// answers an approval card by setting the tool output to
// { decision: "approved" | "rejected" } via addToolResult; the Edge
// Function executes and replaces it with { …, executed: true }.
// ============================================================

/** Tools that render as approval cards instead of chain items. */
export const APPROVAL_TOOLS = ["mark_order_done", "undo_done"] as const;

export type ApprovalToolName = (typeof APPROVAL_TOOLS)[number];

export interface ApprovalDecision {
  decision: "approved" | "rejected";
  /** Set by the Edge Function once it has acted on the decision. */
  executed?: boolean;
  /** Approval came from the per-thread allow-list, not a click. */
  auto?: boolean;
  result?: unknown;
  error?: string;
  message?: string;
}

export interface ApprovalPart {
  toolName: ApprovalToolName;
  toolCallId: string;
  state: string;
  input?: { shipment_id?: string; order_number?: string };
  output?: ApprovalDecision;
}

type UIPart = UIMessage["parts"][number];

/** Narrow a UIMessage part to an approval-tool part, else null. */
export function asApprovalPart(part: UIPart): ApprovalPart | null {
  if (!part.type.startsWith("tool-")) return null;
  const toolName = part.type.slice("tool-".length);
  if (!(APPROVAL_TOOLS as readonly string[]).includes(toolName)) return null;
  const raw = part as unknown as {
    toolCallId: string;
    state: string;
    input?: ApprovalPart["input"];
    output?: ApprovalDecision;
  };
  return {
    toolName: toolName as ApprovalToolName,
    toolCallId: raw.toolCallId,
    state: raw.state,
    input: raw.input,
    output: raw.output,
  };
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "error";

export function approvalStatus(part: ApprovalPart): ApprovalStatus {
  if (part.state === "output-error") return "error";
  if (part.state !== "output-available" || !part.output) return "pending";
  if (part.output.error) return "error";
  return part.output.decision === "approved" ? "approved" : "rejected";
}

/**
 * Approval parts in the LAST assistant message still waiting for a
 * decision that the per-thread allow-list already covers. Older
 * messages are excluded on purpose — the server marks those skipped.
 */
export function autoApprovable(
  messages: UIMessage[],
  allowedTools: ReadonlySet<string>
): ApprovalPart[] {
  if (allowedTools.size === 0 || messages.length === 0) return [];
  const last = messages[messages.length - 1];
  if (last.role !== "assistant") return [];
  return last.parts
    .map(asApprovalPart)
    .filter((p): p is ApprovalPart => p !== null)
    .filter(
      (p) => p.state === "input-available" && allowedTools.has(p.toolName)
    );
}
