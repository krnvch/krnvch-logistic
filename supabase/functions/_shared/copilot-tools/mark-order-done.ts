// ============================================================
// Tools: mark_order_done / undo_done (GRD-125, Stage C)
// ============================================================
// Mira's first write tools. Both are HITL (requiresApproval: true,
// AD-Copilot-06): the model proposes the call, the user approves it in
// the chat, and only then does `execute` run — under the CALLER's JWT,
// so RLS applies exactly as it does to the buttons in the UI.
//
// Semantics mirror ShipmentDetailPage: done = { is_done: true, done_at:
// now }, undo = { is_done: false, done_at: null }. Orders on a completed
// shipment are read-only in the UI, so the tools refuse them too.
// ============================================================

import type { CopilotTool, ToolContext } from "./types.ts";

interface Args {
  shipment_id: string;
  order_number: string;
}

export interface MarkOrderDoneResult {
  order_number: string;
  client_name: string;
  is_done: boolean;
}

const PARAMETERS = {
  type: "object",
  properties: {
    shipment_id: {
      type: "string",
      description: "UUID of the shipment the order belongs to",
    },
    order_number: {
      type: "string",
      description:
        "The order number exactly as the user named it (e.g. '1024')",
    },
  },
  required: ["shipment_id", "order_number"],
  additionalProperties: false,
} as const;

async function setDone(
  args: Args,
  ctx: ToolContext,
  isDone: boolean
): Promise<MarkOrderDoneResult> {
  // Users say "ham-028" or "#HAM-028"; stored numbers are "HAM-028".
  // Normalize the prefix and match case-insensitively (ilike with the
  // wildcard chars escaped = case-insensitive equality).
  const orderNumber = args.order_number
    .trim()
    .replace(/^#/, "")
    .replace(/[%_]/g, "\\$&");

  // Resolve the order within the shipment; also fetch the shipment
  // status — completed shipments are read-only (mirrors the UI rule).
  const { data: order, error: findError } = await ctx.supabase
    .from("orders")
    .select("id, order_number, client_name, is_done, shipments ( status )")
    .eq("shipment_id", args.shipment_id)
    .ilike("order_number", orderNumber)
    .maybeSingle();

  if (findError) {
    throw new Error(`order lookup failed: ${findError.message}`);
  }
  if (!order) {
    throw new Error(
      `order ${args.order_number} not found in this shipment` +
        ` — ask the user to double-check the number`
    );
  }
  const shipmentStatus = (
    order.shipments as unknown as { status: string } | null
  )?.status;
  if (shipmentStatus === "completed") {
    throw new Error(
      "this shipment is completed and read-only — reopen it first"
    );
  }
  if (order.is_done === isDone) {
    // Idempotent: repeating the state is a no-op, not an error.
    return {
      order_number: order.order_number,
      client_name: order.client_name,
      is_done: isDone,
    };
  }

  const { error: updateError } = await ctx.supabase
    .from("orders")
    .update({
      is_done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", order.id);

  if (updateError) {
    throw new Error(`order update failed: ${updateError.message}`);
  }

  return {
    order_number: order.order_number,
    client_name: order.client_name,
    is_done: isDone,
  };
}

export const markOrderDone: CopilotTool<Args, MarkOrderDoneResult> = {
  name: "mark_order_done",
  description:
    "Marks ONE order as done (loaded and finished). Use when the user " +
    "asks to mark / close / complete a specific order they name by " +
    "number. Requires the user's approval before it runs.",
  parameters: PARAMETERS as unknown as Record<string, unknown>,
  // Matches existing rights: workers also have the Done/Undo buttons.
  allowedRoles: ["operator", "worker"],
  requiresApproval: true,
  execute: (args, ctx) => setDone(args, ctx, true),
};

export const undoDone: CopilotTool<Args, MarkOrderDoneResult> = {
  name: "undo_done",
  description:
    "Reverts a done order back to open (un-done). Use when the user asks " +
    "to undo, reopen, or un-mark a specific order they name by number. " +
    "Requires the user's approval before it runs.",
  parameters: PARAMETERS as unknown as Record<string, unknown>,
  allowedRoles: ["operator", "worker"],
  requiresApproval: true,
  execute: (args, ctx) => setDone(args, ctx, false),
};
