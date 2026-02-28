import type { Database } from "./database";

// --- User roles (UI-level only) ---
export type UserRole = "operator" | "worker";

// --- Row types (shorthand aliases) ---
export type Shipment = Database["public"]["Tables"]["shipments"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Placement = Database["public"]["Tables"]["placements"]["Row"];

// --- Insert types ---
export type ShipmentInsert =
  Database["public"]["Tables"]["shipments"]["Insert"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type PlacementInsert =
  Database["public"]["Tables"]["placements"]["Insert"];

// --- Update types ---
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
export type PlacementUpdate =
  Database["public"]["Tables"]["placements"]["Update"];

// --- Computed status (not stored in DB) ---
export type OrderDisplayStatus = "pending" | "loaded" | "done";

export function getOrderStatus(
  order: Order,
  placedBoxes: number
): OrderDisplayStatus {
  if (order.is_done) return "done";
  if (placedBoxes >= order.box_count) return "loaded";
  return "pending";
}

// --- Derived types for UI ---
export interface OrderWithStatus {
  order: Order;
  placed_boxes: number;
  remaining_boxes: number;
  status: OrderDisplayStatus;
}

export interface WallData {
  wall_number: number;
  placements: PlacementWithOrder[];
  total_boxes: number;
  remaining_capacity: number;
  is_full: boolean;
}

export interface PlacementWithOrder {
  placement: Placement;
  order: Order;
}

// --- Multi-shipment types ---
export interface ShipmentProgress {
  totalOrders: number;
  doneOrders: number;
  totalBoxes: number;
}

export type ShipmentFilter = "all" | "active" | "completed";

export interface ShipmentsSort {
  column: "name" | "status" | "created_at" | "created_by";
  direction: "asc" | "desc";
}
