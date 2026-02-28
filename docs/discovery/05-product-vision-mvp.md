> **Historical document** from the original tulip-farm discovery phase. The platform is now goods-agnostic (krnvchLogistic).

# Product Vision & MVP Scope

**Product**: Tulip Truck Load Map
**Date**: 2026-02-22
**Status**: Draft — pending stakeholder approval

---

## Vision Statement

Replace the paper trailer matrix with a shared, real-time digital map that lets the entire team see exactly where every order is inside the trailer — during loading AND during the chaos of unloading at the market.

**One sentence**: A shared spatial map of the trailer that turns "where's order #23?" from a 2-minute paper hunt into a 2-second glance.

---

## User Personas

### Persona 1: The Operator (Artem)
- **Role**: Plans and controls loading. Creates orders, fills the trailer map.
- **Context**: Standing inside the trailer, directing workers, recording placements.
- **Device**: iPad (preferred) or iPhone.
- **Needs**: Fast order entry, quick placement recording, see the full map at a glance.
- **Frustration**: Paper is messy, corrections are ugly, hard to visualize the 3D cube on 2D paper.

### Persona 2: The Worker (3-4 people)
- **Role**: Hands out orders to clients at the market.
- **Context**: Standing at the back of the trailer during unloading chaos. Multiple clients waiting.
- **Device**: iPhone or iPad.
- **Needs**: Find order by number FAST, see which walls to go to, mark order as done.
- **Frustration**: One paper sheet for 4 people. Fighting over it. Can't see real-time updates.

---

## Main Flows

### Flow 1: Order Setup (before loading)
```
Operator opens app
  → Creates a new shipment (or clears previous)
  → Adds orders one by one:
      - Order number
      - Client name / description
      - Tulip quantity
      - Box count
      - Approximate pickup time
  → Sees order list sorted by pickup time
  → Ready to start loading
```

### Flow 2: Loading the Trailer (day before delivery)
```
Operator opens trailer map (empty grid of ~30 walls)
  → Selects an order from the sidebar list
  → Taps a wall on the map
  → Enters number of boxes to place in that wall
  → System validates: remaining boxes ≤ order total, wall capacity ≤ 24
  → Placement saved, map updates:
      - Wall shows order number + box count
      - Order in sidebar shows updated "placed / total" progress
  → Repeat until all orders are placed
  → Trailer map is complete — ready for transport
```

**Key behaviors during loading**:
- One order can span multiple walls
- One wall can hold boxes from multiple orders (as long as total ≤ 24)
- Operator can adjust: move boxes, change counts, remove placements
- Map fills progressively — operator sees it build up in real-time

### Flow 3: Unloading / Pickup at Market (delivery day)
```
Worker opens app on their device
  → Sees the trailer map (full, as loaded) + order list sidebar
  → Client arrives and says "Order #23"
  → Worker EITHER:
      a) Visually scans the map for "#23" (current behavior, digital)
      b) Types "23" in search field → matching walls BLINK/HIGHLIGHT
  → Worker sees: "Order #23 is in walls 8 and 9, 12 + 12 boxes"
  → Worker goes to walls 8-9, pulls boxes (physically labeled "Order #23, 1/5" etc.)
  → Worker taps "Mark as Done" on order #23
  → Map updates in real-time for all other workers
  → Next client...
```

**Key behaviors during unloading**:
- 3-4 workers viewing the SAME map simultaneously on different devices
- Real-time sync: when one worker marks an order done, others see it instantly
- Search/highlight is the key speed enhancement over paper
- The map is the primary view — always visible, never hidden

### Flow 4: Cleanup (after delivery)
```
Operator clears/resets the shipment
  → All orders and placements removed
  → App ready for next season
```

---

## Functional Requirements (MVP)

### FR-01: Shipment Management
- Create a new shipment (implicit — one active at a time)
- Clear/reset all data for a fresh start

### FR-02: Order Management
- **Create** order with: order number, client name/description, tulip quantity, box count, pickup time
- **Edit** order details
- **Delete** order (with confirmation)
- **View** order list sorted by pickup time
- **Status**: each order is "pending" (not fully placed), "loaded" (all boxes placed), or "done" (handed to client)

### FR-03: Trailer Map — Display
- Visual grid of ~30 walls, oriented top-down (top = deepest, bottom = closest to doors)
- Each wall shows: which orders are in it, box count per order
- Occupied walls visually distinct from empty walls
- Always visible on screen alongside order list

### FR-04: Trailer Map — Placement
- Select an order + tap a wall → enter box count → save placement
- Validate: box count doesn't exceed order's remaining unplaced boxes
- Validate: wall total doesn't exceed 24 boxes
- One wall can hold boxes from multiple orders
- One order can span multiple walls
- Edit placement (change box count)
- Move placement (remove from one wall, add to another)
- Delete placement

### FR-05: Search & Highlight
- Search field (always accessible) — type order number
- Matching walls blink/flash on the map to attract attention
- Optionally: tap an order in the sidebar → highlight its walls on the map

### FR-06: Order Handout
- "Mark as Done" action on an order
- Updates visible in real-time to all connected devices
- Done orders visually distinct in the sidebar list (crossed out / dimmed)
- Done orders visually distinct on the map (dimmed / different state)

### FR-07: Real-Time Sync
- All changes (placements, status updates) sync to all connected devices immediately
- Supabase Realtime for live updates
- No manual refresh needed

### FR-08: Responsive Design
- Works on iPad (primary — landscape, big screen)
- Works on iPhone (secondary — portrait, smaller screen)
- Trailer map + order list layout adapts to screen size

---

## Non-Functional Requirements (MVP)

| ID | Requirement | Target |
|----|------------|--------|
| NFR-01 | Page load time | < 2 seconds |
| NFR-02 | Placement save time | < 500ms (perceived instant) |
| NFR-03 | Real-time sync latency | < 1 second |
| NFR-04 | Concurrent users | 4-5 simultaneous |
| NFR-05 | Data persistence | Supabase (cloud, no local-only) |
| NFR-06 | Auth | Single shared account (email/password) |
| NFR-07 | Browser support | Safari (iOS), Chrome |
| NFR-08 | No onboarding needed | Instantly understandable to a first-time user |

---

## Explicitly Out of Scope (MVP)

- Per-user logins / roles / permissions
- Partial pickups
- Year-to-year history / analytics
- Import from WhatsApp / Telegram / spreadsheets
- Individual box position tracking within a wall (left/right/top/bottom)
- Per-order color coding
- Offline mode
- Box label generation / printing
- Payment / invoicing
- Multiple trailers / multiple shipments simultaneously
- Drag-and-drop interaction (click-to-assign only for v1)

---

## Data Model (Simplified for MVP)

### `shipments`
- `id` (uuid, PK)
- `name` (text, optional — e.g., "March 2026")
- `trailer_walls` (integer, default 30 — configurable)
- `boxes_per_wall` (integer, default 24 — configurable)
- `created_at` (timestamp)
- `status` (active | completed)

### `orders`
- `id` (uuid, PK)
- `shipment_id` (FK → shipments)
- `order_number` (text, unique per shipment — e.g., "23")
- `client_name` (text)
- `description` (text, optional — notes)
- `item_count` (integer)
- `box_count` (integer)
- `pickup_time` (text — e.g., "08:00-09:00")
- `status` (pending | loaded | done)
- `created_at` / `updated_at`

### `placements`
- `id` (uuid, PK)
- `shipment_id` (FK → shipments)
- `order_id` (FK → orders)
- `wall_number` (integer, 1-30)
- `box_count` (integer)
- `created_at` / `updated_at`

**Constraints**:
- `SUM(placements.box_count) WHERE order_id = X` ≤ `orders.box_count`
- `SUM(placements.box_count) WHERE wall_number = N AND shipment_id = X` ≤ `shipments.boxes_per_wall`
- Unique: `(shipment_id, order_id, wall_number)` — one placement per order per wall

---

## Screen Layout (Conceptual)

```
┌─────────────────────────────────────────────────────────┐
│  [🔍 Search order...]                    Tulip Load Map │
├──────────────────────────────┬──────────────────────────┤
│                              │  Orders (sorted by time) │
│     TRAILER MAP              │                          │
│                              │  ┌─ #12 ─────────────┐  │
│  ┌─── Wall 1 (deepest) ───┐ │  │ Client: Petrov     │  │
│  │ #45: 24 boxes          │ │  │ 48 boxes  10:00am  │  │
│  ├─── Wall 2 ─────────────┤ │  │ ✅ Done            │  │
│  │ #45: 20  │ #38: 4      │ │  └────────────────────┘  │
│  ├─── Wall 3 ─────────────┤ │  ┌─ #23 ─────────────┐  │
│  │ #38: 24 boxes          │ │  │ Client: Sidorov    │  │
│  ├─── ...                 │ │  │ 24 boxes  09:00am  │  │
│  ├─── Wall 29 ────────────┤ │  │ 🔶 Loaded          │  │
│  │ #7: 18  │ #3: 6        │ │  └────────────────────┘  │
│  ├─── Wall 30 (doors) ────┤ │  ┌─ #7 ──────────────┐  │
│  │ #3: 24 boxes           │ │  │ Client: Ivanov     │  │
│  └────────────────────────┘ │  │ 18 boxes  08:00am  │  │
│                              │  │ 🔶 Loaded          │  │
│  ← DOORS (bottom)           │  └────────────────────┘  │
│                              │          ...             │
└──────────────────────────────┴──────────────────────────┘
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Can all orders be placed onto the trailer map? | Yes, within 30 min (vs. paper) |
| Can a worker find any order in under 5 seconds? | Yes, via search + highlight |
| Can 4 workers use the map simultaneously? | Yes, real-time sync |
| Zero "wrong order given to wrong client" errors? | Yes, clear labels + map |
| Would the team use this again next year? | Yes |
