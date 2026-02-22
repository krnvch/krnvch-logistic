import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import type { ShipmentInsert } from "@/types";
import { toast } from "sonner";

export function useShipment() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.shipment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (shipment: ShipmentInsert) => {
      const { data, error } = await supabase
        .from("shipments")
        .insert(shipment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipment });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase
        .from("shipments")
        .update({ status: "completed" })
        .eq("id", shipmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: queryKeys.shipment });
      toast.success("Рейс завершён");
    },
    onError: () => {
      toast.error("Не удалось завершить рейс");
    },
  });

  return {
    shipment: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createShipment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    completeShipment: completeMutation.mutateAsync,
  };
}
