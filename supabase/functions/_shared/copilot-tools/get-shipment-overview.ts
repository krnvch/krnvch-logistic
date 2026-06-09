// ============================================================
// Tool: get_shipment_overview (GRD-104, Phase 1's only tool)
// ============================================================
// Thin wrapper over the Postgres RPC of the same name — ALL counting
// and status logic lives in SQL (AD-Copilot-01), not here. Runs under
// the caller's JWT via ctx.supabase, so RLS applies.
// ============================================================

import type { CopilotTool } from "./types.ts";

interface Args {
  shipment_id: string;
}

export interface ShipmentOverview {
  shipment_name: string | null;
  total_orders: number;
  done_orders: number;
  open_orders: number;
  urgent_open_orders: number;
  walls: Array<{
    wall_number: number;
    open_orders: number;
    loaded_orders: number;
  }>;
}

export const getShipmentOverview: CopilotTool<Args, ShipmentOverview> = {
  name: "get_shipment_overview",
  description:
    "Returns a numeric snapshot of one shipment: total/done/open order " +
    "counts, how many open orders are urgent, and per-wall open/loaded " +
    "order counts. Use this for ANY 'how many…' question about orders, " +
    "walls, progress, or urgency within a shipment.",
  parameters: {
    type: "object",
    properties: {
      shipment_id: {
        type: "string",
        description: "UUID of the shipment to inspect",
      },
    },
    required: ["shipment_id"],
    additionalProperties: false,
  },
  allowedRoles: ["operator", "worker"],
  async execute(args, ctx) {
    const { data, error } = await ctx.supabase.rpc("get_shipment_overview", {
      p_shipment_id: args.shipment_id,
    });
    if (error) {
      throw new Error(`get_shipment_overview failed: ${error.message}`);
    }
    return data as ShipmentOverview;
  },
};
