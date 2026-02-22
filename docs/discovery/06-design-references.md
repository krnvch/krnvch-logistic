# Design References & UX Insights

**Source**: Stakeholder-provided references + team analysis
**Date**: 2026-02-22

---

## Dribbble References (Visual Style)

### 1. XPO Logistic — TMS Truck Management Dashboard
**URL**: https://dribbble.com/shots/26643982-XPO-Logistic-TMS-Truck-Management-Dashboard

### 2. Truck Co — TMS Logistics Management Dashboard
**URL**: https://dribbble.com/shots/26619200-Truck-Co-TMS-Logistics-Management-Dashboard

### 3. Logitrack — Truck Management Dashboard
**URL**: https://dribbble.com/shots/26699490-Logitrack-Truck-Management-Dashboard

Screenshots saved in: `/Users/artem/Movies/dribble refs/`

---

### Detailed Analysis (from screenshots)

#### XPO Logistic (orange/warm accent)
**Visual style**: Light cream/beige background, warm tones, subtle depth via shadows. Very clean and professional. Orange as the accent color for interactive elements.

**Key pattern — Trailer Grid Overlay**:
- The trailer is shown as a **side-view illustration** with a **grid of labeled cells** overlaid on the cargo area
- Each cell shows: cargo ID (e.g., "CRG05") + weight (e.g., "500 kg")
- Empty cells have an orange `+` button to add cargo
- Cells are clearly separated by thin borders
- **This is the closest reference to our trailer map** — replace cargo IDs with order numbers and weights with box counts

**Layout**:
- Left sidebar: vehicle list with search, vehicle thumbnails, status badges ("On Time" in green)
- Center: truck illustration with grid overlay + summary stats (Weight, Speed, Fuel, Trips) at top
- Bottom: Operation Details section + Cargo Lists table + map
- For us: left sidebar = order list, center = trailer grid, top = summary stats

#### Truck&Co (purple accent)
**Visual style**: White/light background, purple and green accents, clean typography. More corporate feel.

**Key pattern — Load Planning Panel**:
- Right-side panel titled "Load Planning" with actions: "Remove Assignment", "+ Create New Plan", "Clear Plan"
- Item list table: Item number, Vehicle, Sequence, Status ("Planning"), Action icons (edit, view)
- **This maps to our order management sidebar** — order list with status and actions

**Layout**:
- Top nav: Transportations, Freight Units, Trucks, Load Planning, Load Distribution
- Center: truck illustration with compartment sections visible
- Summary stats: Weight (7,340kg +33%), Pallets (120 +15%), Alerts (62 -22%) — with delta badges
- Bottom: Gantt chart for timeline scheduling, shipment number tabs
- For us: summary stats approach (total orders, placed boxes, remaining) is very relevant

---

### What to Take for Tulip Load Map

**From XPO**:
- The **trailer grid with labeled cells** pattern — this IS our matrix. Each cell = a wall, showing order numbers and box counts
- Warm, light color palette — professional, easy on the eyes
- The `+` button on empty cells for adding placements
- Summary stats bar at the top
- Left sidebar for the list (orders for us)

**From Truck&Co**:
- "Load Planning" panel concept — our order management sidebar
- Summary stats with **status badges** (green/red deltas)
- "Create New Plan" / "Clear Plan" actions — maps to our shipment create/reset
- Clean table layout for item management

**From Both**:
- Professional logistics aesthetic — not a toy, not over-designed
- Information density is high but well-organized — labels are concise
- Light backgrounds for readability
- Card elevation / subtle shadows for depth

### What NOT to Take

- Complex multi-page navigation (we have ONE screen)
- Truck illustration (nice but unnecessary visual weight for our simple case)
- Maps, route tracking, speed, fuel — irrelevant
- Gantt charts, timeline scheduling — not our problem
- Heavy data tables — our data is visual (the grid), not tabular
- Multiple vehicle/shipment tabs — we have one trailer

---

## Production App Reference

### Goodloading
**URL**: https://www.goodloading.com/

**What it does**: Browser-based cargo loading optimization platform. Plans how to arrange cargo inside trailers/containers to maximize space utilization.

**Key features**:
- 3D visualization of cargo space AND the loading process
- Animated loading sequences (step-by-step: "put this box here, then this one here")
- Multi-constraint optimization: weight, dimensions, axle pressure, center of gravity
- Sharable plans via links and PDF
- Multi-stop route planning with per-stop cargo separation
- No installation — fully web-based

**What to learn from Goodloading**:
- Web-first approach works (no app store friction) — we're doing this too
- Sharable loading plan (link-based) — our real-time approach is even better
- The concept of an animated loading sequence is interesting but overkill for our MVP
- They solve a DIFFERENT problem: optimizing space for mixed cargo. Our problem is simpler — uniform boxes, just tracking which orders are where.

**What NOT to take from Goodloading**:
- 3D visualization — overkill. Our trailer is uniform boxes, always 6x4 per wall. A 2D top-down grid is sufficient and SIMPLER.
- Weight/axle optimization — irrelevant (all boxes are the same)
- Multi-container/vehicle support — we have one trailer
- Complex cargo shapes — all our boxes are identical

---

## Design Principles Derived from References + Interview

### 1. Simplicity Above All
- Non-tech-savvy users (warehouse workers with iPhones)
- One screen, two panels: map + orders. That's it.
- No deep navigation, no settings pages, no multi-level menus
- If it needs explanation, it's too complex

### 2. The Map is the Product
- Trailer grid is the centerpiece — always visible, always current
- Everything else serves the map
- Booking-style mental model (airplane seats / cinema seats)

### 3. Two Modes, One Screen
- **Loading mode**: Building the map. Deliberate, sequential. One user.
- **Market mode**: Using the map. Fast, reactive, search-driven. Multi-user.
- Same screen layout — the behavior changes, not the interface.

### 4. Touch-First
- iPad is primary — large touch targets
- iPhone is secondary — responsive, same interactions
- No hover states needed — everything is tap/click

### 5. Information Density: Just Enough
- On the map: order number + box count per wall. That's it.
- In the sidebar: order number, client, boxes, time, status.
- Details on tap (popover) — not cluttering the main view.

---

## Interaction Patterns (from Interview)

### Placement Flow (confirmed)
Hybrid approach — like Google Calendar event creation:
1. Create order → it appears in sidebar + auto-suggests placement
2. OR: tap a wall → popover opens → select order, enter box count
3. Both paths lead to the same result: order placed on wall

### Search & Find (confirmed)
1. Search field always visible at top
2. Type order number → press Enter
3. Matching walls **blink/flash** on the map
4. Eye is drawn to the location instantly

### Mark as Done (confirmed)
Two paths (both available):
1. Tap wall on map → popover with order summary → "Mark as Done" button
2. Tap order in sidebar → "Mark as Done" button
Both update the map and sidebar in real-time.

### Edit / Move (confirmed)
- Move action preferred over delete-and-redo
- Tap placement on map → popover → "Move" option
- Select new wall → boxes move there
- No cascading re-entry needed

---

## Visual Style Direction

Based on Dribbble refs + stakeholder preference + shadcn/ui constraints:

- **Light mode primary** — warm, light background (like XPO's cream tones). Outdoor/warehouse readability.
- **Clean, minimal** — shadcn/ui new-york style is a perfect fit
- **Warm neutral palette** inspired by XPO, mapped to shadcn/ui tokens:
  - Empty wall: `muted` background with dashed border or `+` icon
  - Occupied wall: `card` background with order labels and box counts
  - Done orders: dimmed / `muted-foreground`, subtle strikethrough or opacity reduction
  - Search highlight: brief `primary` pulse/blink animation (2-3 flashes)
  - Active/selected wall: `primary` border or ring
- **No per-order color coding** — just text labels (order numbers)
- **Card-based sidebar** for order list (like Truck&Co's Load Planning panel)
- **Grid-based main area** for trailer map (like XPO's trailer cell grid)
- **Summary stats bar** at top: Total Orders, Boxes Placed, Boxes Remaining (like both refs)
- **Subtle shadows and elevation** for depth — not flat, not heavy

## Stakeholder Context

The stakeholder is a **product designer** exploring the full development lifecycle through AI-assisted development. He wants:
- A **quality, production-ready working app** for real use
- To learn frontend, backend, integrations, deployment through the process
- No shortcuts on quality — the result should be professional and usable
- The Dribbble references reflect his taste: clean, professional, modern logistics UI
