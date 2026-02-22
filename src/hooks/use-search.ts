import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { OrderWithStatus, WallData } from "@/types";

interface UseSearchParams {
  orders: OrderWithStatus[];
  walls: WallData[];
}

export function useSearch({ orders, walls }: UseSearchParams) {
  const [query, setQuery] = useState("");
  const [matchedOrderIds, setMatchedOrderIds] = useState<Set<string>>(
    new Set()
  );
  const [highlightedWalls, setHighlightedWalls] = useState<Set<number>>(
    new Set()
  );
  const [animatingWalls, setAnimatingWalls] = useState<Set<number>>(
    new Set()
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const executeSearch = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setMatchedOrderIds(new Set());
        setHighlightedWalls(new Set());
        setAnimatingWalls(new Set());
        return;
      }

      const term = q.trim().toLowerCase();
      const matched = new Set<string>();

      for (const o of orders) {
        if (
          o.order.order_number.toLowerCase().includes(term) ||
          o.order.client_name.toLowerCase().includes(term)
        ) {
          matched.add(o.order.id);
        }
      }

      setMatchedOrderIds(matched);

      // Find walls containing matched orders
      const wallNums = new Set<number>();
      for (const wall of walls) {
        for (const pw of wall.placements) {
          if (matched.has(pw.order.id)) {
            wallNums.add(wall.wall_number);
            break;
          }
        }
      }

      setHighlightedWalls(wallNums);
      setAnimatingWalls(new Set(wallNums)); // trigger animation
    },
    [orders, walls]
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => executeSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, executeSearch]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setMatchedOrderIds(new Set());
    setHighlightedWalls(new Set());
    setAnimatingWalls(new Set());
  }, []);

  // Highlight walls for a specific order (tap from sidebar)
  const highlightOrder = useCallback(
    (orderId: string) => {
      // Toggle off if same order
      if (matchedOrderIds.size === 1 && matchedOrderIds.has(orderId)) {
        clearSearch();
        return;
      }

      const matched = new Set([orderId]);
      setMatchedOrderIds(matched);
      setQuery(""); // don't show query in input for sidebar taps

      const wallNums = new Set<number>();
      for (const wall of walls) {
        for (const pw of wall.placements) {
          if (pw.order.id === orderId) {
            wallNums.add(wall.wall_number);
            break;
          }
        }
      }

      setHighlightedWalls(wallNums);
      setAnimatingWalls(new Set(wallNums));
    },
    [walls, matchedOrderIds, clearSearch]
  );

  const onAnimationEnd = useCallback((wallNumber: number) => {
    setAnimatingWalls((prev) => {
      const next = new Set(prev);
      next.delete(wallNumber);
      return next;
    });
  }, []);

  const noResults = useMemo(
    () => query.trim().length > 0 && matchedOrderIds.size === 0,
    [query, matchedOrderIds]
  );

  // First matched wall number (for scrolling)
  const firstMatchedWall = useMemo(() => {
    if (highlightedWalls.size === 0) return null;
    return Math.min(...highlightedWalls);
  }, [highlightedWalls]);

  return {
    query,
    setQuery,
    matchedOrderIds,
    highlightedWalls,
    animatingWalls,
    clearSearch,
    highlightOrder,
    onAnimationEnd,
    noResults,
    firstMatchedWall,
  };
}
