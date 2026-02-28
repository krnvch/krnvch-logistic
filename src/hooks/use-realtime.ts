import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export function useRealtimeShipments() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("shipments-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.shipments,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
          filter: `id=eq.${shipmentId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.shipment(shipmentId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.shipments,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipmentId, queryClient]);
}
