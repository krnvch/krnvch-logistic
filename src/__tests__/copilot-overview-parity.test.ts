import { describe, it, expect } from "vitest";
import { getOrderStatus } from "@/types";
import type { Order, OrderDisplayStatus } from "@/types";
import migrationSql from "../../supabase/migrations/20260603193500_copilot_shipment_overview.sql?raw";

// Parity guard (PRD copilot §6): the get_shipment_overview RPC classifies
// order status in SQL, mirroring the client's getOrderStatus. If either
// side changes its rule, this suite must fail.

// The SQL CASE expression from the migration, mirrored in TS.
function sqlStatusRule(
  isDone: boolean,
  placedBoxes: number,
  boxCount: number
): OrderDisplayStatus {
  if (isDone) return "done";
  if (placedBoxes >= boxCount) return "loaded";
  return "pending";
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "test-id",
    shipment_id: "shipment-id",
    order_number: "001",
    client_name: "Test Client",
    description: null,
    item_count: null,
    box_count: 10,
    pickup_time: null,
    is_done: false,
    done_at: null,
    priority: "normal",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("copilot overview parity (SQL ↔ getOrderStatus)", () => {
  it("matches getOrderStatus across the full input matrix", () => {
    for (const isDone of [true, false]) {
      for (const boxCount of [1, 5, 10]) {
        for (const placed of [0, boxCount - 1, boxCount, boxCount + 3]) {
          const order = makeOrder({ is_done: isDone, box_count: boxCount });
          expect(
            sqlStatusRule(isDone, placed, boxCount),
            `is_done=${isDone} placed=${placed} box_count=${boxCount}`
          ).toBe(getOrderStatus(order, placed));
        }
      }
    }
  });

  it("migration SQL still contains the mirrored CASE rule", () => {
    expect(migrationSql).toMatch(/WHEN\s+is_done\s+THEN\s+'done'/);
    expect(migrationSql).toMatch(
      /WHEN\s+placed_boxes\s+>=\s+box_count\s+THEN\s+'loaded'/
    );
    expect(migrationSql).toMatch(/ELSE\s+'pending'/);
  });
});
