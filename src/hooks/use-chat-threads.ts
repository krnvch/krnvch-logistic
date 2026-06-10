import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import i18n from "@/lib/i18n";
import { toast } from "sonner";
import type {
  ChatThread,
  ChatMessageRow,
} from "@/components/copilot/thread-utils";

// Mira's thread list + message loading (GRD-124). RLS scopes every
// query to the signed-in user — no user_id filters needed client-side.
export function useChatThreads(enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.chatThreads,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as ChatThread[];
    },
    enabled,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_threads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onError: () => {
      toast.error(i18n.t("copilot.thread.deleteError"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads });
    },
  });

  return {
    threads: query.data ?? [],
    isLoading: query.isLoading,
    deleteThread: deleteMutation.mutateAsync,
    refreshThreads: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.chatThreads }),
  };
}

export async function fetchThreadMessages(
  threadId: string
): Promise<Pick<ChatMessageRow, "message_id" | "role" | "parts">[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("message_id, role, parts")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}
