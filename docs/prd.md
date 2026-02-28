# Product Requirements Document — krnvchLogistic (Load Map)

**Version**: 1.1
**Date**: 2026-02-22
**Status**: Approved (architect review applied)
**Based on**: Discovery docs `00`–`06` in `docs/discovery/`

**Companion documents**:
- [`docs/architecture.md`](architecture.md) — system architecture, schema, data flow, design tokens, architecture decisions
- [`docs/implementation-plan.md`](implementation-plan.md) — phased build plan with tasks, acceptance tests, dependency graph

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Personas](#2-user-personas)
3. [Information Architecture](#3-information-architecture)
4. [Functional Requirements & Acceptance Criteria](#4-functional-requirements--acceptance-criteria)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [UI Component Spec](#6-ui-component-spec)
7. [Out of Scope (MVP)](#7-out-of-scope-mvp--with-extensibility-notes)
8. [Open Questions](#8-open-questions)

---

## 1. Overview

### Problem

A small logistics operation delivers ~30-40 wholesale orders (~720 boxes) in one Euro reefer trailer to a wholesale market. Today the team uses a hand-drawn paper matrix to track which orders are in which part of the trailer. During unloading, 3-4 workers fight over one paper sheet. Copies go stale because annotations (cross-outs on pickup) happen in real-time.

### Solution

A single-screen web app — a shared, real-time digital trailer map. The operator builds the map during loading (one device). At the market, 3-4 workers view the same map on their own devices, search for orders, and mark them as handed out. All changes sync instantly.

### Success Criteria

| Metric | Target |
|--------|--------|
| All orders placed on map | Within 30 min |
| Worker finds any order | < 5 seconds (search + highlight) |
| Concurrent users at market | 4-5 simultaneously |
| Wrong-order errors | Zero |
| Would use again next year | Yes |

---

## 2. User Personas

### Operator (1 person)

- **Who**: Farm owner (Artem). Tech-comfortable. Uses iPad.
- **When**: Day before delivery (loading) + order setup during February.
- **Does**: Creates orders, builds the trailer map, adjusts placements.
- **Needs**: Fast data entry, full map overview, edit/move/delete placements.

### Worker (3-4 people)

- **Who**: Farm workers. Varying tech comfort. Use iPhones or iPads.
- **When**: Delivery day at the market (unloading).
- **Does**: Finds orders by number, locates walls, marks orders as done.
- **Needs**: Search, highlight, one-tap "mark as done", real-time sync.

---

## 3. Information Architecture

One screen. Two panels. No navigation.

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: Search bar + Summary stats + App title              │
├────────────────────────────────┬─────────────────────────────┤
│                                │                             │
│        TRAILER MAP             │       ORDER SIDEBAR         │
│     (scrollable grid           │    (scrollable list         │
│      of ~30 walls)             │     of all orders)          │
│                                │                             │
└────────────────────────────────┴─────────────────────────────┘
```

**iPad (landscape)**: Map ~60% width, sidebar ~40% width. Both visible.
**iPhone (portrait)**: Map full width on top, sidebar as bottom sheet or tab toggle.

---

## 4. Functional Requirements & Acceptance Criteria

---

### FR-01: Shipment Management

A shipment is a single loading event — one trailer, one day. Only one shipment is active at a time.

#### FR-01.1: Create Shipment

**Given** no active shipment exists
**When** the operator opens the app
**Then** the app prompts to create a new shipment with optional name (e.g., "March 2026"), trailer wall count (default 30), and boxes per wall (default 24)

**Given** the operator submits the create form
**When** wall count > 0 AND boxes_per_wall > 0
**Then** the shipment is created with status `active`, the trailer map renders an empty grid with the specified number of walls, and the order sidebar is empty

#### FR-01.2: Reset / Clear Shipment

**Given** an active shipment exists with orders and placements
**When** the operator taps "Clear / Reset"
**Then** a confirmation dialog appears: "This will delete all orders and placements. Are you sure?"

**Given** the operator confirms the reset
**When** the action completes
**Then** all orders and placements for this shipment are deleted, the trailer map is empty, the sidebar is empty, and the shipment remains active

---

### FR-02: Order Management

#### FR-02.1: Create Order

**Given** an active shipment exists
**When** the operator taps "Add Order" in the sidebar
**Then** a form appears with fields: order number (required), client name (required), description (optional), item count (optional), box count (required, integer > 0), pickup time (optional, text e.g. "08:00-09:00")

**Given** the operator fills in the form with valid data
**When** the order number is unique within this shipment
**Then** the order is created with status `pending`, appears in the sidebar list sorted by pickup time (orders without pickup time go to the end), and a toast confirms "Order #N created"

**Given** the operator enters an order number that already exists in this shipment
**When** they submit the form
**Then** validation error: "Order #N already exists"

#### FR-02.2: Edit Order

**Given** an order exists
**When** the operator taps the edit action on the order card in the sidebar
**Then** the edit form opens pre-filled with current values

**Given** the operator changes box_count to a value lower than already-placed boxes
**When** they submit
**Then** validation error: "Cannot reduce to N boxes — M boxes already placed"

**Given** the operator changes the order number to one that already exists
**When** they submit
**Then** validation error: "Order #N already exists"

#### FR-02.3: Delete Order

**Given** an order exists with placements on the map
**When** the operator taps "Delete" on the order
**Then** a confirmation dialog appears: "Delete order #N? This will remove N placements from the map."

**Given** the operator confirms deletion
**When** the action completes
**Then** the order and all its placements are deleted, affected walls update their display, sidebar updates, and summary stats update

#### FR-02.4: Order List Display

**Given** orders exist in the active shipment
**When** the sidebar renders
**Then** orders are displayed as cards sorted by pickup time (earliest first, no-time at end), each card showing: order number (prominent), client name, box count with placement progress (e.g., "18 / 24 placed"), pickup time, and status badge

#### FR-02.5: Order Status (computed, not stored)

Order status is **derived at render time**, not stored in the database. Only `is_done` (boolean) is persisted. See `architecture.md` AD-01 for rationale.

**Given** an order has `is_done = false` and 0 boxes placed (SUM of placements = 0)
**Then** its display status is `pending`

**Given** an order has `is_done = false` and all boxes placed (SUM of placements = box_count)
**Then** its display status is `loaded`

**Given** an order has `is_done = true`
**Then** its display status is `done`, regardless of placement count

**Given** an order's display status is `done`
**Then** its card in the sidebar is visually dimmed (reduced opacity, muted colors), and its placements on the map are visually dimmed

---

### FR-03: Trailer Map — Display

#### FR-03.1: Grid Rendering

**Given** an active shipment with N walls
**When** the map renders
**Then** it displays N wall cells in a vertical list, numbered 1 (top, deepest) to N (bottom, closest to doors), with a "DOORS" label at the bottom

#### FR-03.2: Empty Wall

**Given** a wall has no placements
**When** the map renders that wall
**Then** the wall cell shows a dashed border with muted background, the wall number, and capacity label "0 / 24"

#### FR-03.3: Occupied Wall

**Given** a wall has one or more placements
**When** the map renders that wall
**Then** the wall cell shows a solid card-style background, the wall number, and for each placement: order number + box count (e.g., "#23: 12  #45: 8  #7: 4"), plus total box count (e.g., "24 / 24")

#### FR-03.4: Full Wall

**Given** a wall has total box count = boxes_per_wall (24)
**When** the map renders
**Then** the wall shows a subtle visual indicator that it's full (e.g., filled progress bar or solid background accent)

#### FR-03.5: Wall with Done Orders

**Given** a wall contains placements for orders marked as `done`
**When** the map renders
**Then** those placement labels are visually dimmed (reduced opacity or strikethrough), while non-done placements remain normal

---

### FR-04: Trailer Map — Placement

#### FR-04.1: Place Boxes (from map)

**Given** an active shipment with unplaced orders
**When** the operator taps an empty or partially filled wall on the map
**Then** a popover opens showing: wall number, current contents (if any), remaining capacity, and a form to add a placement — select order (dropdown of orders with remaining unplaced boxes), enter box count

**Given** the operator selects order #23 (which has 10 boxes remaining) and enters box count 8
**When** wall has 16 boxes remaining capacity AND 8 ≤ 10 (order remaining)
**Then** placement is saved, wall updates to show "#23: 8", order card in sidebar updates progress to reflect 8 more boxes placed, popover closes, and a toast confirms the action

#### FR-04.2: Place Boxes (from sidebar)

**Given** an order with unplaced boxes
**When** the operator taps "Place" on the order card in the sidebar
**Then** the order is highlighted/selected, and the map enters placement mode — tapping a wall opens the placement popover with this order pre-selected

#### FR-04.3: Validation — Exceeds Order

**Given** order #23 has 4 boxes remaining unplaced
**When** the operator tries to place 6 boxes
**Then** validation error: "Order #23 only has 4 boxes remaining"

#### FR-04.4: Validation — Exceeds Wall Capacity

**Given** wall 5 has 20 boxes already
**When** the operator tries to place 6 more boxes
**Then** validation error: "Wall 5 only has 4 slots remaining"

#### FR-04.5: Edit Placement

**Given** a placement exists (order #23, wall 5, 12 boxes)
**When** the operator taps that placement label on the wall
**Then** a popover opens showing placement details with option to change box count

**Given** the operator changes box count from 12 to 8
**When** the new count is valid (≤ wall remaining + current count, ≤ order remaining + current count)
**Then** placement is updated, wall and order sidebar reflect the change

#### FR-04.6: Delete Placement

**Given** a placement exists
**When** the operator taps "Remove" in the placement popover
**Then** the placement is deleted, wall updates (may become empty), order's placed count decreases, order status may revert from `loaded` to `pending`

#### FR-04.7: Move Placement

**Given** a placement exists (order #23, wall 5, 12 boxes)
**When** the operator taps "Move" in the placement popover
**Then** the app enters move mode — the current wall is highlighted as source, the operator taps a target wall

**Given** the operator taps wall 8 as the target
**When** wall 8 has enough remaining capacity for the 12 boxes
**Then** the placement is moved from wall 5 to wall 8, both walls update, and a toast confirms "Moved #23 (12 boxes) from wall 5 → wall 8"

**Given** the target wall doesn't have enough capacity
**Then** an error is shown: "Wall 8 only has N slots remaining"

---

### FR-05: Search & Highlight

#### FR-05.1: Search Field

**Given** the app is loaded
**When** the user looks at the header
**Then** a search input is always visible with placeholder "Search order..."

#### FR-05.2: Search by Order Number

**Given** orders exist on the map
**When** the user types "23" in the search field and presses Enter (or after a short debounce)
**Then** all walls containing placements for order #23 receive a blink/pulse animation (2-3 cycles of a highlight color), and the order card in the sidebar is also highlighted

**Given** no placements match the search
**When** the search executes
**Then** no walls blink, and a subtle message appears: "No placements found for '23'"

#### FR-05.3: Search by Client Name

**Given** orders exist
**When** the user types "petrov" in the search field
**Then** the system matches against client_name (case-insensitive), and highlights walls + sidebar cards for all matching orders

#### FR-05.4: Highlight from Sidebar

**Given** an order has placements on the map
**When** the user taps an order card in the sidebar
**Then** the walls containing that order's placements receive the same blink/pulse animation, and the map scrolls to make the first matched wall visible

#### FR-05.5: Clear Search

**Given** a search is active
**When** the user clears the search field (or taps the X button)
**Then** all highlights are removed, the map and sidebar return to normal state

---

### FR-06: Order Handout (Mark as Done)

#### FR-06.1: Mark Done from Sidebar

**Given** an order with status `loaded` or `pending`
**When** a worker taps "Mark as Done" on the order card
**Then** a confirmation dialog appears: "Mark order #N as done?"

**Given** the worker confirms the dialog
**When** the action completes
**Then** the order's `is_done` is set to `true` (with `done_at` timestamp), the card is visually dimmed in the sidebar, placements on the map are visually dimmed, and the change syncs to all connected devices

#### FR-06.2: Mark Done from Map

**Given** a wall contains a placement for an order
**When** the user taps the wall → popover opens → user taps "Mark as Done" on one of the listed orders
**Then** same behavior as FR-06.1 (confirmation dialog → then update)

#### FR-06.3: Undo Done

**Given** an order with `is_done = true`
**When** the user taps "Undo" or "Mark as Not Done" on the order
**Then** the order's `is_done` is set to `false` (with `done_at` cleared), display status reverts to its computed state (`loaded` if all boxes placed, `pending` otherwise), visual dimming is removed, and change syncs to all devices

---

### FR-07: Real-Time Sync

#### FR-07.1: Placement Sync

**Given** two devices have the app open on the same shipment
**When** Device A creates/edits/deletes a placement
**Then** Device B sees the change within 1 second without refreshing

#### FR-07.2: Order Status Sync

**Given** two devices have the app open
**When** Device A marks order #23 as done
**Then** Device B sees order #23 dimmed in sidebar and on the map within 1 second

#### FR-07.3: Order CRUD Sync

**Given** two devices have the app open
**When** Device A creates/edits/deletes an order
**Then** Device B's sidebar and map update within 1 second

#### FR-07.4: Conflict Handling

**Given** Device A and Device B both try to edit the same placement simultaneously
**When** both writes reach the server
**Then** last-write-wins — the most recent change is applied and synced to both devices. No data corruption occurs. (Acceptable for MVP — conflicts are rare with 1 operator + read-mostly workers.)

---

### FR-08: Responsive Layout

#### FR-08.1: iPad Landscape

**Given** the app is opened on an iPad in landscape orientation
**When** the screen renders
**Then** the layout shows the trailer map on the left (~60%) and order sidebar on the right (~40%), both fully visible without toggling

#### FR-08.2: iPhone Portrait

**Given** the app is opened on an iPhone in portrait orientation
**When** the screen renders
**Then** the trailer map occupies the full width, and the order sidebar is accessible via a bottom sheet or tab toggle. The search bar remains always visible in the header.

#### FR-08.3: Touch Targets

**Given** any interactive element (button, wall cell, order card)
**When** rendered on any device
**Then** the minimum tap target size is 44x44px (Apple HIG recommendation)

---

## 5. Non-Functional Requirements

| ID | Requirement | Target | How to Verify |
|----|------------|--------|---------------|
| NFR-01 | Page load (cold) | < 2s on 4G | Lighthouse audit |
| NFR-02 | Placement save latency | < 500ms (perceived) | Optimistic UI update |
| NFR-03 | Real-time sync latency | < 1s | Supabase Realtime test with 2 devices |
| NFR-04 | Concurrent users | 5 simultaneous | Manual test with 5 browser tabs/devices |
| NFR-05 | Data persistence | Supabase PostgreSQL | Data survives page refresh |
| NFR-06 | Auth | Single shared email/password account | Supabase Auth, no roles |
| NFR-07 | Browser support | Safari iOS 16+, Chrome latest | Manual cross-browser test |
| NFR-08 | Zero onboarding | Usable on first open | Stakeholder usability test |
| NFR-09 | Accessibility | Color not sole indicator, min contrast 4.5:1 | Visual check, axe-core basics |

---

## 6. UI Component Spec

### Technology

- **shadcn/ui** (new-york style, neutral base color, CSS variables)
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **Lucide React** icons
- **Sonner** toasts for confirmations and errors

### Component Map

#### Header
- **Search**: shadcn `Input` with `Search` icon (Lucide). Always visible. Full width on mobile, constrained on desktop.
- **Summary Stats**: 3 inline badges/pills — "N Orders", "N / M Boxes Placed", "N Done". Use shadcn `Badge` variant.
- **App Title**: "krnvchLogistic" — text, right-aligned or centered.

#### Trailer Map (custom component)
- **Wall Cell**: Custom component. Not a shadcn primitive — a styled `div` with:
  - Wall number label (left edge)
  - Placement chips inside (order number + box count)
  - Capacity indicator (e.g., "18/24")
  - States: empty (dashed border, `muted` bg), occupied (`card` bg, shadow), full (accent indicator), has-done (dimmed placements)
  - On tap: opens shadcn `Popover` with placement details / actions
- **Doors Label**: Static text at bottom of the grid: "DOORS"
- **Scroll**: The map is vertically scrollable if it exceeds viewport height.
- **Blink Animation**: CSS `@keyframes` pulse on `primary` color, 2-3 cycles, ~300ms per cycle. Applied via a `data-highlight` attribute toggled by search.

#### Order Sidebar
- **Order Card**: shadcn `Card` with:
  - Order number (large, bold)
  - Client name (secondary text)
  - Box progress: "12 / 24 placed" with mini progress bar
  - Pickup time badge
  - Status badge: `pending` (default), `loaded` (green), `done` (muted/dimmed)
  - Actions: "Place" button (when pending), "Mark as Done" button (when loaded), "Edit" / "Delete" icons
- **Add Order Button**: shadcn `Button` at top of sidebar. Opens shadcn `Sheet` (bottom on mobile) or `Dialog` with the order form.
- **Order Form**: shadcn `Dialog` or `Sheet` with `Input`, `Textarea`, `Button` components. Fields: order number, client name, description, item count, box count, pickup time.

#### Placement Popover
- shadcn `Popover` anchored to the tapped wall cell.
- Content: wall number, current placements list, remaining capacity.
- Actions: Add placement (order dropdown + box count input + save button), Edit (change count), Remove, Move, Mark as Done (per order).
- Order select: shadcn `Select` filtered to orders with remaining unplaced boxes.

#### Confirmation Dialogs
- shadcn `AlertDialog` for destructive actions (delete order, reset shipment).

#### Toasts
- Sonner toasts for: placement saved, order created/edited/deleted, order marked as done, errors.

### Visual Tokens (mapped to shadcn/ui CSS variables)

| Element | Token | Notes |
|---------|-------|-------|
| Page background | `--background` | Light warm neutral |
| Empty wall | `--muted` bg + dashed border | Inviting "add here" feel |
| Occupied wall | `--card` bg + `--border` + shadow | Solid, present |
| Full wall | `--card` bg + subtle accent bar | Indicates no room left |
| Done placement | `--muted-foreground` + 50% opacity | Clearly "finished" |
| Search highlight | `--primary` pulse animation | Eye-catching, temporary |
| Selected wall | `--ring` border | Active selection |
| Status: pending | default (no badge color) | Neutral |
| Status: loaded | `--primary` or green | Positive, ready |
| Status: done | `--muted-foreground` | De-emphasized |

---

> **Technical Architecture** and **Implementation Plan** are in separate documents:
> - [`docs/architecture.md`](architecture.md) — schema, data flow, types, tokens, architecture decisions, tech debt register
> - [`docs/implementation-plan.md`](implementation-plan.md) — 6 phases with tasks, acceptance tests, dependency graph, risk register

---

## 7. Out of Scope (MVP) — with Extensibility Notes

Explicitly excluded from this version. However, the architecture must be designed with a **scalable, extensible foundation** so that none of these items become blocked by technical debt. Each item includes what the MVP foundation must support.

| Feature | MVP Status | Foundation Requirements |
|---------|-----------|------------------------|
| Per-user auth / roles / permissions | Out | Supabase Auth is already role-capable. DB uses `auth.role()` in RLS. Adding per-user policies later = new RLS rules, no schema change. |
| Partial pickups | Out | `placements` table tracks per-wall box counts. Adding a `picked_count` column later is additive. Order status can be extended. |
| Year-to-year history / analytics | Out | Shipment entity already scopes all data. Adding `completed_at`, archiving logic, and a shipment list view is additive. No data loss. |
| Import from WhatsApp / Telegram / spreadsheets | Out | Order creation goes through a clean service layer (hook + Supabase insert). A bulk import function can call the same path. No special coupling. |
| Individual box tracking within a wall | Out | `placements` table can be extended with `column` / `layer` fields (nullable). Map component can render sub-grid. Wall-level view remains the default. |
| Per-order color coding | Out | Order entity can get a `color` field. Wall cell component already renders per-order labels — adding a color dot/bar is a UI-only change. |
| Offline mode / service worker | Out | TanStack Query already caches data locally. Adding `persistQueryClient` + service worker for offline reads is incremental. Writes need conflict queue. |
| Box label generation / printing | Out | Order + box_count data is already available. A print view / PDF export is a standalone feature with no schema dependency. |
| Payment / invoicing at pickup | Out | Order entity can be extended with payment fields. "Mark as Done" flow can be extended with a payment step. |
| Multiple trailers / shipments | Out | `shipment_id` already scopes everything. Removing the "one active shipment" constraint is a UI/query filter change, not a schema change. |
| Drag-and-drop placement | Out | Placement CRUD is abstracted in hooks. Adding a DnD library (dnd-kit) would call the same mutation hooks. No API change. |
| Desktop features (hover, keyboard) | Out | Touch-first approach doesn't prevent adding hover states or keyboard shortcuts later. CSS `:hover` and `onKeyDown` handlers are additive. |
| Internationalization (i18n) | Out | All user-facing strings should be kept in component JSX (not spread across utilities). Extracting to an i18n library later is mechanical. Avoid hardcoding strings in business logic. |

**Architecture principle**: Every entity has a UUID primary key, every table is scoped by `shipment_id`, every mutation goes through a typed hook. This ensures any future feature can be added incrementally without rewriting the foundation.

---

## 8. Open Questions

| # | Question | Impact | Proposed Default |
|---|----------|--------|-----------------|
| 1 | Should "Mark as Done" require confirmation? | Prevents accidental taps, but adds friction | **RESOLVED: Yes** — confirmation dialog required. "Mark order #N as done?" with Confirm/Cancel. |
| 2 | Should the map show wall numbers on the physical trailer (1 = deepest) or by unloading order (1 = first out, near doors)? | Mental model alignment | 1 = deepest (top of screen). "Wall 30 (doors)" at bottom. Matches the vision doc. |
| 3 | What happens if a user changes `trailer_walls` or `boxes_per_wall` after placements exist? | Data integrity | Disallow changes while placements exist — must reset first |
| 4 | Login screen styling — minimal or branded? | First impression | **RESOLVED: Branded** — designer-quality login screen. Centered card with branding (app name, package icon, warm color accent), email + password fields, professional feel matching the Dribbble references. First impression matters. |

---

*This document defines WHAT to build. See [`architecture.md`](architecture.md) for HOW it's built and [`implementation-plan.md`](implementation-plan.md) for the build sequence.*
