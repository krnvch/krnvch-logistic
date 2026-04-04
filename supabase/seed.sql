-- ============================================================
-- SEED DATA: Realistic test data for Grida platform
-- Run via Supabase SQL Editor or psql
-- Idempotent: deletes all existing data before inserting
-- ============================================================

-- Clean slate (cascades delete orders + placements)
TRUNCATE shipments CASCADE;

-- ============================================================
-- SHIPMENTS (8 total)
-- ============================================================

INSERT INTO shipments (id, name, trailer_walls, boxes_per_wall, status, created_by, created_at) VALUES
  -- Active: heavily loaded (daily work)
  ('a0000001-0000-0000-0000-000000000001', 'Berlin Großmarkt — April 4',       30, 24, 'active',    'admin@tulip.app', '2026-04-04 06:00:00+02'),
  ('a0000001-0000-0000-0000-000000000002', 'Hamburg Wholesale — April 4',       30, 24, 'active',    'admin@tulip.app', '2026-04-04 05:30:00+02'),
  -- Active: moderately loaded
  ('a0000001-0000-0000-0000-000000000003', 'Munich Farmers Market — April 5',   30, 24, 'active',    'admin@tulip.app', '2026-04-04 14:00:00+02'),
  -- Active: lightly loaded (just started)
  ('a0000001-0000-0000-0000-000000000004', 'Dresden Weekend Market — April 6',  30, 24, 'active',    'admin@tulip.app', '2026-04-04 16:00:00+02'),
  -- Active: empty (blank state)
  ('a0000001-0000-0000-0000-000000000005', 'Leipzig Special — April 7',         30, 24, 'active',    'admin@tulip.app', '2026-04-04 17:00:00+02'),
  -- Completed: full shipments
  ('a0000001-0000-0000-0000-000000000006', 'Berlin Großmarkt — April 2',       30, 24, 'completed', 'admin@tulip.app', '2026-04-02 05:00:00+02'),
  ('a0000001-0000-0000-0000-000000000007', 'Frankfurt Blumenmarkt — April 1',  30, 24, 'completed', 'admin@tulip.app', '2026-04-01 06:00:00+02'),
  -- Completed: small delivery
  ('a0000001-0000-0000-0000-000000000008', 'Potsdam Boutique Run — March 31',  20, 24, 'completed', 'admin@tulip.app', '2026-03-31 07:00:00+02');


-- ============================================================
-- SHIPMENT 1: Berlin Großmarkt — April 4 (active, heavy ~75%)
-- 40 orders, most loaded/done
-- ============================================================
DO $$
DECLARE
  s1 UUID := 'a0000001-0000-0000-0000-000000000001';
  oid UUID;
BEGIN

-- Order 1: fully loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000001', s1, 'BER-001', 'Blumengroßhandel Schmidt', 'Mixed tulips, premium roses', 4, 24, '06:30', 'normal', false, NULL, '2026-04-04 06:05:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000001', 1, 12),
  (s1, 'b0000001-0001-0000-0000-000000000001', 2, 12);

-- Order 2: fully loaded, done
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000002', s1, 'BER-002', 'Markt am Maybachufer', 'Sunflowers, daisies, greenery', 3, 18, '07:00', 'normal', true, '2026-04-04 07:15:00+02', '2026-04-04 06:08:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000002', 3, 10),
  (s1, 'b0000001-0001-0000-0000-000000000002', 4, 8);

-- Order 3: urgent, fully loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000003', s1, 'BER-003', 'Hotel Adlon Kempinski', 'White roses, orchids — lobby arrangement', 2, 12, '06:00', 'urgent', false, NULL, '2026-04-04 06:02:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000003', 1, 12);

-- Order 4: large, partially loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000004', s1, 'BER-004', 'Edeka Kreuzberg Zentral', 'Spring bouquets, potted herbs', 5, 36, '08:00', 'normal', false, NULL, '2026-04-04 06:10:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000004', 5, 12),
  (s1, 'b0000001-0001-0000-0000-000000000004', 6, 12);
-- 24 of 36 placed

-- Order 5: done
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000005', s1, 'BER-005', 'Blumencafé Prenzlauer Berg', 'Table arrangements, seasonal', 2, 8, '07:30', 'normal', true, '2026-04-04 07:45:00+02', '2026-04-04 06:12:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000005', 7, 8);

-- Order 6: urgent, done
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000006', s1, 'BER-006', 'Botanischer Garten Gift Shop', 'Exotic plants, orchid mix', 3, 15, '06:15', 'urgent', true, '2026-04-04 06:30:00+02', '2026-04-04 06:03:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000006', 8, 15);

-- Order 7: no placements yet (pending 0%)
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000007', s1, 'BER-007', 'Rewe Mitte Filiale', 'Potted plants, succulents', 4, 20, '09:00', 'normal', false, NULL, '2026-04-04 06:15:00+02');

-- Order 8: fully loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000008', s1, 'BER-008', 'KaDeWe Floral Department', 'Premium roses, peonies, lilies', 3, 30, '07:00', 'normal', false, NULL, '2026-04-04 06:18:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000008', 9, 10),
  (s1, 'b0000001-0001-0000-0000-000000000008', 10, 10),
  (s1, 'b0000001-0001-0000-0000-000000000008', 11, 10);

-- Order 9: small, done
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000009', s1, 'BER-009', 'Café Einstein', 'Lavender bundles', 1, 4, '07:00', 'normal', true, '2026-04-04 07:20:00+02', '2026-04-04 06:20:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000009', 12, 4);

-- Order 10: partially loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000010', s1, 'BER-010', 'Galeries Lafayette Berlin', 'Luxury arrangements, imported', 6, 42, '08:30', 'normal', false, NULL, '2026-04-04 06:22:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000010', 13, 14),
  (s1, 'b0000001-0001-0000-0000-000000000010', 14, 14);
-- 28 of 42 placed

-- Order 11: urgent, no placements
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000011', s1, 'BER-011', 'Charité Hospital Reception', 'Get-well bouquets, cheerful mix', 2, 10, '06:30', 'urgent', false, NULL, '2026-04-04 06:25:00+02');

-- Order 12: fully loaded, done
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000012', s1, 'BER-012', 'Bio Company Friedrichshain', 'Organic herbs, edible flowers', 3, 9, '07:15', 'normal', true, '2026-04-04 07:30:00+02', '2026-04-04 06:28:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000012', 15, 9);

-- Order 13: loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000013', s1, 'BER-013', 'Aldi Süd Neukölln', 'Budget bouquets, tulip bundles', 2, 45, '09:00', 'normal', false, NULL, '2026-04-04 06:30:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000013', 16, 15),
  (s1, 'b0000001-0001-0000-0000-000000000013', 17, 15),
  (s1, 'b0000001-0001-0000-0000-000000000013', 18, 15);

-- Order 14: small, loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000014', s1, 'BER-014', 'Café Kranzler', 'Seasonal table flowers', 1, 3, '08:00', 'normal', false, NULL, '2026-04-04 06:32:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000014', 12, 3);

-- Order 15: loaded, done
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000015', s1, 'BER-015', 'Winterfeldt Markt Stand 12', 'Tulips, ranunculus, anemones', 3, 15, '06:45', 'normal', true, '2026-04-04 07:00:00+02', '2026-04-04 06:35:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000015', 19, 15);

-- Order 16: partially loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000016', s1, 'BER-016', 'Lidl Tempelhof', 'Value packs, mixed flowers', 2, 30, '09:30', 'normal', false, NULL, '2026-04-04 06:38:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000016', 20, 10);
-- 10 of 30

-- Order 17: loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000017', s1, 'BER-017', 'Markthalle Neun', 'Dried flowers, lavender bundles', 2, 6, '08:00', 'normal', false, NULL, '2026-04-04 06:40:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000017', 21, 6);

-- Order 18: urgent, partially loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000018', s1, 'BER-018', 'Soho House Berlin', 'Statement arrangements, designer vases', 3, 20, '07:00', 'urgent', false, NULL, '2026-04-04 06:05:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000018', 22, 8);
-- 8 of 20

-- Order 19: loaded
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000019', s1, 'BER-019', 'Turkish Market Kreuzberg', 'Cheap bundles, carnations', 1, 35, '10:00', 'normal', false, NULL, '2026-04-04 06:42:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000019', 23, 12),
  (s1, 'b0000001-0001-0000-0000-000000000019', 24, 12),
  (s1, 'b0000001-0001-0000-0000-000000000019', 25, 11);

-- Order 20: loaded, done
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at)
VALUES ('b0000001-0001-0000-0000-000000000020', s1, 'BER-020', 'Dussmann das KulturKaufhaus', 'Gift bouquets, wrapped', 2, 12, '07:30', 'normal', true, '2026-04-04 07:50:00+02', '2026-04-04 06:45:00+02');
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000020', 26, 12);

-- Orders 21-30: mix of states
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at) VALUES
  ('b0000001-0001-0000-0000-000000000021', s1, 'BER-021', 'Penny Markt Schöneberg',       'Budget bouquets',            1, 25, '10:00', 'normal', false, NULL,                          '2026-04-04 06:48:00+02'),
  ('b0000001-0001-0000-0000-000000000022', s1, 'BER-022', 'Westin Grand Hotel',            'Lobby + restaurant flowers',  4, 28, '06:00', 'urgent', false, NULL,                          '2026-04-04 06:01:00+02'),
  ('b0000001-0001-0000-0000-000000000023', s1, 'BER-023', 'Blumen Dilek Spandau',          'Roses, gerbera',              2, 14, '08:30', 'normal', false, NULL,                          '2026-04-04 06:50:00+02'),
  ('b0000001-0001-0000-0000-000000000024', s1, 'BER-024', 'Netto Charlottenburg',          'Weekly flower stock',         2, 20, '09:00', 'normal', false, NULL,                          '2026-04-04 06:52:00+02'),
  ('b0000001-0001-0000-0000-000000000025', s1, 'BER-025', 'Restaurant Tim Raue',           'Fine dining arrangements',    2,  5, '06:30', 'urgent', true,  '2026-04-04 06:50:00+02',     '2026-04-04 06:04:00+02'),
  ('b0000001-0001-0000-0000-000000000026', s1, 'BER-026', 'Floristik Meyer Wedding',       'Wedding prep stock',          6, 40, '08:00', 'normal', false, NULL,                          '2026-04-04 06:55:00+02'),
  ('b0000001-0001-0000-0000-000000000027', s1, 'BER-027', 'Kaufland Spandau',              'Mixed seasonal',              3, 22, '09:30', 'normal', false, NULL,                          '2026-04-04 06:58:00+02'),
  ('b0000001-0001-0000-0000-000000000028', s1, 'BER-028', 'Yorck Kino Foyer',              'Decorative plants',           1,  3, '07:00', 'normal', true,  '2026-04-04 07:10:00+02',     '2026-04-04 07:00:00+02'),
  ('b0000001-0001-0000-0000-000000000029', s1, 'BER-029', 'Rossmann Alexanderplatz',       'Small potted plants',         2, 16, '09:00', 'normal', false, NULL,                          '2026-04-04 07:02:00+02'),
  ('b0000001-0001-0000-0000-000000000030', s1, 'BER-030', 'Mall of Berlin Flower Kiosk',   'Impulse bouquets',            1, 10, '08:00', 'normal', false, NULL,                          '2026-04-04 07:05:00+02');

-- Placements for orders 21-30
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000021', 27, 12),
  (s1, 'b0000001-0001-0000-0000-000000000021', 28, 13),
  (s1, 'b0000001-0001-0000-0000-000000000022', 2, 12),
  (s1, 'b0000001-0001-0000-0000-000000000022', 4, 16),
  (s1, 'b0000001-0001-0000-0000-000000000023', 29, 14),
  (s1, 'b0000001-0001-0000-0000-000000000025', 7, 5),
  (s1, 'b0000001-0001-0000-0000-000000000026', 5, 12),
  (s1, 'b0000001-0001-0000-0000-000000000026', 6, 12),
  (s1, 'b0000001-0001-0000-0000-000000000028', 15, 3),
  (s1, 'b0000001-0001-0000-0000-000000000030', 30, 10);
-- Orders 24, 27, 29: no placements (pending 0%)
-- Order 26: 24 of 40 (partially loaded)

-- Orders 31-40
INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at) VALUES
  ('b0000001-0001-0000-0000-000000000031', s1, 'BER-031', 'Veganz Friedrichshain',         'Edible flowers, microgreens',  3,  7, '08:00', 'normal', false, NULL,                          '2026-04-04 07:08:00+02'),
  ('b0000001-0001-0000-0000-000000000032', s1, 'BER-032', 'The Ritz-Carlton Berlin',       'Suite flowers, event prep',    5, 18, '06:00', 'urgent', false, NULL,                          '2026-04-04 06:01:00+02'),
  ('b0000001-0001-0000-0000-000000000033', s1, 'BER-033', 'Alnatura Prenzlauer Berg',      'Organic potted herbs',         4, 12, '09:00', 'normal', false, NULL,                          '2026-04-04 07:10:00+02'),
  ('b0000001-0001-0000-0000-000000000034', s1, 'BER-034', 'Tempelhofer Feld Kiosk',        'Sunflowers only',              1,  8, '10:00', 'normal', false, NULL,                          '2026-04-04 07:12:00+02'),
  ('b0000001-0001-0000-0000-000000000035', s1, 'BER-035', 'Fleurop Partner Mitte',         'Delivery bouquets assorted',   3, 25, '07:00', 'normal', false, NULL,                          '2026-04-04 07:15:00+02'),
  ('b0000001-0001-0000-0000-000000000036', s1, 'BER-036', 'East Side Gallery Café',        'Terrace flowers, hanging',     2,  6, '08:30', 'normal', true,  '2026-04-04 08:45:00+02',     '2026-04-04 07:18:00+02'),
  ('b0000001-0001-0000-0000-000000000037', s1, 'BER-037', 'Spa Vabali Berlin',             'Relaxation area plants',       2, 10, '07:00', 'normal', false, NULL,                          '2026-04-04 07:20:00+02'),
  ('b0000001-0001-0000-0000-000000000038', s1, 'BER-038', 'Berliner Ensemble Foyer',       'Theater opening night',        3, 15, '17:00', 'urgent', false, NULL,                          '2026-04-04 07:22:00+02'),
  ('b0000001-0001-0000-0000-000000000039', s1, 'BER-039', 'OBI Baumarkt Treptow',          'Garden stock, seasonal',       5, 44, '10:00', 'normal', false, NULL,                          '2026-04-04 07:25:00+02'),
  ('b0000001-0001-0000-0000-000000000040', s1, 'BER-040', 'Mövenpick Hotel Potsdamer',     'Breakfast tables, reception',  2,  8, '06:00', 'normal', true,  '2026-04-04 06:20:00+02',     '2026-04-04 06:00:00+02');

INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s1, 'b0000001-0001-0000-0000-000000000031', 29, 7),
  (s1, 'b0000001-0001-0000-0000-000000000032', 3, 4),
  (s1, 'b0000001-0001-0000-0000-000000000032', 9, 14),
  (s1, 'b0000001-0001-0000-0000-000000000033', 21, 12),
  (s1, 'b0000001-0001-0000-0000-000000000035', 20, 12),
  (s1, 'b0000001-0001-0000-0000-000000000035', 26, 8),
  -- 20 of 25
  (s1, 'b0000001-0001-0000-0000-000000000036', 30, 6),
  (s1, 'b0000001-0001-0000-0000-000000000037', 28, 10),
  (s1, 'b0000001-0001-0000-0000-000000000040', 22, 8);
-- Orders 34, 38, 39: no placements (pending 0%)

END $$;


-- ============================================================
-- SHIPMENT 2: Hamburg Wholesale — April 4 (active, heavy ~70%)
-- 35 orders
-- ============================================================
DO $$
DECLARE
  s2 UUID := 'a0000001-0000-0000-0000-000000000002';
BEGIN

INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at) VALUES
  ('b0000002-0001-0000-0000-000000000001', s2, 'HAM-001', 'Fischmarkt Blumen Hans',        'Market stand stock',           3, 40, '05:00', 'urgent', false, NULL,                          '2026-04-04 05:30:00+02'),
  ('b0000002-0001-0000-0000-000000000002', s2, 'HAM-002', 'Alsterhaus Floral',             'Department store displays',    4, 30, '07:00', 'normal', false, NULL,                          '2026-04-04 05:35:00+02'),
  ('b0000002-0001-0000-0000-000000000003', s2, 'HAM-003', 'Blumenladen Eppendorf',         'Local shop restock',           5, 22, '08:00', 'normal', true,  '2026-04-04 08:15:00+02',     '2026-04-04 05:38:00+02'),
  ('b0000002-0001-0000-0000-000000000004', s2, 'HAM-004', 'Café Paris Hamburg',            'Bistro flowers',               1,  5, '07:30', 'normal', true,  '2026-04-04 07:45:00+02',     '2026-04-04 05:40:00+02'),
  ('b0000002-0001-0000-0000-000000000005', s2, 'HAM-005', 'Park Hyatt Hamburg',            'Suite arrangements',           3, 18, '06:00', 'urgent', false, NULL,                          '2026-04-04 05:32:00+02'),
  ('b0000002-0001-0000-0000-000000000006', s2, 'HAM-006', 'Rewe Altona',                   'Supermarket flower shelf',     2, 28, '09:00', 'normal', false, NULL,                          '2026-04-04 05:42:00+02'),
  ('b0000002-0001-0000-0000-000000000007', s2, 'HAM-007', 'Isemarkt Stand 45',             'Organic tulips, local herbs',  3, 15, '06:00', 'normal', false, NULL,                          '2026-04-04 05:45:00+02'),
  ('b0000002-0001-0000-0000-000000000008', s2, 'HAM-008', 'Hapag-Lloyd HQ Reception',      'Corporate arrangements',       2, 12, '07:00', 'normal', true,  '2026-04-04 07:20:00+02',     '2026-04-04 05:48:00+02'),
  ('b0000002-0001-0000-0000-000000000009', s2, 'HAM-009', 'Edeka Eimsbüttel',              'Weekly fresh flowers',         2, 20, '08:30', 'normal', false, NULL,                          '2026-04-04 05:50:00+02'),
  ('b0000002-0001-0000-0000-000000000010', s2, 'HAM-010', 'Hamburger Kunsthalle',          'Exhibition opening',           3, 10, '16:00', 'urgent', false, NULL,                          '2026-04-04 05:52:00+02'),
  ('b0000002-0001-0000-0000-000000000011', s2, 'HAM-011', 'Elbphilharmonie Café',          'Concert hall lobby',           2,  8, '17:00', 'normal', false, NULL,                          '2026-04-04 05:55:00+02'),
  ('b0000002-0001-0000-0000-000000000012', s2, 'HAM-012', 'Blumen Risse Harburg',          'Wholesale restock',            6, 45, '06:30', 'normal', false, NULL,                          '2026-04-04 05:58:00+02'),
  ('b0000002-0001-0000-0000-000000000013', s2, 'HAM-013', 'Budni Winterhude',              'Small bouquets, gifts',        2, 14, '09:00', 'normal', false, NULL,                          '2026-04-04 06:00:00+02'),
  ('b0000002-0001-0000-0000-000000000014', s2, 'HAM-014', 'East Hotel HafenCity',          'Boutique hotel rooms',         2,  6, '06:00', 'normal', true,  '2026-04-04 06:25:00+02',     '2026-04-04 06:02:00+02'),
  ('b0000002-0001-0000-0000-000000000015', s2, 'HAM-015', 'Lidl Barmbek',                  'Budget flowers',               1, 32, '09:30', 'normal', false, NULL,                          '2026-04-04 06:05:00+02'),
  ('b0000002-0001-0000-0000-000000000016', s2, 'HAM-016', 'Stilbruch Altona',              'Vintage shop decor',           2,  4, '08:00', 'normal', false, NULL,                          '2026-04-04 06:08:00+02'),
  ('b0000002-0001-0000-0000-000000000017', s2, 'HAM-017', 'Garten von Ehren',              'Garden center stock',          8, 38, '07:00', 'normal', false, NULL,                          '2026-04-04 06:10:00+02'),
  ('b0000002-0001-0000-0000-000000000018', s2, 'HAM-018', 'Tortue Hotel Bar',              'Bar and lounge flowers',       1,  3, '18:00', 'normal', false, NULL,                          '2026-04-04 06:12:00+02'),
  ('b0000002-0001-0000-0000-000000000019', s2, 'HAM-019', 'Penny Wandsbek',                'Value packs',                  1, 18, '10:00', 'normal', false, NULL,                          '2026-04-04 06:15:00+02'),
  ('b0000002-0001-0000-0000-000000000020', s2, 'HAM-020', 'Fairmont Vier Jahreszeiten',    'Grand hotel, all floors',      5, 35, '06:00', 'urgent', false, NULL,                          '2026-04-04 05:31:00+02'),
  ('b0000002-0001-0000-0000-000000000021', s2, 'HAM-021', 'Miniatur Wunderland Gift',      'Souvenir mini-plants',         1,  7, '09:00', 'normal', true,  '2026-04-04 09:10:00+02',     '2026-04-04 06:18:00+02'),
  ('b0000002-0001-0000-0000-000000000022', s2, 'HAM-022', 'Stage Theater Hafen',           'Musical premiere decor',       3, 16, '15:00', 'normal', false, NULL,                          '2026-04-04 06:20:00+02'),
  ('b0000002-0001-0000-0000-000000000023', s2, 'HAM-023', 'Netto St. Pauli',               'Mixed bundles',                2, 12, '09:00', 'normal', false, NULL,                          '2026-04-04 06:22:00+02'),
  ('b0000002-0001-0000-0000-000000000024', s2, 'HAM-024', 'Side Hotel Design Lounge',      'Minimalist arrangements',      2,  9, '07:00', 'normal', false, NULL,                          '2026-04-04 06:25:00+02'),
  ('b0000002-0001-0000-0000-000000000025', s2, 'HAM-025', 'Jenisch Haus Café',             'Garden café flowers',          2,  5, '08:00', 'normal', true,  '2026-04-04 08:20:00+02',     '2026-04-04 06:28:00+02'),
  ('b0000002-0001-0000-0000-000000000026', s2, 'HAM-026', 'Kaufland Bergedorf',            'Retail shelf stock',           3, 24, '09:30', 'normal', false, NULL,                          '2026-04-04 06:30:00+02'),
  ('b0000002-0001-0000-0000-000000000027', s2, 'HAM-027', 'Bioland Hof Egge',              'Farm shop display',            4, 10, '07:30', 'normal', false, NULL,                          '2026-04-04 06:32:00+02'),
  ('b0000002-0001-0000-0000-000000000028', s2, 'HAM-028', 'Blankeneser Markt',             'Weekend market stock',         3, 20, '06:00', 'normal', false, NULL,                          '2026-04-04 06:35:00+02'),
  ('b0000002-0001-0000-0000-000000000029', s2, 'HAM-029', 'Atlantic Hotel Kempinski',      'Ballroom event',               4, 25, '14:00', 'urgent', false, NULL,                          '2026-04-04 06:38:00+02'),
  ('b0000002-0001-0000-0000-000000000030', s2, 'HAM-030', 'Dehner Gartencenter',           'Seasonal outdoor stock',       7, 42, '08:00', 'normal', false, NULL,                          '2026-04-04 06:40:00+02'),
  ('b0000002-0001-0000-0000-000000000031', s2, 'HAM-031', 'Blumen Graaf Blankenese',       'Premium local florist',        4, 15, '07:00', 'normal', false, NULL,                          '2026-04-04 06:42:00+02'),
  ('b0000002-0001-0000-0000-000000000032', s2, 'HAM-032', 'Karstadt Mönckebergstraße',     'Department store corner',      2, 20, '08:30', 'normal', false, NULL,                          '2026-04-04 06:45:00+02'),
  ('b0000002-0001-0000-0000-000000000033', s2, 'HAM-033', 'Schanzenviertel Kiosk',         'Street market, cheap mix',     1,  8, '10:00', 'normal', false, NULL,                          '2026-04-04 06:48:00+02'),
  ('b0000002-0001-0000-0000-000000000034', s2, 'HAM-034', 'Fleurop Partner Altona',        'Delivery service stock',       3, 18, '07:00', 'normal', false, NULL,                          '2026-04-04 06:50:00+02'),
  ('b0000002-0001-0000-0000-000000000035', s2, 'HAM-035', 'Eppendorfer Landstraße Deli',   'Deli counter flowers',         1,  4, '08:00', 'normal', true,  '2026-04-04 08:05:00+02',     '2026-04-04 06:52:00+02');

-- Placements for Shipment 2
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  -- HAM-001: fully loaded (40)
  (s2, 'b0000002-0001-0000-0000-000000000001', 1, 14),
  (s2, 'b0000002-0001-0000-0000-000000000001', 2, 14),
  (s2, 'b0000002-0001-0000-0000-000000000001', 3, 12),
  -- HAM-002: fully loaded (30)
  (s2, 'b0000002-0001-0000-0000-000000000002', 4, 15),
  (s2, 'b0000002-0001-0000-0000-000000000002', 5, 15),
  -- HAM-003: fully loaded (22) + done
  (s2, 'b0000002-0001-0000-0000-000000000003', 6, 12),
  (s2, 'b0000002-0001-0000-0000-000000000003', 7, 10),
  -- HAM-004: loaded (5) + done
  (s2, 'b0000002-0001-0000-0000-000000000004', 8, 5),
  -- HAM-005: loaded (18)
  (s2, 'b0000002-0001-0000-0000-000000000005', 8, 18),
  -- HAM-006: partially (16 of 28)
  (s2, 'b0000002-0001-0000-0000-000000000006', 9, 16),
  -- HAM-007: loaded (15)
  (s2, 'b0000002-0001-0000-0000-000000000007', 10, 15),
  -- HAM-008: loaded (12) + done
  (s2, 'b0000002-0001-0000-0000-000000000008', 11, 12),
  -- HAM-009: partially (10 of 20)
  (s2, 'b0000002-0001-0000-0000-000000000009', 12, 10),
  -- HAM-010: loaded (10)
  (s2, 'b0000002-0001-0000-0000-000000000010', 13, 10),
  -- HAM-011: loaded (8)
  (s2, 'b0000002-0001-0000-0000-000000000011', 14, 8),
  -- HAM-012: partially (24 of 45)
  (s2, 'b0000002-0001-0000-0000-000000000012', 15, 12),
  (s2, 'b0000002-0001-0000-0000-000000000012', 16, 12),
  -- HAM-013: loaded (14)
  (s2, 'b0000002-0001-0000-0000-000000000013', 17, 14),
  -- HAM-014: loaded (6) + done
  (s2, 'b0000002-0001-0000-0000-000000000014', 18, 6),
  -- HAM-015: partially (20 of 32)
  (s2, 'b0000002-0001-0000-0000-000000000015', 19, 10),
  (s2, 'b0000002-0001-0000-0000-000000000015', 20, 10),
  -- HAM-016: loaded (4)
  (s2, 'b0000002-0001-0000-0000-000000000016', 18, 4),
  -- HAM-017: partially (24 of 38)
  (s2, 'b0000002-0001-0000-0000-000000000017', 21, 12),
  (s2, 'b0000002-0001-0000-0000-000000000017', 22, 12),
  -- HAM-018: loaded (3)
  (s2, 'b0000002-0001-0000-0000-000000000018', 14, 3),
  -- HAM-019: loaded (18)
  (s2, 'b0000002-0001-0000-0000-000000000019', 23, 18),
  -- HAM-020: partially (24 of 35)
  (s2, 'b0000002-0001-0000-0000-000000000020', 24, 12),
  (s2, 'b0000002-0001-0000-0000-000000000020', 25, 12),
  -- HAM-021: loaded (7) + done
  (s2, 'b0000002-0001-0000-0000-000000000021', 10, 7),
  -- HAM-025: loaded (5) + done
  (s2, 'b0000002-0001-0000-0000-000000000025', 13, 5),
  -- HAM-026: loaded (24)
  (s2, 'b0000002-0001-0000-0000-000000000026', 26, 24),
  -- HAM-028: partially (12 of 20)
  (s2, 'b0000002-0001-0000-0000-000000000028', 27, 12),
  -- HAM-031: loaded (15)
  (s2, 'b0000002-0001-0000-0000-000000000031', 28, 15),
  -- HAM-035: loaded (4) + done
  (s2, 'b0000002-0001-0000-0000-000000000035', 17, 4);
-- HAM-022,023,024,027,029,030,032,033,034: no placements (pending 0%)

END $$;


-- ============================================================
-- SHIPMENT 3: Munich Farmers Market (active, moderate ~45%)
-- 30 orders
-- ============================================================
DO $$
DECLARE
  s3 UUID := 'a0000001-0000-0000-0000-000000000003';
BEGIN

INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at) VALUES
  ('b0000003-0001-0000-0000-000000000001', s3, 'MUC-001', 'Viktualienmarkt Blumenstand',   'Market stand full restock',    5, 38, '06:00', 'urgent', false, NULL,                          '2026-04-04 14:00:00+02'),
  ('b0000003-0001-0000-0000-000000000002', s3, 'MUC-002', 'Bayerischer Hof Hotel',         'Grand hotel arrangements',     4, 25, '07:00', 'urgent', false, NULL,                          '2026-04-04 14:05:00+02'),
  ('b0000003-0001-0000-0000-000000000003', s3, 'MUC-003', 'Dallmayr Delikatessen',         'Luxury shop flowers',          2, 12, '08:00', 'normal', false, NULL,                          '2026-04-04 14:08:00+02'),
  ('b0000003-0001-0000-0000-000000000004', s3, 'MUC-004', 'Edeka Schwabing',               'Weekly fresh stock',           3, 20, '09:00', 'normal', false, NULL,                          '2026-04-04 14:10:00+02'),
  ('b0000003-0001-0000-0000-000000000005', s3, 'MUC-005', 'BMW Welt Reception',            'Corporate lobby flowers',      2, 10, '07:30', 'normal', false, NULL,                          '2026-04-04 14:12:00+02'),
  ('b0000003-0001-0000-0000-000000000006', s3, 'MUC-006', 'Augustiner Keller',             'Beer garden decorations',      1,  8, '16:00', 'normal', false, NULL,                          '2026-04-04 14:15:00+02'),
  ('b0000003-0001-0000-0000-000000000007', s3, 'MUC-007', 'Ludwig Beck am Rathauseck',     'Department store floor',       3, 16, '08:30', 'normal', false, NULL,                          '2026-04-04 14:18:00+02'),
  ('b0000003-0001-0000-0000-000000000008', s3, 'MUC-008', 'Café Luitpold',                 'Café table arrangements',      1,  5, '07:00', 'normal', false, NULL,                          '2026-04-04 14:20:00+02'),
  ('b0000003-0001-0000-0000-000000000009', s3, 'MUC-009', 'Residenz München Gift Shop',    'Souvenir dried flowers',       2,  7, '09:00', 'normal', false, NULL,                          '2026-04-04 14:22:00+02'),
  ('b0000003-0001-0000-0000-000000000010', s3, 'MUC-010', 'Aldi Süd Haidhausen',           'Budget seasonal bundles',      1, 30, '09:30', 'normal', false, NULL,                          '2026-04-04 14:25:00+02'),
  ('b0000003-0001-0000-0000-000000000011', s3, 'MUC-011', 'Mandarin Oriental Munich',      'Spa + restaurant flowers',     3, 15, '06:00', 'urgent', false, NULL,                          '2026-04-04 14:02:00+02'),
  ('b0000003-0001-0000-0000-000000000012', s3, 'MUC-012', 'Rewe Sendling',                 'Store flower corner',          2, 22, '09:00', 'normal', false, NULL,                          '2026-04-04 14:28:00+02'),
  ('b0000003-0001-0000-0000-000000000013', s3, 'MUC-013', 'Elisabethmarkt Florist',        'Local market stall',           4, 18, '06:30', 'normal', false, NULL,                          '2026-04-04 14:30:00+02'),
  ('b0000003-0001-0000-0000-000000000014', s3, 'MUC-014', 'Hofbräuhaus Gift Corner',       'Tourist souvenirs, edelweiss', 1,  4, '08:00', 'normal', false, NULL,                          '2026-04-04 14:32:00+02'),
  ('b0000003-0001-0000-0000-000000000015', s3, 'MUC-015', 'Olympiapark Event Hall',        'Conference flowers',           2, 20, '14:00', 'normal', false, NULL,                          '2026-04-04 14:35:00+02'),
  ('b0000003-0001-0000-0000-000000000016', s3, 'MUC-016', 'Netto Pasing',                  'Discount packs',              1, 15, '10:00', 'normal', false, NULL,                          '2026-04-04 14:38:00+02'),
  ('b0000003-0001-0000-0000-000000000017', s3, 'MUC-017', 'Blumenboutique Gärtnerplatz',   'Designer bouquets',            3,  9, '08:00', 'normal', false, NULL,                          '2026-04-04 14:40:00+02'),
  ('b0000003-0001-0000-0000-000000000018', s3, 'MUC-018', 'Penny Markt Giesing',           'Cheap flowers',                1, 12, '09:30', 'normal', false, NULL,                          '2026-04-04 14:42:00+02'),
  ('b0000003-0001-0000-0000-000000000019', s3, 'MUC-019', 'Vier Jahreszeiten Kempinski',   'All suites refresh',           4, 28, '06:00', 'urgent', false, NULL,                          '2026-04-04 14:03:00+02'),
  ('b0000003-0001-0000-0000-000000000020', s3, 'MUC-020', 'Kaufhof Marienplatz',           'Ground floor displays',        2, 18, '08:00', 'normal', false, NULL,                          '2026-04-04 14:45:00+02'),
  ('b0000003-0001-0000-0000-000000000021', s3, 'MUC-021', 'Tollwood Festival Stand',       'Festival booth decor',         2, 14, '15:00', 'normal', false, NULL,                          '2026-04-04 14:48:00+02'),
  ('b0000003-0001-0000-0000-000000000022', s3, 'MUC-022', 'OBI München Freiham',           'Garden center stock',          6, 40, '08:00', 'normal', false, NULL,                          '2026-04-04 14:50:00+02'),
  ('b0000003-0001-0000-0000-000000000023', s3, 'MUC-023', 'Café Frischhut',                'Small table flowers',          1,  3, '07:00', 'normal', false, NULL,                          '2026-04-04 14:52:00+02'),
  ('b0000003-0001-0000-0000-000000000024', s3, 'MUC-024', 'Fleurop Partner Bogenhausen',   'Delivery stock',               3, 20, '07:00', 'normal', false, NULL,                          '2026-04-04 14:55:00+02'),
  ('b0000003-0001-0000-0000-000000000025', s3, 'MUC-025', 'Münchner Philharmonie Foyer',   'Concert hall flowers',         2, 10, '17:00', 'normal', false, NULL,                          '2026-04-04 14:58:00+02'),
  ('b0000003-0001-0000-0000-000000000026', s3, 'MUC-026', 'Lidl Neuhausen',                'Value flower packs',           1, 24, '09:00', 'normal', false, NULL,                          '2026-04-04 15:00:00+02'),
  ('b0000003-0001-0000-0000-000000000027', s3, 'MUC-027', 'Rosengarten Nymphenburg',       'Rose varieties, premium',      2, 15, '08:00', 'normal', false, NULL,                          '2026-04-04 15:02:00+02'),
  ('b0000003-0001-0000-0000-000000000028', s3, 'MUC-028', 'FC Bayern Arena VIP',           'Match day VIP boxes',          2,  6, '13:00', 'urgent', false, NULL,                          '2026-04-04 15:05:00+02'),
  ('b0000003-0001-0000-0000-000000000029', s3, 'MUC-029', 'Blumen Burkard Maxvorstadt',    'Neighborhood florist stock',   5, 20, '07:30', 'normal', false, NULL,                          '2026-04-04 15:08:00+02'),
  ('b0000003-0001-0000-0000-000000000030', s3, 'MUC-030', 'Wirtshaus zur Brez''n',         'Restaurant table decor',       1,  4, '11:00', 'normal', false, NULL,                          '2026-04-04 15:10:00+02');

-- Placements for Shipment 3 (~45% loaded)
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  -- MUC-001: partially (24 of 38)
  (s3, 'b0000003-0001-0000-0000-000000000001', 1, 12),
  (s3, 'b0000003-0001-0000-0000-000000000001', 2, 12),
  -- MUC-002: partially (15 of 25)
  (s3, 'b0000003-0001-0000-0000-000000000002', 3, 15),
  -- MUC-003: loaded (12)
  (s3, 'b0000003-0001-0000-0000-000000000003', 4, 12),
  -- MUC-005: loaded (10)
  (s3, 'b0000003-0001-0000-0000-000000000005', 5, 10),
  -- MUC-008: loaded (5)
  (s3, 'b0000003-0001-0000-0000-000000000008', 6, 5),
  -- MUC-011: loaded (15)
  (s3, 'b0000003-0001-0000-0000-000000000011', 7, 15),
  -- MUC-013: partially (10 of 18)
  (s3, 'b0000003-0001-0000-0000-000000000013', 8, 10),
  -- MUC-014: loaded (4)
  (s3, 'b0000003-0001-0000-0000-000000000014', 6, 4),
  -- MUC-017: loaded (9)
  (s3, 'b0000003-0001-0000-0000-000000000017', 9, 9),
  -- MUC-023: loaded (3)
  (s3, 'b0000003-0001-0000-0000-000000000023', 9, 3),
  -- MUC-028: loaded (6)
  (s3, 'b0000003-0001-0000-0000-000000000028', 5, 6),
  -- MUC-030: loaded (4)
  (s3, 'b0000003-0001-0000-0000-000000000030', 8, 4);
-- All other orders: no placements yet

END $$;


-- ============================================================
-- SHIPMENT 4: Dresden Weekend Market (active, light ~15%)
-- 20 orders, mostly not loaded yet
-- ============================================================
DO $$
DECLARE
  s4 UUID := 'a0000001-0000-0000-0000-000000000004';
BEGIN

INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at) VALUES
  ('b0000004-0001-0000-0000-000000000001', s4, 'DRS-001', 'Dresdner Striezelmarkt',        'Market stand seasonal',        3, 30, '06:00', 'normal', false, NULL, '2026-04-04 16:00:00+02'),
  ('b0000004-0001-0000-0000-000000000002', s4, 'DRS-002', 'Taschenbergpalais Kempinski',   'Hotel lobby',                  2, 15, '07:00', 'urgent', false, NULL, '2026-04-04 16:05:00+02'),
  ('b0000004-0001-0000-0000-000000000003', s4, 'DRS-003', 'Pfunds Molkerei',               'Cheese shop window flowers',   1,  5, '08:00', 'normal', false, NULL, '2026-04-04 16:08:00+02'),
  ('b0000004-0001-0000-0000-000000000004', s4, 'DRS-004', 'Edeka Neustadt',                'Store stock',                  3, 18, '09:00', 'normal', false, NULL, '2026-04-04 16:10:00+02'),
  ('b0000004-0001-0000-0000-000000000005', s4, 'DRS-005', 'Semperoper Gift Shop',          'Opera house flowers',          2,  8, '17:00', 'normal', false, NULL, '2026-04-04 16:12:00+02'),
  ('b0000004-0001-0000-0000-000000000006', s4, 'DRS-006', 'Rewe Blasewitz',                'Weekend flower stock',         2, 22, '08:30', 'normal', false, NULL, '2026-04-04 16:15:00+02'),
  ('b0000004-0001-0000-0000-000000000007', s4, 'DRS-007', 'Blumen König Altstadt',         'Florist restock',              5, 28, '07:00', 'normal', false, NULL, '2026-04-04 16:18:00+02'),
  ('b0000004-0001-0000-0000-000000000008', s4, 'DRS-008', 'Café Schinkelwache',            'Café decor',                   1,  3, '07:30', 'normal', false, NULL, '2026-04-04 16:20:00+02'),
  ('b0000004-0001-0000-0000-000000000009', s4, 'DRS-009', 'Lidl Löbtau',                   'Budget packs',                 1, 20, '09:30', 'normal', false, NULL, '2026-04-04 16:22:00+02'),
  ('b0000004-0001-0000-0000-000000000010', s4, 'DRS-010', 'Grünes Gewölbe Museum',         'Exhibition flowers',           2, 10, '09:00', 'normal', false, NULL, '2026-04-04 16:25:00+02'),
  ('b0000004-0001-0000-0000-000000000011', s4, 'DRS-011', 'Lingner Schloss Terrasse',      'Terrace event',                2, 12, '15:00', 'normal', false, NULL, '2026-04-04 16:28:00+02'),
  ('b0000004-0001-0000-0000-000000000012', s4, 'DRS-012', 'Penny Cotta',                   'Cheap bundles',                1, 14, '10:00', 'normal', false, NULL, '2026-04-04 16:30:00+02'),
  ('b0000004-0001-0000-0000-000000000013', s4, 'DRS-013', 'Hilton Dresden',                'Hotel rooms refresh',          3, 20, '06:30', 'urgent', false, NULL, '2026-04-04 16:02:00+02'),
  ('b0000004-0001-0000-0000-000000000014', s4, 'DRS-014', 'Sächsische Staatsoper Foyer',   'Performance night decor',      2, 16, '16:00', 'normal', false, NULL, '2026-04-04 16:32:00+02'),
  ('b0000004-0001-0000-0000-000000000015', s4, 'DRS-015', 'Netto Johannstadt',             'Value stock',                  1, 10, '09:00', 'normal', false, NULL, '2026-04-04 16:35:00+02'),
  ('b0000004-0001-0000-0000-000000000016', s4, 'DRS-016', 'Bio Sphäre Loschwitz',          'Organic plants',               4,  7, '08:00', 'normal', false, NULL, '2026-04-04 16:38:00+02'),
  ('b0000004-0001-0000-0000-000000000017', s4, 'DRS-017', 'Aldi Prohlis',                  'Weekly flower supply',         1, 25, '09:30', 'normal', false, NULL, '2026-04-04 16:40:00+02'),
  ('b0000004-0001-0000-0000-000000000018', s4, 'DRS-018', 'Restaurant Sophienkeller',      'Medieval banquet flowers',     1,  6, '17:00', 'normal', false, NULL, '2026-04-04 16:42:00+02'),
  ('b0000004-0001-0000-0000-000000000019', s4, 'DRS-019', 'Kaufland Gorbitz',              'Retail shelf',                 2, 18, '09:00', 'normal', false, NULL, '2026-04-04 16:45:00+02'),
  ('b0000004-0001-0000-0000-000000000020', s4, 'DRS-020', 'Elbe Park Shopping Center',     'Mall flower kiosk',            2, 12, '08:00', 'normal', false, NULL, '2026-04-04 16:48:00+02');

-- Placements for Shipment 4 (~15% — just started loading)
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  -- DRS-002: partially (8 of 15)
  (s4, 'b0000004-0001-0000-0000-000000000002', 1, 8),
  -- DRS-003: loaded (5)
  (s4, 'b0000004-0001-0000-0000-000000000003', 2, 5),
  -- DRS-008: loaded (3)
  (s4, 'b0000004-0001-0000-0000-000000000008', 2, 3),
  -- DRS-013: partially (10 of 20)
  (s4, 'b0000004-0001-0000-0000-000000000013', 1, 10);
-- All other orders: no placements yet

END $$;


-- ============================================================
-- SHIPMENT 5: Leipzig Special (active, empty — blank state)
-- No orders at all
-- ============================================================
-- Nothing to insert


-- ============================================================
-- SHIPMENT 6: Berlin Großmarkt — April 2 (completed, full)
-- 35 orders, all done
-- ============================================================
DO $$
DECLARE
  s6 UUID := 'a0000001-0000-0000-0000-000000000006';
BEGIN

INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at) VALUES
  ('b0000006-0001-0000-0000-000000000001', s6, 'BER-A001', 'Blumengroßhandel Schmidt',     'Mixed tulips, roses',          4, 24, '06:30', 'normal', true, '2026-04-02 07:00:00+02', '2026-04-02 05:05:00+02'),
  ('b0000006-0001-0000-0000-000000000002', s6, 'BER-A002', 'Markt am Maybachufer',         'Sunflowers, daisies',          3, 18, '07:00', 'normal', true, '2026-04-02 07:30:00+02', '2026-04-02 05:08:00+02'),
  ('b0000006-0001-0000-0000-000000000003', s6, 'BER-A003', 'Hotel Adlon Kempinski',        'Lobby white roses',            2, 12, '06:00', 'urgent', true, '2026-04-02 06:20:00+02', '2026-04-02 05:02:00+02'),
  ('b0000006-0001-0000-0000-000000000004', s6, 'BER-A004', 'KaDeWe Floral',                'Premium display',              3, 30, '07:00', 'normal', true, '2026-04-02 07:45:00+02', '2026-04-02 05:10:00+02'),
  ('b0000006-0001-0000-0000-000000000005', s6, 'BER-A005', 'Edeka Kreuzberg',              'Spring bouquets',              4, 28, '08:00', 'normal', true, '2026-04-02 08:20:00+02', '2026-04-02 05:12:00+02'),
  ('b0000006-0001-0000-0000-000000000006', s6, 'BER-A006', 'Café Einstein',                'Table lavender',               1,  4, '07:00', 'normal', true, '2026-04-02 07:15:00+02', '2026-04-02 05:15:00+02'),
  ('b0000006-0001-0000-0000-000000000007', s6, 'BER-A007', 'Botanischer Garten',           'Exotic orchid mix',            3, 15, '06:15', 'urgent', true, '2026-04-02 06:35:00+02', '2026-04-02 05:03:00+02'),
  ('b0000006-0001-0000-0000-000000000008', s6, 'BER-A008', 'Rewe Mitte',                   'Potted plants',                4, 20, '09:00', 'normal', true, '2026-04-02 09:15:00+02', '2026-04-02 05:18:00+02'),
  ('b0000006-0001-0000-0000-000000000009', s6, 'BER-A009', 'Galeries Lafayette',           'Luxury imports',               5, 35, '08:30', 'normal', true, '2026-04-02 08:50:00+02', '2026-04-02 05:20:00+02'),
  ('b0000006-0001-0000-0000-000000000010', s6, 'BER-A010', 'Aldi Neukölln',                'Budget tulips',                1, 40, '09:00', 'normal', true, '2026-04-02 09:30:00+02', '2026-04-02 05:22:00+02'),
  ('b0000006-0001-0000-0000-000000000011', s6, 'BER-A011', 'Blumencafé PB',                'Seasonal mix',                 2,  8, '07:30', 'normal', true, '2026-04-02 07:50:00+02', '2026-04-02 05:25:00+02'),
  ('b0000006-0001-0000-0000-000000000012', s6, 'BER-A012', 'Charité Reception',            'Get-well bouquets',            2, 10, '06:30', 'urgent', true, '2026-04-02 06:50:00+02', '2026-04-02 05:04:00+02'),
  ('b0000006-0001-0000-0000-000000000013', s6, 'BER-A013', 'Bio Company',                  'Organic herbs',                3,  9, '07:15', 'normal', true, '2026-04-02 07:35:00+02', '2026-04-02 05:28:00+02'),
  ('b0000006-0001-0000-0000-000000000014', s6, 'BER-A014', 'Lidl Tempelhof',               'Value packs',                  2, 30, '09:30', 'normal', true, '2026-04-02 09:50:00+02', '2026-04-02 05:30:00+02'),
  ('b0000006-0001-0000-0000-000000000015', s6, 'BER-A015', 'Winterfeldt Markt 12',         'Tulips, anemones',             3, 15, '06:45', 'normal', true, '2026-04-02 07:05:00+02', '2026-04-02 05:32:00+02'),
  ('b0000006-0001-0000-0000-000000000016', s6, 'BER-A016', 'Markthalle Neun',              'Dried flowers',                2,  6, '08:00', 'normal', true, '2026-04-02 08:10:00+02', '2026-04-02 05:35:00+02'),
  ('b0000006-0001-0000-0000-000000000017', s6, 'BER-A017', 'Soho House',                   'Statement pieces',             3, 20, '07:00', 'urgent', true, '2026-04-02 07:20:00+02', '2026-04-02 05:01:00+02'),
  ('b0000006-0001-0000-0000-000000000018', s6, 'BER-A018', 'Turkish Market',               'Carnation bundles',            1, 35, '10:00', 'normal', true, '2026-04-02 10:20:00+02', '2026-04-02 05:38:00+02'),
  ('b0000006-0001-0000-0000-000000000019', s6, 'BER-A019', 'Dussmann KulturKaufhaus',      'Gift bouquets',                2, 12, '07:30', 'normal', true, '2026-04-02 07:55:00+02', '2026-04-02 05:40:00+02'),
  ('b0000006-0001-0000-0000-000000000020', s6, 'BER-A020', 'Penny Schöneberg',             'Budget bundles',               1, 22, '10:00', 'normal', true, '2026-04-02 10:15:00+02', '2026-04-02 05:42:00+02'),
  ('b0000006-0001-0000-0000-000000000021', s6, 'BER-A021', 'Westin Grand',                 'All-floor refresh',            4, 28, '06:00', 'urgent', true, '2026-04-02 06:30:00+02', '2026-04-02 05:01:00+02'),
  ('b0000006-0001-0000-0000-000000000022', s6, 'BER-A022', 'Restaurant Tim Raue',          'Fine dining',                  2,  5, '06:30', 'normal', true, '2026-04-02 06:45:00+02', '2026-04-02 05:45:00+02'),
  ('b0000006-0001-0000-0000-000000000023', s6, 'BER-A023', 'Netto Charlottenburg',         'Weekly stock',                 2, 18, '09:00', 'normal', true, '2026-04-02 09:20:00+02', '2026-04-02 05:48:00+02'),
  ('b0000006-0001-0000-0000-000000000024', s6, 'BER-A024', 'Kaufland Spandau',             'Mixed seasonal',               3, 22, '09:30', 'normal', true, '2026-04-02 09:45:00+02', '2026-04-02 05:50:00+02'),
  ('b0000006-0001-0000-0000-000000000025', s6, 'BER-A025', 'Yorck Kino',                   'Foyer decor',                  1,  3, '07:00', 'normal', true, '2026-04-02 07:10:00+02', '2026-04-02 05:52:00+02'),
  ('b0000006-0001-0000-0000-000000000026', s6, 'BER-A026', 'Rossmann Alexanderplatz',      'Potted plants',                2, 16, '09:00', 'normal', true, '2026-04-02 09:10:00+02', '2026-04-02 05:55:00+02'),
  ('b0000006-0001-0000-0000-000000000027', s6, 'BER-A027', 'Mall of Berlin',               'Impulse bouquets',             1, 10, '08:00', 'normal', true, '2026-04-02 08:15:00+02', '2026-04-02 05:58:00+02'),
  ('b0000006-0001-0000-0000-000000000028', s6, 'BER-A028', 'Floristik Meyer',              'Wedding prep',                 6, 40, '08:00', 'normal', true, '2026-04-02 08:30:00+02', '2026-04-02 06:00:00+02'),
  ('b0000006-0001-0000-0000-000000000029', s6, 'BER-A029', 'Blumen Dilek',                 'Roses, gerbera',               2, 14, '08:30', 'normal', true, '2026-04-02 08:40:00+02', '2026-04-02 06:02:00+02'),
  ('b0000006-0001-0000-0000-000000000030', s6, 'BER-A030', 'Ritz-Carlton',                 'Suite flowers',                5, 18, '06:00', 'urgent', true, '2026-04-02 06:25:00+02', '2026-04-02 05:01:00+02'),
  ('b0000006-0001-0000-0000-000000000031', s6, 'BER-A031', 'Veganz',                       'Edible flowers',               2,  7, '08:00', 'normal', true, '2026-04-02 08:10:00+02', '2026-04-02 06:05:00+02'),
  ('b0000006-0001-0000-0000-000000000032', s6, 'BER-A032', 'Alnatura PB',                  'Organic herbs',                3, 10, '09:00', 'normal', true, '2026-04-02 09:15:00+02', '2026-04-02 06:08:00+02'),
  ('b0000006-0001-0000-0000-000000000033', s6, 'BER-A033', 'Tempelhofer Kiosk',            'Sunflowers',                   1,  8, '10:00', 'normal', true, '2026-04-02 10:10:00+02', '2026-04-02 06:10:00+02'),
  ('b0000006-0001-0000-0000-000000000034', s6, 'BER-A034', 'Berliner Ensemble',            'Theater night',                3, 15, '17:00', 'normal', true, '2026-04-02 17:10:00+02', '2026-04-02 06:12:00+02'),
  ('b0000006-0001-0000-0000-000000000035', s6, 'BER-A035', 'Spa Vabali',                   'Relaxation plants',            2, 10, '07:00', 'normal', true, '2026-04-02 07:15:00+02', '2026-04-02 06:15:00+02');

-- All orders fully loaded (placements)
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s6, 'b0000006-0001-0000-0000-000000000001', 1, 12), (s6, 'b0000006-0001-0000-0000-000000000001', 2, 12),
  (s6, 'b0000006-0001-0000-0000-000000000002', 3, 18),
  (s6, 'b0000006-0001-0000-0000-000000000003', 4, 12),
  (s6, 'b0000006-0001-0000-0000-000000000004', 5, 15), (s6, 'b0000006-0001-0000-0000-000000000004', 6, 15),
  (s6, 'b0000006-0001-0000-0000-000000000005', 7, 14), (s6, 'b0000006-0001-0000-0000-000000000005', 8, 14),
  (s6, 'b0000006-0001-0000-0000-000000000006', 4, 4),
  (s6, 'b0000006-0001-0000-0000-000000000007', 9, 15),
  (s6, 'b0000006-0001-0000-0000-000000000008', 10, 20),
  (s6, 'b0000006-0001-0000-0000-000000000009', 11, 12), (s6, 'b0000006-0001-0000-0000-000000000009', 12, 12), (s6, 'b0000006-0001-0000-0000-000000000009', 13, 11),
  (s6, 'b0000006-0001-0000-0000-000000000010', 14, 20), (s6, 'b0000006-0001-0000-0000-000000000010', 15, 20),
  (s6, 'b0000006-0001-0000-0000-000000000011', 3, 6),   -- wall 3 has 18+6=24 (full)
  (s6, 'b0000006-0001-0000-0000-000000000012', 4, 8),   -- wall 4 has 12+4+8=24 (full)
  (s6, 'b0000006-0001-0000-0000-000000000013', 9, 9),
  (s6, 'b0000006-0001-0000-0000-000000000014', 16, 15), (s6, 'b0000006-0001-0000-0000-000000000014', 17, 15),
  (s6, 'b0000006-0001-0000-0000-000000000015', 18, 15),
  (s6, 'b0000006-0001-0000-0000-000000000016', 18, 6),
  (s6, 'b0000006-0001-0000-0000-000000000017', 19, 20),
  (s6, 'b0000006-0001-0000-0000-000000000018', 20, 12), (s6, 'b0000006-0001-0000-0000-000000000018', 21, 12), (s6, 'b0000006-0001-0000-0000-000000000018', 22, 11),
  (s6, 'b0000006-0001-0000-0000-000000000019', 19, 4),  -- wall 19 has 20+4=24 (full)
  (s6, 'b0000006-0001-0000-0000-000000000019', 23, 8),
  (s6, 'b0000006-0001-0000-0000-000000000020', 24, 22),
  (s6, 'b0000006-0001-0000-0000-000000000021', 25, 14), (s6, 'b0000006-0001-0000-0000-000000000021', 26, 14),
  (s6, 'b0000006-0001-0000-0000-000000000022', 23, 5),
  (s6, 'b0000006-0001-0000-0000-000000000023', 27, 18),
  (s6, 'b0000006-0001-0000-0000-000000000024', 28, 22),
  (s6, 'b0000006-0001-0000-0000-000000000025', 27, 3),
  (s6, 'b0000006-0001-0000-0000-000000000026', 29, 16),
  (s6, 'b0000006-0001-0000-0000-000000000027', 29, 8),   -- wall 29 has 16+8=24 (full)
  (s6, 'b0000006-0001-0000-0000-000000000028', 13, 13), (s6, 'b0000006-0001-0000-0000-000000000028', 14, 4), (s6, 'b0000006-0001-0000-0000-000000000028', 30, 23),
  (s6, 'b0000006-0001-0000-0000-000000000029', 23, 11), -- wall 23 has 8+5+11=24 (full)
  (s6, 'b0000006-0001-0000-0000-000000000030', 26, 10), (s6, 'b0000006-0001-0000-0000-000000000030', 2, 8),
  (s6, 'b0000006-0001-0000-0000-000000000031', 10, 4),  (s6, 'b0000006-0001-0000-0000-000000000031', 28, 2), -- wall 28 has 22+2=24 (full)
  (s6, 'b0000006-0001-0000-0000-000000000032', 30, 1),  (s6, 'b0000006-0001-0000-0000-000000000032', 1, 9),  -- need 10 total
  (s6, 'b0000006-0001-0000-0000-000000000033', 1, 3),   (s6, 'b0000006-0001-0000-0000-000000000033', 2, 4), (s6, 'b0000006-0001-0000-0000-000000000033', 22, 1),
  (s6, 'b0000006-0001-0000-0000-000000000034', 20, 8),  (s6, 'b0000006-0001-0000-0000-000000000034', 21, 7),
  (s6, 'b0000006-0001-0000-0000-000000000035', 22, 10);

END $$;


-- ============================================================
-- SHIPMENT 7: Frankfurt Blumenmarkt (completed, full)
-- 30 orders, all done
-- ============================================================
DO $$
DECLARE
  s7 UUID := 'a0000001-0000-0000-0000-000000000007';
BEGIN

INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at) VALUES
  ('b0000007-0001-0000-0000-000000000001', s7, 'FRA-001', 'Kleinmarkthalle Stand 8',       'Market stand restock',         4, 35, '06:00', 'normal', true, '2026-04-01 06:30:00+02', '2026-04-01 06:00:00+02'),
  ('b0000007-0001-0000-0000-000000000002', s7, 'FRA-002', 'Steigenberger Frankfurter Hof', 'Grand hotel all floors',       5, 30, '06:30', 'urgent', true, '2026-04-01 06:50:00+02', '2026-04-01 06:02:00+02'),
  ('b0000007-0001-0000-0000-000000000003', s7, 'FRA-003', 'Palmengarten Gift Shop',        'Botanical gifts',              3, 12, '08:00', 'normal', true, '2026-04-01 08:15:00+02', '2026-04-01 06:05:00+02'),
  ('b0000007-0001-0000-0000-000000000004', s7, 'FRA-004', 'Rewe Sachsenhausen',            'Store flower shelf',           2, 20, '09:00', 'normal', true, '2026-04-01 09:10:00+02', '2026-04-01 06:08:00+02'),
  ('b0000007-0001-0000-0000-000000000005', s7, 'FRA-005', 'Alte Oper Café',                'Foyer arrangements',           2,  8, '17:00', 'normal', true, '2026-04-01 17:15:00+02', '2026-04-01 06:10:00+02'),
  ('b0000007-0001-0000-0000-000000000006', s7, 'FRA-006', 'MyZeil Shopping',               'Mall kiosk stock',             1, 15, '08:30', 'normal', true, '2026-04-01 08:40:00+02', '2026-04-01 06:12:00+02'),
  ('b0000007-0001-0000-0000-000000000007', s7, 'FRA-007', 'Edeka Bornheim',                'Weekly fresh stock',           3, 22, '08:00', 'normal', true, '2026-04-01 08:10:00+02', '2026-04-01 06:15:00+02'),
  ('b0000007-0001-0000-0000-000000000008', s7, 'FRA-008', 'Jumeirah Frankfurt',            'Luxury suites',                3, 18, '06:00', 'urgent', true, '2026-04-01 06:20:00+02', '2026-04-01 06:01:00+02'),
  ('b0000007-0001-0000-0000-000000000009', s7, 'FRA-009', 'Lidl Bockenheim',               'Budget stock',                 1, 28, '09:30', 'normal', true, '2026-04-01 09:45:00+02', '2026-04-01 06:18:00+02'),
  ('b0000007-0001-0000-0000-000000000010', s7, 'FRA-010', 'Café Hauptwache',               'Table flowers',                1,  4, '07:00', 'normal', true, '2026-04-01 07:10:00+02', '2026-04-01 06:20:00+02'),
  ('b0000007-0001-0000-0000-000000000011', s7, 'FRA-011', 'Senckenberg Museum Shop',       'Nature-themed gifts',          2,  6, '09:00', 'normal', true, '2026-04-01 09:10:00+02', '2026-04-01 06:22:00+02'),
  ('b0000007-0001-0000-0000-000000000012', s7, 'FRA-012', 'Aldi Nordend',                  'Value packs',                  1, 25, '09:00', 'normal', true, '2026-04-01 09:20:00+02', '2026-04-01 06:25:00+02'),
  ('b0000007-0001-0000-0000-000000000013', s7, 'FRA-013', 'Netto Gallus',                  'Cheap bundles',                1, 14, '10:00', 'normal', true, '2026-04-01 10:10:00+02', '2026-04-01 06:28:00+02'),
  ('b0000007-0001-0000-0000-000000000014', s7, 'FRA-014', 'Villa Kennedy Hotel',           'Boutique hotel decor',         2, 10, '07:00', 'normal', true, '2026-04-01 07:20:00+02', '2026-04-01 06:30:00+02'),
  ('b0000007-0001-0000-0000-000000000015', s7, 'FRA-015', 'Berger Straße Florist',         'Local shop restock',           5, 20, '07:30', 'normal', true, '2026-04-01 07:45:00+02', '2026-04-01 06:32:00+02'),
  ('b0000007-0001-0000-0000-000000000016', s7, 'FRA-016', 'Penny Höchst',                  'Discount flowers',             1, 12, '09:30', 'normal', true, '2026-04-01 09:40:00+02', '2026-04-01 06:35:00+02'),
  ('b0000007-0001-0000-0000-000000000017', s7, 'FRA-017', 'Deutsche Bank HQ Lobby',        'Corporate entrance',           2, 10, '06:00', 'urgent', true, '2026-04-01 06:15:00+02', '2026-04-01 06:01:00+02'),
  ('b0000007-0001-0000-0000-000000000018', s7, 'FRA-018', 'Kaufhof Zeil',                  'Department store',             2, 18, '08:00', 'normal', true, '2026-04-01 08:20:00+02', '2026-04-01 06:38:00+02'),
  ('b0000007-0001-0000-0000-000000000019', s7, 'FRA-019', 'Fleurop Partner Westend',       'Delivery stock',               3, 15, '07:00', 'normal', true, '2026-04-01 07:10:00+02', '2026-04-01 06:40:00+02'),
  ('b0000007-0001-0000-0000-000000000020', s7, 'FRA-020', 'Messe Frankfurt Entrance',      'Trade fair decor',             3, 25, '14:00', 'normal', true, '2026-04-01 14:15:00+02', '2026-04-01 06:42:00+02'),
  ('b0000007-0001-0000-0000-000000000021', s7, 'FRA-021', 'Goetheturm Kiosk',              'Hiking trail flowers',         1,  3, '08:00', 'normal', true, '2026-04-01 08:10:00+02', '2026-04-01 06:45:00+02'),
  ('b0000007-0001-0000-0000-000000000022', s7, 'FRA-022', 'OBI Frankfurt Niederrad',       'Garden stock',                 6, 40, '07:30', 'normal', true, '2026-04-01 07:50:00+02', '2026-04-01 06:48:00+02'),
  ('b0000007-0001-0000-0000-000000000023', s7, 'FRA-023', 'Sofitel Frankfurt Opera',       'Restaurant + bar',             2,  9, '06:30', 'normal', true, '2026-04-01 06:45:00+02', '2026-04-01 06:50:00+02'),
  ('b0000007-0001-0000-0000-000000000024', s7, 'FRA-024', 'Blumenbörse Ostend',            'Wholesale cluster',            4, 45, '06:00', 'normal', true, '2026-04-01 06:20:00+02', '2026-04-01 06:00:00+02'),
  ('b0000007-0001-0000-0000-000000000025', s7, 'FRA-025', 'Nordwestzentrum Mall',          'Suburban mall flowers',        2, 16, '09:00', 'normal', true, '2026-04-01 09:15:00+02', '2026-04-01 06:52:00+02'),
  ('b0000007-0001-0000-0000-000000000026', s7, 'FRA-026', 'Café Karin Nordend',            'Brunch table decor',           1,  3, '07:00', 'normal', true, '2026-04-01 07:05:00+02', '2026-04-01 06:55:00+02'),
  ('b0000007-0001-0000-0000-000000000027', s7, 'FRA-027', 'Marriott Frankfurt',            'Conference rooms',             3, 14, '06:00', 'urgent', true, '2026-04-01 06:18:00+02', '2026-04-01 06:01:00+02'),
  ('b0000007-0001-0000-0000-000000000028', s7, 'FRA-028', 'Dehner Gartencenter Hanau',     'Garden center',                5, 38, '07:00', 'normal', true, '2026-04-01 07:15:00+02', '2026-04-01 06:58:00+02'),
  ('b0000007-0001-0000-0000-000000000029', s7, 'FRA-029', 'Rossmann Bornheim',             'Small plants',                 2, 10, '09:00', 'normal', true, '2026-04-01 09:10:00+02', '2026-04-01 07:00:00+02'),
  ('b0000007-0001-0000-0000-000000000030', s7, 'FRA-030', 'Budni Nordend',                 'Gift bouquets',               2,  8, '08:30', 'normal', true, '2026-04-01 08:40:00+02', '2026-04-01 07:02:00+02');

-- All orders fully loaded
INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s7, 'b0000007-0001-0000-0000-000000000001', 1, 12), (s7, 'b0000007-0001-0000-0000-000000000001', 2, 12), (s7, 'b0000007-0001-0000-0000-000000000001', 3, 11),
  (s7, 'b0000007-0001-0000-0000-000000000002', 4, 15), (s7, 'b0000007-0001-0000-0000-000000000002', 5, 15),
  (s7, 'b0000007-0001-0000-0000-000000000003', 3, 12),
  (s7, 'b0000007-0001-0000-0000-000000000004', 6, 20),
  (s7, 'b0000007-0001-0000-0000-000000000005', 6, 4), (s7, 'b0000007-0001-0000-0000-000000000005', 7, 4),
  (s7, 'b0000007-0001-0000-0000-000000000006', 7, 15),
  (s7, 'b0000007-0001-0000-0000-000000000007', 8, 22),
  (s7, 'b0000007-0001-0000-0000-000000000008', 9, 18),
  (s7, 'b0000007-0001-0000-0000-000000000009', 10, 14), (s7, 'b0000007-0001-0000-0000-000000000009', 11, 14),
  (s7, 'b0000007-0001-0000-0000-000000000010', 9, 4),
  (s7, 'b0000007-0001-0000-0000-000000000011', 12, 6),
  (s7, 'b0000007-0001-0000-0000-000000000012', 13, 13), (s7, 'b0000007-0001-0000-0000-000000000012', 14, 12),
  (s7, 'b0000007-0001-0000-0000-000000000013', 12, 14),
  (s7, 'b0000007-0001-0000-0000-000000000014', 14, 10),
  (s7, 'b0000007-0001-0000-0000-000000000015', 15, 20),
  (s7, 'b0000007-0001-0000-0000-000000000016', 15, 4), (s7, 'b0000007-0001-0000-0000-000000000016', 16, 8),
  (s7, 'b0000007-0001-0000-0000-000000000017', 16, 10),
  (s7, 'b0000007-0001-0000-0000-000000000018', 17, 18),
  (s7, 'b0000007-0001-0000-0000-000000000019', 18, 15),
  (s7, 'b0000007-0001-0000-0000-000000000020', 19, 13), (s7, 'b0000007-0001-0000-0000-000000000020', 20, 12),
  (s7, 'b0000007-0001-0000-0000-000000000021', 18, 3),
  (s7, 'b0000007-0001-0000-0000-000000000022', 21, 14), (s7, 'b0000007-0001-0000-0000-000000000022', 22, 14), (s7, 'b0000007-0001-0000-0000-000000000022', 23, 12),
  (s7, 'b0000007-0001-0000-0000-000000000023', 23, 9),
  (s7, 'b0000007-0001-0000-0000-000000000024', 24, 15), (s7, 'b0000007-0001-0000-0000-000000000024', 25, 15), (s7, 'b0000007-0001-0000-0000-000000000024', 26, 15),
  (s7, 'b0000007-0001-0000-0000-000000000025', 27, 16),
  (s7, 'b0000007-0001-0000-0000-000000000026', 27, 3),
  (s7, 'b0000007-0001-0000-0000-000000000027', 28, 14),
  (s7, 'b0000007-0001-0000-0000-000000000028', 29, 14), (s7, 'b0000007-0001-0000-0000-000000000028', 30, 14), (s7, 'b0000007-0001-0000-0000-000000000028', 20, 10),
  (s7, 'b0000007-0001-0000-0000-000000000029', 11, 10),
  (s7, 'b0000007-0001-0000-0000-000000000030', 10, 8);

END $$;


-- ============================================================
-- SHIPMENT 8: Potsdam Boutique Run (completed, small — 8 orders)
-- 20 walls trailer
-- ============================================================
DO $$
DECLARE
  s8 UUID := 'a0000001-0000-0000-0000-000000000008';
BEGIN

INSERT INTO orders (id, shipment_id, order_number, client_name, description, item_count, box_count, pickup_time, priority, is_done, done_at, created_at) VALUES
  ('b0000008-0001-0000-0000-000000000001', s8, 'POT-001', 'Sanssouci Palace Gift Shop',    'Royal garden bouquets',        3, 12, '08:00', 'normal', true, '2026-03-31 08:15:00+02', '2026-03-31 07:00:00+02'),
  ('b0000008-0001-0000-0000-000000000002', s8, 'POT-002', 'Hotel Bayrisches Haus',         'Boutique hotel rooms',         2,  8, '07:30', 'normal', true, '2026-03-31 07:45:00+02', '2026-03-31 07:02:00+02'),
  ('b0000008-0001-0000-0000-000000000003', s8, 'POT-003', 'Holländisches Viertel Florist', 'Dutch Quarter flower shop',    4, 18, '07:00', 'normal', true, '2026-03-31 07:20:00+02', '2026-03-31 07:05:00+02'),
  ('b0000008-0001-0000-0000-000000000004', s8, 'POT-004', 'Biosphäre Potsdam Shop',        'Tropical plants, mini',        2,  6, '09:00', 'normal', true, '2026-03-31 09:10:00+02', '2026-03-31 07:08:00+02'),
  ('b0000008-0001-0000-0000-000000000005', s8, 'POT-005', 'Rewe Am Stern',                 'Store flowers',                2, 15, '08:30', 'normal', true, '2026-03-31 08:40:00+02', '2026-03-31 07:10:00+02'),
  ('b0000008-0001-0000-0000-000000000006', s8, 'POT-006', 'Café Heider Nauener Tor',       'Café tables',                  1,  3, '07:00', 'normal', true, '2026-03-31 07:10:00+02', '2026-03-31 07:12:00+02'),
  ('b0000008-0001-0000-0000-000000000007', s8, 'POT-007', 'Dorint Hotel Potsdam',          'Conference + lobby',           3, 14, '07:00', 'urgent', true, '2026-03-31 07:15:00+02', '2026-03-31 07:01:00+02'),
  ('b0000008-0001-0000-0000-000000000008', s8, 'POT-008', 'Stern Center Mall',             'Mall flower stand',            1, 10, '08:00', 'normal', true, '2026-03-31 08:10:00+02', '2026-03-31 07:15:00+02');

INSERT INTO placements (shipment_id, order_id, wall_number, box_count) VALUES
  (s8, 'b0000008-0001-0000-0000-000000000001', 1, 12),
  (s8, 'b0000008-0001-0000-0000-000000000002', 2, 8),
  (s8, 'b0000008-0001-0000-0000-000000000003', 3, 18),
  (s8, 'b0000008-0001-0000-0000-000000000004', 2, 6),
  (s8, 'b0000008-0001-0000-0000-000000000005', 4, 15),
  (s8, 'b0000008-0001-0000-0000-000000000006', 4, 3),
  (s8, 'b0000008-0001-0000-0000-000000000007', 5, 14),
  (s8, 'b0000008-0001-0000-0000-000000000008', 6, 10);

END $$;


-- ============================================================
-- Summary:
--   Shipment 1 (Berlin active):   40 orders, ~75% loaded, 9 done
--   Shipment 2 (Hamburg active):   35 orders, ~70% loaded, 7 done
--   Shipment 3 (Munich active):    30 orders, ~45% loaded, 0 done
--   Shipment 4 (Dresden active):   20 orders, ~15% loaded, 0 done
--   Shipment 5 (Leipzig active):    0 orders (empty)
--   Shipment 6 (Berlin completed): 35 orders, all loaded + done
--   Shipment 7 (Frankfurt done):   30 orders, all loaded + done
--   Shipment 8 (Potsdam done):      8 orders, all loaded + done (small)
--
--   Total: 8 shipments, 198 orders, ~400 placements
-- ============================================================
