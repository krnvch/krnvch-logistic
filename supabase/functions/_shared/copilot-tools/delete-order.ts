// ============================================================
// Tool: delete_order (GRD-131, FR-OC-05) — DESTRUCTIVE TIER
// ============================================================
// Operator-only, approvalTier "destructive": the client renders a red
// Delete/Cancel card with NO "always allow" path, and auto-approval is
// hard-blocked. Hard delete, exactly like the UI dialog (placements
// cascade via FK). A soft "cancelled" status is out of scope (PRD §7).
// ============================================================

import type { CopilotTool, ToolContext } from "./types.ts";
import { normalizeOrderNumber } from "./order-utils.ts";

interface Args {
  shipment_id: string;
  order_number: string;
}

export interface DeleteOrderResult {
  order_number: string;
  client_name: string;
  removed_placements_boxes: number;
}

export const deleteOrder: CopilotTool<Args, DeleteOrderResult> = {
  name: "delete_order",
  description:
    "Permanently deletes ONE order (and removes its placed boxes from the " +
    "load map). DESTRUCTIVE and irreversible — call it ONLY when the user " +
    "explicitly asks to delete/remove an order, never as a side effect. " +
    "Requires the user's explicit confirmation before it runs.",
  parameters: {
    type: "object",
    properties: {
      shipment_id: {
        type: "string",
        description: "UUID of the shipment the order belongs to",
      },
      order_number: {
        type: "string",
        description:
          "The order number as the user named it (matching ignores case, " +
          "spaces, dashes and '#')",
      },
    },
    required: ["shipment_id", "order_number"],
    additionalProperties: false,
  },
  allowedRoles: ["operator"],
  requiresApproval: true,
  approvalTier: "destructive",
  async execute(args, ctx: ToolContext) {
    const { data: orders, error: findError } = await ctx.supabase
      .from("orders")
      .select("id, order_number, client_name, shipments ( status )")
      .eq("shipment_id", args.shipment_id);
    if (findError) {
      throw new Error(`order lookup failed: ${findError.message}`);
    }

    const wanted = normalizeOrderNumber(args.order_number);
    const matches = (orders ?? []).filter(
      (o) => normalizeOrderNumber(o.order_number) === wanted
    );
    if (matches.length === 0) {
      throw new Error(
        `order ${args.order_number} not found in this shipment` +
          ` — ask the user to double-check the number`
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `order number ${args.order_number} is ambiguous here` +
          ` (${matches.map((o) => o.order_number).join(", ")})` +
          ` — ask the user which one they mean`
      );
    }
    const order = matches[0];
    const shipmentStatus = (
      order.shipments as unknown as { status: string } | null
    )?.status;
    if (shipmentStatus === "completed") {
      throw new Error(
        "this shipment is completed and read-only — reopen it first"
      );
    }

    const { data: placements, error: placementsError } = await ctx.supabase
      .from("placements")
      .select("box_count")
      .eq("order_id", order.id);
    if (placementsError) {
      throw new Error(`placements lookup failed: ${placementsError.message}`);
    }
    const removedBoxes = (placements ?? []).reduce(
      (sum, p) => sum + (p.box_count ?? 0),
      0
    );

    const { error: deleteError } = await ctx.supabase
      .from("orders")
      .delete()
      .eq("id", order.id);
    if (deleteError) {
      throw new Error(`order delete failed: ${deleteError.message}`);
    }

    return {
      order_number: order.order_number,
      client_name: order.client_name,
      removed_placements_boxes: removedBoxes,
    };
  },
};
