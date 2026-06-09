import { describe, it, expect } from "vitest";
import {
  groupThread,
  groupThreads,
  rowsToUIMessages,
  type ChatThread,
} from "@/components/copilot/thread-utils";

// Fixed "now": Tuesday 2026-06-09 15:00 local time.
const NOW = new Date(2026, 5, 9, 15, 0, 0);

function iso(daysAgo: number, hour = 12): string {
  const d = new Date(2026, 5, 9 - daysAgo, hour, 0, 0);
  return d.toISOString();
}

function makeThread(overrides: Partial<ChatThread> = {}): ChatThread {
  return {
    id: "t1",
    user_id: "u1",
    title: "Test thread",
    shipment_id: null,
    created_at: iso(0),
    updated_at: iso(0),
    ...overrides,
  };
}

describe("groupThread", () => {
  it("same calendar day → today, even early morning", () => {
    expect(groupThread(iso(0, 0), NOW)).toBe("today");
    expect(groupThread(iso(0, 14), NOW)).toBe("today");
  });

  it("yesterday through 7 days ago → lastWeek", () => {
    expect(groupThread(iso(1), NOW)).toBe("lastWeek");
    expect(groupThread(iso(7), NOW)).toBe("lastWeek");
  });

  it("8+ days ago → older", () => {
    expect(groupThread(iso(8), NOW)).toBe("older");
    expect(groupThread(iso(60), NOW)).toBe("older");
  });
});

describe("groupThreads", () => {
  it("buckets threads preserving input order within groups", () => {
    const threads = [
      makeThread({ id: "a", updated_at: iso(0) }),
      makeThread({ id: "b", updated_at: iso(3) }),
      makeThread({ id: "c", updated_at: iso(0, 9) }),
      makeThread({ id: "d", updated_at: iso(30) }),
    ];
    const groups = groupThreads(threads, NOW);
    expect(groups.today.map((t) => t.id)).toEqual(["a", "c"]);
    expect(groups.lastWeek.map((t) => t.id)).toEqual(["b"]);
    expect(groups.older.map((t) => t.id)).toEqual(["d"]);
  });
});

describe("rowsToUIMessages", () => {
  it("maps stored rows to UIMessages with parts verbatim (AD-Copilot-05)", () => {
    const parts = [
      { type: "step-start" },
      {
        type: "tool-get_shipment_overview",
        toolCallId: "call_1",
        state: "output-available",
        input: { shipment_id: "s1" },
        output: { open_orders: 4 },
      },
      { type: "text", text: "There are **4** open orders." },
    ];
    const messages = rowsToUIMessages([
      { id: "m1", role: "user", parts: [{ type: "text", text: "how many?" }] },
      { id: "m2", role: "assistant", parts },
    ]);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ id: "m1", role: "user" });
    expect(messages[1].role).toBe("assistant");
    // The whole point of storing parts verbatim: tool parts survive the
    // round-trip, so activity chains re-render from history.
    expect(messages[1].parts).toEqual(parts);
  });

  it("tolerates null parts", () => {
    const messages = rowsToUIMessages([
      { id: "m1", role: "assistant", parts: null },
    ]);
    expect(messages[0].parts).toEqual([]);
  });
});
