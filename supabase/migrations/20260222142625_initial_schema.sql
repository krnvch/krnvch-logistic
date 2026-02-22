-- ============================================================
-- UTILITY: auto-update updated_at on row modification
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- SHIPMENTS: one active at a time
-- ============================================================
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  trailer_walls INTEGER NOT NULL DEFAULT 30
    CHECK (trailer_walls > 0 AND trailer_walls <= 100),
  boxes_per_wall INTEGER NOT NULL DEFAULT 24
    CHECK (boxes_per_wall > 0 AND boxes_per_wall <= 100),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- ORDERS: belong to a shipment
-- ============================================================
-- NOTE: No `status` column. Status is COMPUTED:
--   - is_done = true  → "done"
--   - SUM(placements.box_count) = box_count → "loaded"
--   - otherwise → "pending"
-- Only `is_done` is stored because it's a user-initiated action.
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  tulip_count INTEGER,
  box_count INTEGER NOT NULL CHECK (box_count > 0),
  pickup_time TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shipment_id, order_number)
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- PLACEMENTS: boxes of an order in a specific wall
-- ============================================================
CREATE TABLE placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  wall_number INTEGER NOT NULL CHECK (wall_number > 0),
  box_count INTEGER NOT NULL CHECK (box_count > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shipment_id, order_id, wall_number)
);

CREATE TRIGGER placements_updated_at
  BEFORE UPDATE ON placements FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- INDEXES: aligned with application query patterns
-- ============================================================

-- "Get all orders for the active shipment"
CREATE INDEX idx_orders_shipment ON orders(shipment_id);

-- "Get all placements for the active shipment" (main map query)
CREATE INDEX idx_placements_shipment ON placements(shipment_id);

-- "Get all placements for an order" (sidebar progress, delete cascade check)
CREATE INDEX idx_placements_order ON placements(order_id);

-- "Get all placements for a specific wall" (wall capacity check, wall popover)
CREATE INDEX idx_placements_wall ON placements(shipment_id, wall_number);


-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read and write everything
-- FOR ALL applies USING to SELECT and WITH CHECK to INSERT/UPDATE
CREATE POLICY "Authenticated full access" ON shipments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON placements
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE placements;
