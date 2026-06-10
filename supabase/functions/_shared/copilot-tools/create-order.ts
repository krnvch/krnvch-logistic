// ============================================================
// Tool: create_order (GRD-131, FR-OC-02)
// ============================================================
// Operator-only HITL tool. Validations mirror the order form exactly
// (duplicate number, boxes ≥ 1, completed shipment read-only) — the
// server is authoritative; the form's client checks are UX only.
// Interview mode (missing fields) is the MODEL's job via the system
// prompt — by the time this executes, args are complete.
// ============================================================

import type { CopilotTool, ToolContext } from "./types.ts";
import { cleanOrderNumber, normalizeOrderNumber } from "./order-utils.ts";

interface Args {
  shipment_id: string;
  order_number: string;
  client_name: string;
  box_count: number;
  description?: string;
  item_count?: number;
  pickup_time?: string;
  priority?: "normal" | "urgent";
}

export interface CreateOrderResult {
  order_number: string;
  client_name: string;
  box_count: number;
  priority: "normal" | "urgent";
}

export const createOrder: CopilotTool<Args, CreateOrderResult> = {
  name: "create_order",
  description:
    "Creates ONE new order in a shipment. Requires order number, client " +
    "name and box count — if the user has not provided ALL of these, ask " +
    "for the missing ones first instead of calling the tool. Optional: " +
    "description, item count, pickup time, priority. Requires the user's " +
    "approval before it runs.",
  parameters: {
    type: "object",
    properties: {
      shipment_id: {
        type: "string",
        description: "UUID of the shipment to add the order to",
      },
      order_number: {
        type: "string",
        description: "New order number, as the user named it",
      },
      client_name: { type: "string", description: "Client name" },
      box_count: {
        type: "integer",
        minimum: 1,
        description: "Number of boxes (must be at least 1)",
      },
      description: { type: "string", description: "Optional product description" },
      item_count: {
        type: "integer",
        minimum: 1,
        description: "Optional item quantity",
      },
      pickup_time: {
        type: "string",
        description: "Optional pickup time, e.g. '06:00'",
      },
      priority: {
        type: "string",
        enum: ["normal", "urgent"],
        description: "Optional priority; defaults to normal",
      },
    },
    required: ["shipment_id", "order_number", "client_name", "box_count"],
    additionalProperties: false,
  },
  allowedRoles: ["operator"],
  requiresApproval: true,
  async execute(args, ctx: ToolContext) {
    const { data: shipment, error: shipmentError } = await ctx.supabase
      .from("shipments")
      .select("status")
      .eq("id", args.shipment_id)
      .maybeSingle();
    if (shipmentError) {
      throw new Error(`shipment lookup failed: ${shipmentError.message}`);
    }
    if (!shipment) throw new Error("shipment not found");
    if (shipment.status === "completed") {
      throw new Error(
        "this shipment is completed and read-only — reopen it first"
      );
    }

    if (!Number.isInteger(args.box_count) || args.box_count < 1) {
      throw new Error("box count must be a whole number of at least 1");
    }

    // Duplicate check, normalized — stricter than the form on purpose
    // ("ham 031" collides with "HAM-031"; see PRD §6a).
    const { data: existing, error: existingError } = await ctx.supabase
      .from("orders")
      .select("order_number")
      .eq("shipment_id", args.shipment_id);
    if (existingError) {
      throw new Error(`order lookup failed: ${existingError.message}`);
    }
    const orderNumber = cleanOrderNumber(args.order_number);
    const wanted = normalizeOrderNumber(orderNumber);
    if (
      (existing ?? []).some(
        (o) => normalizeOrderNumber(o.order_number) === wanted
      )
    ) {
      throw new Error(
        `order number ${orderNumber} already exists in this shipment` +
          ` — ask the user for a different number`
      );
    }

    const { data: created, error: insertError } = await ctx.supabase
      .from("orders")
      .insert({
        shipment_id: args.shipment_id,
        order_number: orderNumber,
        client_name: args.client_name.trim(),
        box_count: args.box_count,
        description: args.description?.trim() || null,
        item_count: args.item_count ?? null,
        pickup_time: args.pickup_time?.trim() || null,
        priority: args.priority ?? "normal",
        is_done: false,
        done_at: null,
      })
      .select("order_number, client_name, box_count, priority")
      .single();
    if (insertError) {
      throw new Error(`order insert failed: ${insertError.message}`);
    }
    return created as CreateOrderResult;
  },
};
