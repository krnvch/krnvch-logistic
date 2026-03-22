import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import i18n from "@/lib/i18n";
import type { Placement, PlacementInsert, PlacementUpdate } from "@/types";
import { toast } from "sonner";

export function usePlacements(shipmentId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = shipmentId
    ? queryKeys.placements(shipmentId)
    : ["placements"];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!shipmentId) return [];
      const { data, error } = await supabase
        .from("placements")
        .select("*")
        .eq("shipment_id", shipmentId);

      if (error) throw error;
      return data as Placement[];
    },
    enabled: !!shipmentId,
  });

  const createMutation = useMutation({
    mutationFn: async (placement: PlacementInsert) => {
      const { data, error } = await supabase
        .from("placements")
        .insert(placement)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (newPlacement) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Placement[]>(queryKey);
      queryClient.setQueryData<Placement[]>(queryKey, (old = []) => [
        ...old,
        {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...newPlacement,
        } as Placement,
      ]);
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error(i18n.t("toast.placementCreateError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: PlacementUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("placements")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Placement[]>(queryKey);
      queryClient.setQueryData<Placement[]>(queryKey, (old = []) =>
        old.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error(i18n.t("toast.placementUpdateError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("placements").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Placement[]>(queryKey);
      queryClient.setQueryData<Placement[]>(queryKey, (old = []) =>
        old.filter((p) => p.id !== id)
      );
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error(i18n.t("toast.placementDeleteError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    placements: query.data ?? [],
    isLoading: query.isLoading,
    createPlacement: createMutation.mutateAsync,
    updatePlacement: updateMutation.mutateAsync,
    deletePlacement: deleteMutation.mutateAsync,
  };
}
