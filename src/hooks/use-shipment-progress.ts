import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import type { ShipmentProgress } from "@/types";

export function useShipmentProgress(shipmentIds: string[]) {
  return useQuery({
    queryKey: queryKeys.shipmentsProgress(shipmentIds),
    queryFn: async () => {
      if (shipmentIds.length === 0) return {};

      const { data: orders, error } = await supabase
        .from("orders")
        .select("shipment_id, box_count, is_done")
        .in("shipment_id", shipmentIds);

      if (error) throw error;

      const progress: Record<string, ShipmentProgress> = {};

      for (const id of shipmentIds) {
        progress[id] = { totalOrders: 0, doneOrders: 0, totalBoxes: 0 };
      }

      for (const order of orders ?? []) {
        const p = progress[order.shipment_id];
        if (p) {
          p.totalOrders++;
          p.totalBoxes += order.box_count;
          if (order.is_done) p.doneOrders++;
        }
      }

      return progress;
    },
    enabled: shipmentIds.length > 0,
  });
}
