-- ============================================================
-- COPILOT: get_shipment_overview RPC  (GRD-104, AD-Copilot-01)
-- ============================================================
-- Single source of truth for the numeric snapshot the Grida Copilot
-- read tool returns. Counting/status logic lives here in SQL — NOT
-- duplicated in the Deno Edge Function — and is reused verbatim by the
-- future MCP server (GRD-105).
--
-- SECURITY INVOKER: runs under the CALLER's privileges, so the existing
-- RLS policies on orders/placements/shipments apply. No privilege
-- escalation, no service-role bypass.
--
-- Order status mirrors src/types/index.ts `getOrderStatus`:
--   done    = is_done
--   loaded  = NOT is_done AND SUM(placements.box_count) >= box_count
--   pending = otherwise
-- A parity test guards against drift between SQL and TS.
--
-- Returns jsonb:
-- {
--   "shipment_name": text,
--   "total_orders": int,
--   "done_orders": int,
--   "open_orders": int,
--   "urgent_open_orders": int,
--   "walls": [ { "wall_number": int, "open_orders": int, "loaded_orders": int }, ... ]
-- }
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_shipment_overview(p_shipment_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH order_status AS (
    SELECT
      o.id,
      o.is_done,
      o.priority,
      o.box_count,
      COALESCE(SUM(p.box_count), 0) AS placed_boxes
    FROM public.orders o
    LEFT JOIN public.placements p ON p.order_id = o.id
    WHERE o.shipment_id = p_shipment_id
    GROUP BY o.id, o.is_done, o.priority, o.box_count
  ),
  classified AS (
    SELECT
      id,
      is_done,
      priority,
      CASE
        WHEN is_done THEN 'done'
        WHEN placed_boxes >= box_count THEN 'loaded'
        ELSE 'pending'
      END AS status
    FROM order_status
  ),
  -- distinct orders present on each wall, joined to their computed status
  wall_orders AS (
    SELECT DISTINCT
      p.wall_number,
      c.id,
      c.is_done,
      c.status
    FROM public.placements p
    JOIN classified c ON c.id = p.order_id
    WHERE p.shipment_id = p_shipment_id
  ),
  walls AS (
    SELECT
      wall_number,
      COUNT(*) FILTER (WHERE NOT is_done)        AS open_orders,
      COUNT(*) FILTER (WHERE status = 'loaded')  AS loaded_orders
    FROM wall_orders
    GROUP BY wall_number
    ORDER BY wall_number
  )
  SELECT jsonb_build_object(
    'shipment_name',      (SELECT name FROM public.shipments WHERE id = p_shipment_id),
    'total_orders',       (SELECT COUNT(*) FROM classified),
    'done_orders',        (SELECT COUNT(*) FROM classified WHERE is_done),
    'open_orders',        (SELECT COUNT(*) FROM classified WHERE NOT is_done),
    'urgent_open_orders', (SELECT COUNT(*) FROM classified WHERE NOT is_done AND priority = 'urgent'),
    'walls', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'wall_number',   wall_number,
          'open_orders',   open_orders,
          'loaded_orders', loaded_orders
        ))
       FROM walls),
      '[]'::jsonb
    )
  );
$$;

-- Expose to logged-in users only; the Copilot endpoint is JWT-verified.
-- NOTE: Supabase's default privileges grant EXECUTE directly to anon at
-- creation time — REVOKE FROM PUBLIC alone does not remove that direct
-- grant, so anon must be revoked explicitly.
REVOKE ALL ON FUNCTION public.get_shipment_overview(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shipment_overview(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_shipment_overview(uuid) TO authenticated;
