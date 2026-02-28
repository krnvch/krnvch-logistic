-- ============================================================
-- MULTI-SHIPMENT: parallel sessions support
-- ============================================================

-- Track who created the shipment (plain email, no FK to auth)
ALTER TABLE shipments ADD COLUMN created_by TEXT;

-- Add updated_at — shipments are now mutable (reopen)
ALTER TABLE shipments ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON shipments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Make name NOT NULL — essential for table identification
ALTER TABLE shipments ALTER COLUMN name SET DEFAULT 'Без названия';
UPDATE shipments SET name = 'Без названия' WHERE name IS NULL;
ALTER TABLE shipments ALTER COLUMN name SET NOT NULL;

-- Index for listing/filtering shipments
CREATE INDEX idx_shipments_status ON shipments(status, created_at DESC);

-- Enable realtime for shipments table (list auto-updates)
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
