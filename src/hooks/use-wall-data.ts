import { useMemo } from "react";
import type {
  Order,
  Placement,
  WallData,
  PlacementWithOrder,
  OrderWithStatus,
} from "@/types";
import { getOrderStatus } from "@/types";

interface UseWallDataParams {
  orders: Order[];
  placements: Placement[];
  trailerWalls: number;
  boxesPerWall: number;
}

export function useWallData({
  orders,
  placements,
  trailerWalls,
  boxesPerWall,
}: UseWallDataParams) {
  const orderMap = useMemo(() => {
    const map = new Map<string, Order>();
    for (const order of orders) {
      map.set(order.id, order);
    }
    return map;
  }, [orders]);

  // Placed boxes per order
  const placedBoxesByOrder = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of placements) {
      map.set(p.order_id, (map.get(p.order_id) ?? 0) + p.box_count);
    }
    return map;
  }, [placements]);

  // Orders with computed status
  const ordersWithStatus: OrderWithStatus[] = useMemo(() => {
    return orders
      .map((order) => {
        const placed_boxes = placedBoxesByOrder.get(order.id) ?? 0;
        return {
          order,
          placed_boxes,
          remaining_boxes: order.box_count - placed_boxes,
          status: getOrderStatus(order, placed_boxes),
        };
      })
      .sort((a, b) => {
        const aPriority = a.order.priority === "urgent" ? 0 : 1;
        const bPriority = b.order.priority === "urgent" ? 0 : 1;
        return aPriority - bPriority;
      });
  }, [orders, placedBoxesByOrder]);

  // Wall data array
  const walls: WallData[] = useMemo(() => {
    // Group placements by wall number
    const wallMap = new Map<number, PlacementWithOrder[]>();
    for (const p of placements) {
      const order = orderMap.get(p.order_id);
      if (!order) continue;
      const list = wallMap.get(p.wall_number) ?? [];
      list.push({ placement: p, order });
      wallMap.set(p.wall_number, list);
    }

    // Build wall array for all walls
    const result: WallData[] = [];
    for (let i = 1; i <= trailerWalls; i++) {
      const wallPlacements = wallMap.get(i) ?? [];
      const totalBoxes = wallPlacements.reduce(
        (sum, pw) => sum + pw.placement.box_count,
        0
      );
      result.push({
        wall_number: i,
        placements: wallPlacements,
        total_boxes: totalBoxes,
        remaining_capacity: boxesPerWall - totalBoxes,
        is_full: totalBoxes >= boxesPerWall,
      });
    }
    return result;
  }, [placements, orderMap, trailerWalls, boxesPerWall]);

  return { walls, ordersWithStatus, placedBoxesByOrder };
}
