import type { UIMessage } from "ai";
import type { Database, Json } from "@/types/database";

export type ChatThread = Database["public"]["Tables"]["chat_threads"]["Row"];
export type ChatMessageRow =
  Database["public"]["Tables"]["chat_messages"]["Row"];

export type ThreadGroup = "today" | "lastWeek" | "older";

// History menu grouping (FR-CP-14): Today / Last 7 days / Older,
// by local calendar day.
export function groupThread(updatedAt: string, now: Date): ThreadGroup {
  const updated = new Date(updatedAt);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  if (updated >= startOfToday) return "today";
  const weekAgo = new Date(startOfToday);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (updated >= weekAgo) return "lastWeek";
  return "older";
}

export function groupThreads(
  threads: ChatThread[],
  now: Date
): Record<ThreadGroup, ChatThread[]> {
  const groups: Record<ThreadGroup, ChatThread[]> = {
    today: [],
    lastWeek: [],
    older: [],
  };
  for (const thread of threads) {
    groups[groupThread(thread.updated_at, now)].push(thread);
  }
  return groups;
}

// Stored rows → AI SDK UIMessage[]. Parts were persisted verbatim
// (AD-Copilot-05), so this is a relabel, not a transformation — chain
// items re-render from history with no extra code. Messages keep their
// ORIGINAL UIMessage id (message_id): approval continuations upsert the
// same message server-side, so the id must survive the round-trip.
export function rowsToUIMessages(
  rows: Pick<ChatMessageRow, "message_id" | "role" | "parts">[]
): UIMessage[] {
  return rows.map((row) => ({
    id: row.message_id,
    role: row.role === "user" ? "user" : "assistant",
    parts: (row.parts ?? []) as UIMessage["parts"],
  }));
}

export function partsToJson(parts: UIMessage["parts"]): Json {
  return parts as unknown as Json;
}
