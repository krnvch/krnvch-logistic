import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import i18n from "@/lib/i18n";
import type { ShipmentInsert } from "@/types";
import { toast } from "sonner";

export function useShipments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.shipments,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false });

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
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase
        .from("shipments")
        .delete()
        .eq("id", shipmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      toast.success(i18n.t("toast.shipmentDeleted"));
    },
    onError: () => {
      toast.error(i18n.t("toast.shipmentDeleteError"));
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase
        .from("shipments")
        .update({ status: "active" })
        .eq("id", shipmentId);

      if (error) throw error;
    },
    onSuccess: (_data, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      queryClient.invalidateQueries({
        queryKey: queryKeys.shipment(shipmentId),
      });
      toast.success(i18n.t("toast.shipmentReopened"));
    },
    onError: () => {
      toast.error(i18n.t("toast.shipmentReopenError"));
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("shipments")
        .update({ name })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipment(id) });
      toast.success(i18n.t("toast.shipmentRenamed"));
    },
    onError: () => {
      toast.error(i18n.t("toast.shipmentRenameError"));
    },
  });

  return {
    shipments: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createShipment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteShipment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    reopenShipment: reopenMutation.mutateAsync,
    renameShipment: renameMutation.mutateAsync,
  };
}

export function useShipment(id: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: id ? queryKeys.shipment(id) : ["shipment-disabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase
        .from("shipments")
        .update({ status: "completed" })
        .eq("id", shipmentId);

      if (error) throw error;
    },
    onSuccess: (_data, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      queryClient.invalidateQueries({
        queryKey: queryKeys.shipment(shipmentId),
      });
      toast.success(i18n.t("toast.shipmentCompleted"));
    },
    onError: () => {
      toast.error(i18n.t("toast.shipmentCompleteError"));
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase
        .from("shipments")
        .update({ status: "active" })
        .eq("id", shipmentId);

      if (error) throw error;
    },
    onSuccess: (_data, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      queryClient.invalidateQueries({
        queryKey: queryKeys.shipment(shipmentId),
      });
      toast.success(i18n.t("toast.shipmentReopened"));
    },
    onError: () => {
      toast.error(i18n.t("toast.shipmentReopenError"));
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("shipments")
        .update({ name })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipment(id) });
      toast.success(i18n.t("toast.shipmentRenamed"));
    },
    onError: () => {
      toast.error(i18n.t("toast.shipmentRenameError"));
    },
  });

  return {
    shipment: query.data,
    isLoading: query.isLoading,
    error: query.error,
    completeShipment: completeMutation.mutateAsync,
    reopenShipment: reopenMutation.mutateAsync,
    renameShipment: renameMutation.mutateAsync,
  };
}
