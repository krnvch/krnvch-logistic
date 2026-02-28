> **Historical document** from the original tulip-farm discovery phase. The platform is now goods-agnostic (krnvchLogistic).

# Tulip Truck Load Map — Discovery + Research + Solution Ideation (Agent Brief)

## 0) Context (keep this intact)
A small family tulip farm grows ~100–150k tulips for March 8. Around March 1 they deliver all orders in **one day** to a large wholesale market using **one truck/trailer (one “fura”)**. There are ~30–50 wholesale clients (orders). The key operational problem is **how to place orders (boxes) inside the trailer** so that:
- the team can load progressively during the day,
- they can quickly find and hand over the right boxes when a client arrives,
- they can avoid chaos, mistakes, and time loss.

The desired product is a **web app** with an interactive **trailer schema** (like airplane seat selection). The operator marks, row-by-row (and optionally slot-by-slot), which order is located where and how many boxes are placed in each row/slot. One order may occupy multiple rows (e.g., row 10 has 2 boxes of Order #123, row 11 has 3 more boxes of Order #123). The app must serve as a **spatial memory**: “I know where each order is relative to trailer depth (near doors vs deep).”

This project is meant for **wipe-prototyping + wipe-coding**: a full-stack working app with backend persistence, auth, and deployment.

---

# 1) Core Domain Clarification (IMPORTANT)

## 1.1 Order as a First-Class Object

There is a central domain entity: **Order**.

Each Order must contain:

- `order_number` (unique, human-readable, e.g. 2025-031)
- `description` (client name, notes, special requirements)
- `total_tulips_quantity` (number of tulips in the order)
- `boxes_count` (how many boxes these tulips are packed into)
- optional:
  - client contact
  - pickup time
  - internal notes
  - priority

Important clarification:

👉 Tulips are the product.  
👉 Boxes are the physical transport unit.  
👉 Placement inside the trailer is done **by boxes**, not by tulips.

So:
- Order defines total tulips.
- Order defines how many boxes those tulips are packed into.
- Trailer layout defines **where those boxes are physically located**.

---

## 1.2 Relationship Between Order and Trailer Map

The trailer map does NOT directly store tulips.  
It stores **box placements**.

For each order:

- The system must know:
  - total boxes in order
  - how many boxes are already placed
  - where exactly each subset of boxes is located

Example:

Order #2025-031  
- 12,000 tulips  
- packed into 6 boxes  

Trailer placement:

- Row 8 → 2 boxes  
- Row 9 → 2 boxes  
- Row 12 → 2 boxes  

Total placed = 6 boxes  
Remaining = 0 boxes  

The system must ensure:
- You cannot place more boxes than defined in the order.
- You can split an order across multiple rows.
- You can move or adjust placements.

---

# 2) Updated Data Model

## 2.1 Entities

### `orders`
- id (uuid)
- shipment_id
- order_number (string, unique per shipment)
- description (text)
- total_tulips_quantity (integer)
- boxes_count (integer)
- created_at
- updated_at
- status

### `placements`
Represents physical location of some boxes of an order.

- id (uuid)
- shipment_id
- order_id
- row_index (integer)
- column_start (optional)
- column_end (optional)
- layer (optional)
- box_count (integer)
- status (placed | picked_up | moved | cancelled)
- created_at
- updated_at

Constraint rules:
- SUM(placements.box_count for order) ≤ orders.boxes_count
- Row capacity must not be exceeded
- Trailer total capacity must not be exceeded

---

# 3) Updated Core Logic Requirements

## 3.1 Order Lifecycle

1. Create order
2. Define tulip quantity
3. Define number of boxes
4. Place boxes onto trailer map
5. Track placement progress
6. Mark picked up (partial or full)

Derived metrics:
- Boxes placed
- Boxes remaining
- Placement completeness %
- Order ready for pickup (all boxes placed)

---

# 4) Trailer Map Behavior (Precise Definition)

The trailer schema is a **spatial container**.

It consists of:
- rows (depth dimension)
- optional columns (width dimension)
- optional layers (height dimension)

Each placement action:

1. Select order
2. Select row (or row + slot range)
3. Enter number of boxes
4. System validates:
   - remaining boxes
   - row capacity
5. Save placement
6. Update visual map

Visual representation must:
- Color-code by order
- Allow clicking a row to see breakdown
- Allow selecting an order to highlight all its placements
- Show box counts per row

---

# 5) Updated Discovery Focus

Agents must now additionally answer:

1. How are tulips packed?
   - fixed tulips per box?
   - variable box size?
2. Does box size vary per order?
3. Is row-level precision enough, or do they need left/right?
4. Is box labeling already used (stickers, order numbers)?
5. Is total tulip quantity operationally relevant during loading,
   or only box count matters at that stage?

Agents must validate whether:
- tracking tulip quantity has operational value during shipment,
- or if the system should primarily operate in box units.

---

# 6) UX Implications of Order Object

Order card in UI must show:

- Order number
- Client / description
- Tulips total
- Boxes total
- Boxes placed
- Boxes remaining
- Visual progress bar

When clicking an order:
- Highlight trailer placements
- Show placement breakdown table:
  - Row
  - Slot (if used)
  - Box count
  - Status

---

# 7) Updated Acceptance Criteria (MVP)

MVP is complete when:

1. A user can create an Order with:
   - order_number
   - description
   - tulip quantity
   - boxes_count

2. A user can place boxes from that order onto trailer rows.

3. The system prevents:
   - placing more boxes than defined in order
   - exceeding trailer capacity

4. The UI clearly shows:
   - remaining boxes per order
   - spatial location of every placed box batch

5. A user can:
   - move placement
   - edit placement box_count
   - delete placement
   - mark placement picked up

6. Data persists in backend and syncs across devices.

---

# 8) Updated Agent Task Prompt (Refined)

> You are a product + engineering research agent.  
> Build a complete discovery + solution ideation package for a web app called “Tulip Truck Load Map.”  
>  
> Important:  
> There is a central Order object containing:
> - order_number  
> - description  
> - total tulips quantity  
> - number of boxes  
>  
> Boxes are the physical units placed inside a trailer.  
> Orders can be split across multiple rows of the trailer.  
> The system must track spatial placement of boxes relative to trailer depth.  
>  
> Deliver:
> 1. Refined domain model  
> 2. UX patterns for spatial load tracking  
> 3. 3–5 solution variants with tradeoffs  
> 4. MVP recommendation  
> 5. Supabase data schema  
> 6. Implementation roadmap (Next.js + SVG + Supabase)  
> 7. Risk analysis  
>  
> Optimize for real chaotic loading day conditions.  
> Keep MVP feasible in 1–2 weeks.

---

End of file.