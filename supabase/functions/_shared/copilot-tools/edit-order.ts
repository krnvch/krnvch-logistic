// ============================================================
// Tool: edit_order (GRD-131, FR-OC-04)
// ============================================================
// Operator-only HITL tool. Resolves the order by fuzzy number, then
// applies ONLY the fields that actually differ from the current row
// (models echo unchanged fields — see PRD §6a pushback #1). An empty
// effective diff is an error, not a silent success: phantom edits must
// not reach the audit log.
// ============================================================

import type { CopilotTool, ToolContext } from "./types.ts";
import { cleanOrderNumber, normalizeOrderNumber } from "./order-utils.ts";

interface Changes {
  order_number?: string;
  client_name?: string;
  box_count?: number;
  description?: string;
  item_count?: number;
  pickup_time?: string;
  priority?: "normal" | "urgent";
}

interface Args {
  shipment_id: string;
  order_number: string;
  changes: Changes;
}

export interface EditOrderResult {
  order_number: string;
  client_name: string;
  applied: Record<string, { from: unknown; to: unknown }>;
}

interface OrderRow {
  id: string;
  order_number: string;
  client_name: string;
  box_count: number;
  description: string | null;
  item_count: number | null;
  pickup_time: string | null;
  priority: string;
  shipments: { status: string } | null;
}

export const editOrder: CopilotTool<Args, EditOrderResult> = {
  name: "edit_order",
  description:
    "Changes fields of ONE existing order (client name, box count, " +
    "description, item count, pickup time, priority, or the order number " +
    "itself). Pass ONLY the fields the user asked to change. Requires the " +
    "user's approval before it runs.",
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
      changes: {
        type: "object",
        description: "Only the fields the user asked to change",
        properties: {
          order_number: { type: "string", description: "New order number" },
          client_name: { type: "string", description: "New client name" },
          box_count: {
            type: "integer",
            minimum: 1,
            description: "New box count",
          },
          description: { type: "string", description: "New description" },
          item_count: {
            type: "integer",
            minimum: 1,
            description: "New item quantity",
          },
          pickup_time: { type: "string", description: "New pickup time" },
          priority: {
            type: "string",
            enum: ["normal", "urgent"],
            description: "New priority",
          },
        },
        additionalProperties: false,
      },
    },
    required: ["shipment_id", "order_number", "changes"],
    additionalProperties: false,
  },
  allowedRoles: ["operator"],
  requiresApproval: true,
  async execute(args, ctx: ToolContext) {
    const { data: orders, error: findError } = await ctx.supabase
      .from("orders")
      .select(
        "id, order_number, client_name, box_count, description, item_count, pickup_time, priority, shipments ( status )"
      )
      .eq("shipment_id", args.shipment_id);
    if (findError) {
      throw new Error(`order lookup failed: ${findError.message}`);
    }

    const all = (orders ?? []) as unknown as OrderRow[];
    const wanted = normalizeOrderNumber(args.order_number);
    const matches = all.filter(
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
    if (order.shipments?.status === "completed") {
      throw new Error(
        "this shipment is completed and read-only — reopen it first"
      );
    }

    // Build the EFFECTIVE diff: drop fields whose new value equals the
    // current one (string fields compared trimmed; the number itself
    // compared normalized, so "ham-014" → "HAM-014" is a no-op).
    const update: Record<string, unknown> = {};
    const applied: EditOrderResult["applied"] = {};
    const c = args.changes ?? {};

    function propose(field: keyof OrderRow, from: unknown, to: unknown) {
      update[field as string] = to;
      applied[field as string] = { from, to };
    }

    if (c.order_number !== undefined) {
      const next = cleanOrderNumber(c.order_number);
      if (normalizeOrderNumber(next) !== normalizeOrderNumber(order.order_number)) {
        const collision = all.some(
          (o) =>
            o.id !== order.id &&
            normalizeOrderNumber(o.order_number) === normalizeOrderNumber(next)
        );
        if (collision) {
          throw new Error(
            `order number ${next} already exists in this shipment` +
              ` — ask the user for a different number`
          );
        }
        propose("order_number", order.order_number, next);
      }
    }
    if (c.client_name !== undefined) {
      const next = c.client_name.trim();
      if (next && next !== order.client_name) {
        propose("client_name", order.client_name, next);
      }
    }
    if (c.box_count !== undefined && c.box_count !== order.box_count) {
      if (!Number.isInteger(c.box_count) || c.box_count < 1) {
        throw new Error("box count must be a whole number of at least 1");
      }
      const { data: placements, error: placementsError } = await ctx.supabase
        .from("placements")
        .select("box_count")
        .eq("order_id", order.id);
      if (placementsError) {
        throw new Error(`placements lookup failed: ${placementsError.message}`);
      }
      const placed = (placements ?? []).reduce(
        (sum, p) => sum + (p.box_count ?? 0),
        0
      );
      if (c.box_count < placed) {
        throw new Error(
          `cannot set box count below ${placed} — that many boxes are` +
            ` already placed on walls; remove placements first`
        );
      }
      propose("box_count", order.box_count, c.box_count);
    }
    if (c.description !== undefined) {
      const next = c.description.trim() || null;
      if (next !== order.description) {
        propose("description", order.description, next);
      }
    }
    if (c.item_count !== undefined && c.item_count !== order.item_count) {
      if (!Number.isInteger(c.item_count) || c.item_count < 1) {
        throw new Error("item count must be a whole number of at least 1");
      }
      propose("item_count", order.item_count, c.item_count);
    }
    if (c.pickup_time !== undefined) {
      const next = c.pickup_time.trim() || null;
      if (next !== order.pickup_time) {
        propose("pickup_time", order.pickup_time, next);
      }
    }
    if (c.priority !== undefined && c.priority !== order.priority) {
      propose("priority", order.priority, c.priority);
    }

    if (Object.keys(update).length === 0) {
      throw new Error(
        "nothing would change — all provided values match the current order"
      );
    }

    const { error: updateError } = await ctx.supabase
      .from("orders")
      .update(update)
      .eq("id", order.id);
    if (updateError) {
      throw new Error(`order update failed: ${updateError.message}`);
    }

    return {
      order_number: (update.order_number as string) ?? order.order_number,
      client_name: (update.client_name as string) ?? order.client_name,
      applied,
    };
  },
};
