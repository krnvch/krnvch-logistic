import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export function useRealtimeSync(shipmentId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!shipmentId) return;

    const channel = supabase
      .channel(`shipment:${shipmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.orders(shipmentId),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "placements",
          filter: `shipment_id=eq.${shipmentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.placements(shipmentId),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId, queryClient]);
}
