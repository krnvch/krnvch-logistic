# Interview Findings — Consolidated

**Stakeholder**: Farm owner / operator (Artem)
**Date**: 2026-02-22
**Interviewers**: PM, BA, SME, Product Designer, UX Researcher, Interaction Designer

---

## 1. Business Context

- Small family tulip farm, ~100-150k tulips for March 8 (International Women's Day)
- **30-40 wholesale orders** received during February
- All orders delivered in **one day** to a wholesale market/warehouse base
- Loaded into **one Euro reefer trailer** the day before delivery
- This is a **one-time-per-year activity** (possibly a few days, but essentially one event)
- Reefer is on during transport for temperature stability — not an app concern

## 2. The Problem

### Current process
- Everything is done on **paper** — an A4 sheet with a hand-drawn trailer grid ("matrix")
- The operator (Artem) draws the empty grid, then fills it in AS loading happens
- Order list is maintained on a separate sheet (order numbers + box counts)
- Constant corrections, cross-outs, messy handwriting
- Paper is **2D** — hard to represent a 3D loading cube

### The real pain point (confirmed: unloading, not loading)
- At the warehouse base, **3-4 workers** hand out orders simultaneously
- There is **ONE paper sheet** — everyone fights over it
- Workers need to see the matrix to know where each order is located
- They considered scanning/printing copies, but the paper gets real-time annotations (cross-outs when orders are handed out) — copies go stale immediately
- **#1 need**: A shared, real-time, digital "single source of truth" accessible on multiple iPads/iPhones during unloading chaos

## 3. The Trailer — Physical Specs

| Dimension | Value |
|-----------|-------|
| Type | Standard Euro reefer trailer |
| Internal length | ~13.6m (standard) |
| Box dimensions | 40cm W x 60cm H x 60cm D (all identical) |
| Boxes per wall (width) | **6** |
| Boxes per wall (height) | **4** |
| **Boxes per wall (total)** | **24** |
| Walls (depth) | **~30** (calculated from trailer length / box depth) |
| **Total trailer capacity** | **~720 boxes** |
| Loading | Back doors only. Always full 6x4 per wall. |
| Stacking | Boxes are strong — always full 4 high, no fragility concern |

**Key simplification**: Since every wall is always 24 boxes (6x4), the trailer is effectively a **linear sequence of ~30 walls**. The 3D problem collapses into 1D: "which orders are in which wall?"

**Terminology**: A row/wall is called "куб" (cube) or "стенка" (wall) in Russian. For the app, use: **wall** or **row**.

## 4. Orders

| Field | Details |
|-------|---------|
| Count per shipment | 30-40 orders |
| Order number | Human-readable (e.g., #23) |
| Tulip quantity | Recorded per order |
| Box count | Recorded per order (derived from tulip quantity) |
| Pickup time | Known approximately per client (e.g., "between 8-9am") |
| Box labeling | Physical labels on each box: "Order #23, box 1 of 5" |
| Partial pickups | NO — client takes all boxes. Leftovers = different flow, out of scope. |

### Order entry
- **Manual entry in the app** — this is fine and preferred for MVP
- Import from WhatsApp/Telegram = nice-to-have, not MVP
- Orders come in during February, finalized before loading day

## 5. Loading Flow (Day Before Delivery)

1. All orders are known with approximate pickup times
2. Operator plans the sequence: latest pickups → back of trailer (deep), earliest pickups → near doors
3. One person (Artem) controls loading — stands inside trailer, directs workers who carry boxes
4. Workers bring boxes, operator places them and records on the matrix
5. Matrix is filled in real-time during loading
6. Sometimes remaining space at the end — secured with braces, not an issue

**Loading is a ONE-PERSON operation** — the app during loading is used by one person on one device.

## 6. Unloading Flow (Delivery Day)

1. Arrive at wholesale market/warehouse base
2. Clients arrive in approximate time windows (e.g., "between 8-9am")
3. Client says their **order number** to a worker
4. Worker looks at the matrix, finds where the order is (which walls)
5. Worker navigates to those walls and pulls boxes out through the **back doors**
6. Each box is labeled — worker counts "box 1 of 5, box 2 of 5..." to confirm all boxes are out
7. When all boxes handed over → order marked as done (crossed out on paper today)
8. **3-4 workers** doing this **simultaneously** — the core multi-user need

**Within a wall**: left/right, top/bottom is random. Irrelevant. Only depth (wall number from doors) matters.

## 7. Tracking Granularity

**Wall-level only**. Not individual box positions within a wall.

Example:
- Wall 12: 8 boxes of Order #23, 4 boxes of Order #24, 12 boxes of Order #25
- Total: 24 boxes (full wall)

This means the data model is simple:
```
placement = { wall_number, order_id, box_count }
```

No need for column_start, column_end, or layer fields.

## 8. Device & Technical Requirements

| Requirement | Details |
|-------------|---------|
| Primary device | **iPad** (preferred — bigger screen) |
| Secondary device | **iPhone** (must work too) |
| Internet | Reliable mobile data — no offline needed |
| Auth | Single shared account, real-time sync across devices |
| Per-user login | Not needed for MVP — would overcomplicate things |
| Concurrent users | 1 during loading, **3-4 during unloading** |
| Data retention | None — one-and-done per season, clear and reuse |

## 9. UX Preferences (from Designer Interview)

### Visual references
- Airplane seat booking / cinema seat selection
- Segmented, grid-like view of the trailer as a matrix

### Orientation
- **Top-down view from back doors**
- Top of screen = deepest walls (latest pickups, farthest from doors)
- Bottom of screen = closest to doors (earliest pickups)
- Same mental model as airplane seat maps

### Color
- **NO per-order color coding** — boxes are all the same color in reality
- Color only for: **occupied walls vs empty walls**
- Orders identified by their **number** displayed on the matrix, not by color

### Finding orders (the key interaction)
- Primary: **visually scan** the matrix for the order number
- Enhancement: **search field** — type order number, press Enter → matching cells **blink/flash** to attract attention
- This mirrors current behavior (scanning the paper) but adds digital search

### Screen layout
- **Trailer map ALWAYS visible** — this is the core, the base, never hidden
- **Sidebar** (left or right): ordered list of all orders with:
  - Order number
  - Box count
  - Pickup time
  - Status (done / not done)
- Two panels: map + order list, always visible together

### Status tracking
- Order is either: **not handed out** (with details) or **handed out** (marked as done)
- Simple binary status, no complex state machine needed for MVP

## 10. Out of Scope (Confirmed)

- Per-user authentication / logins
- Partial pickups
- Year-to-year history
- Import from external sources (WhatsApp, spreadsheets)
- Individual box position tracking within a wall
- Color coding per order
- Offline mode
- Box label generation/printing
- Payment/invoicing at pickup
