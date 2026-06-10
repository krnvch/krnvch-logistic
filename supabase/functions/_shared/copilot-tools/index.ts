// ============================================================
// Copilot tool registry (GRD-104)
// ============================================================
// The single list both consumers read:
//   - Copilot Edge Function (supabase/functions/copilot) — browser JWT auth
//   - Grida MCP server (GRD-105, future) — API-key auth
// Add new tools here; NEVER import AI-SDK/MCP types into tool files.
// ============================================================

import type { CopilotRole, CopilotTool } from "./types.ts";
import { getShipmentOverview } from "./get-shipment-overview.ts";
import { markOrderDone, undoDone } from "./mark-order-done.ts";
import { createOrder } from "./create-order.ts";
import { editOrder } from "./edit-order.ts";
import { deleteOrder } from "./delete-order.ts";

// The canonical action catalog lives in docs/prd-copilot-order-crud.md
// (FR-OC-01) — a tool that is not listed there does not ship.
export const tools: CopilotTool[] = [
  getShipmentOverview,
  markOrderDone,
  undoDone,
  createOrder,
  editOrder,
  deleteOrder,
];

/** Tools the given role is allowed to see and call. */
export function filterByRole(role: CopilotRole): CopilotTool[] {
  return tools.filter((tool) => tool.allowedRoles.includes(role));
}

export type {
  CopilotLocale,
  CopilotRole,
  CopilotTool,
  ToolContext,
} from "./types.ts";
export type { ShipmentOverview } from "./get-shipment-overview.ts";
