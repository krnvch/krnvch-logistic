import { describe, it, expect } from "vitest";
import { getOrderStatus } from "@/types";
import type { Order } from "@/types";

// Helper: create a minimal Order object for testing
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

describe("getOrderStatus", () => {
  // --- "done" status ---
  describe("returns 'done' when order is marked done", () => {
    it("is_done=true, no boxes placed", () => {
      const order = makeOrder({ is_done: true });
      expect(getOrderStatus(order, 0)).toBe("done");
    });

    it("is_done=true, some boxes placed", () => {
      const order = makeOrder({ is_done: true });
      expect(getOrderStatus(order, 5)).toBe("done");
    });

    it("is_done=true, all boxes placed", () => {
      const order = makeOrder({ is_done: true, box_count: 10 });
      expect(getOrderStatus(order, 10)).toBe("done");
    });

    it("is_done takes priority over loaded", () => {
      // Even if all boxes are placed, is_done wins
      const order = makeOrder({ is_done: true, box_count: 5 });
      expect(getOrderStatus(order, 5)).toBe("done");
    });
  });

  // --- "loaded" status ---
  describe("returns 'loaded' when all boxes are placed", () => {
    it("placedBoxes equals box_count", () => {
      const order = makeOrder({ box_count: 10 });
      expect(getOrderStatus(order, 10)).toBe("loaded");
    });

    it("placedBoxes exceeds box_count", () => {
      const order = makeOrder({ box_count: 5 });
      expect(getOrderStatus(order, 7)).toBe("loaded");
    });

    it("single box order, fully placed", () => {
      const order = makeOrder({ box_count: 1 });
      expect(getOrderStatus(order, 1)).toBe("loaded");
    });
  });

  // --- "pending" status ---
  describe("returns 'pending' when not done and not fully placed", () => {
    it("no boxes placed", () => {
      const order = makeOrder({ box_count: 10 });
      expect(getOrderStatus(order, 0)).toBe("pending");
    });

    it("some boxes placed but not all", () => {
      const order = makeOrder({ box_count: 10 });
      expect(getOrderStatus(order, 9)).toBe("pending");
    });

    it("large order, partially placed", () => {
      const order = makeOrder({ box_count: 100 });
      expect(getOrderStatus(order, 50)).toBe("pending");
    });
  });
});
