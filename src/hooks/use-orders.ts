import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import type { Order, OrderInsert, OrderUpdate } from "@/types";
import { toast } from "sonner";

export function useOrders(shipmentId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = shipmentId ? queryKeys.orders(shipmentId) : ["orders"];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!shipmentId) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("pickup_time", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!shipmentId,
  });

  const createMutation = useMutation({
    mutationFn: async (order: OrderInsert) => {
      const { data, error } = await supabase
        .from("orders")
        .insert(order)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Order[]>(queryKey);
      queryClient.setQueryData<Order[]>(queryKey, (old = []) => [
        ...old,
        {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_done: false,
          done_at: null,
          description: null,
          item_count: null,
          pickup_time: null,
          ...newOrder,
        } as Order,
      ]);
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error("Не удалось создать заказ");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: OrderUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Order[]>(queryKey);
      queryClient.setQueryData<Order[]>(queryKey, (old = []) =>
        old.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error("Не удалось обновить заказ");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Order[]>(queryKey);
      queryClient.setQueryData<Order[]>(queryKey, (old = []) =>
        old.filter((o) => o.id !== id)
      );
      return { previous };
    },
    onError: (_err, _data, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error("Не удалось удалить заказ");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    createOrder: createMutation.mutateAsync,
    updateOrder: updateMutation.mutateAsync,
    deleteOrder: deleteMutation.mutateAsync,
  };
}
