# Implementation Plan — krnvchLogistic (Load Map)

**Version**: 1.0
**Date**: 2026-02-22
**Owner**: Principal Full-Stack Architect + Project Manager
**Status**: Approved (architect review applied)
**Depends on**: `docs/prd.md` (requirements), `docs/architecture.md` (technical blueprint)

---

## Phase Overview

| Phase | Name | Goal | Key Risk |
|-------|------|------|----------|
| 1 | Foundation | DB, types, auth, layout shell, Realtime infra | Supabase setup correctness |
| 2 | Order Management | Full order CRUD in sidebar | Form validation edge cases |
| 3 | Trailer Map & Placements | Visual map with placement interactions | Aggregate validation, popover UX |
| 4 | Search & Highlight | Fast order lookup with blink animation | Animation performance on mobile |
| 5 | Mark as Done | Unloading workflow (done/undo) | Multi-device sync under pressure |
| 6 | Polish & Production | Responsive, error handling, empty states, final UX | Cross-device testing coverage |

---

## Phase 1: Foundation

**Goal**: Skeleton app with database, generated types, auth, Realtime wiring, and empty layout shell.

### Tasks

- [ ] **1.1** Create Supabase project and configure environment
  - Create project on Supabase dashboard
  - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`
  - Verify connection from app

- [ ] **1.2** Run database migration (schema from `architecture.md` Section 2)
  - Create tables: `shipments`, `orders`, `placements`
  - Create `update_updated_at()` trigger function
  - Create triggers on `orders` and `placements`
  - Create all indexes
  - Enable RLS and create policies

- [ ] **1.3** Generate TypeScript types from Supabase schema
  - `supabase gen types typescript --project-id <id> > src/types/database.ts`
  - Type the Supabase client: `createClient<Database>(...)`
  - Create app-level type aliases and helpers in `src/types/index.ts`
  - Create `src/lib/query-keys.ts`

- [ ] **1.4** Auth flow
  - `use-auth.ts` hook: session check, login, logout
  - `login-form.tsx`: branded login screen (designer-quality, warm accent, app branding)
  - Auth gate in `App.tsx`: no session → login, session → main app
  - Install needed shadcn/ui components: `input`, `label`, `dialog`, `alert-dialog`, `popover`, `select`, `sheet`, `badge`, `separator`, `progress`, `scroll-area`

- [ ] **1.5** Realtime infrastructure
  - `use-realtime.ts` hook: subscribe to `orders` + `placements` changes filtered by shipment_id
  - On event: invalidate relevant TanStack Query cache keys
  - Cleanup on unmount (remove channel)
  - This hook is called once at the app layout level — all child components benefit automatically

- [ ] **1.6** Main layout shell
  - `app-layout.tsx`: header + map area (empty placeholder) + sidebar area (empty placeholder)
  - `summary-bar.tsx`: static placeholder stats ("0 Orders", "0 / 0 Boxes Placed")
  - `search-input.tsx`: search input (non-functional — wired in Phase 4)
  - Responsive: two-panel on iPad, stacked on iPhone

- [ ] **1.7** Shipment setup
  - `use-shipment.ts` hook: query active shipment, create mutation
  - `shipment-setup.tsx`: create new shipment form (name, wall count, boxes per wall)
  - On app load: if active shipment exists → load it. If not → show setup screen.

- [ ] **1.8** Add `--success` design token to `src/index.css`
  - Light and dark mode values
  - Register in `@theme inline` block

### Deliverable
User can log in, see the branded login screen, create a shipment, and see the empty two-panel layout. Realtime subscription is active in the background. All types are generated and typed.

### Acceptance Test
- [ ] Login with email/password works
- [ ] Creating a shipment shows empty layout
- [ ] Opening a second browser tab shows the same shipment (Realtime channel connects)
- [ ] TypeScript compiles with zero errors (`pnpm build`)

---

## Phase 2: Order Management

**Goal**: Full order CRUD in the sidebar. Operator can create, edit, delete, and view orders.

### Tasks

- [ ] **2.1** `use-orders.ts` hook
  - Query: fetch all orders for active shipment, sorted by pickup_time
  - Mutations: create, update, delete (all with optimistic updates)
  - Include placed_boxes computation (SUM from placements query)

- [ ] **2.2** Order form component
  - `order-form.tsx`: shadcn `Dialog` (desktop) / `Sheet` (mobile)
  - Fields: order number (required), client name (required), description, item count, box count (required), pickup time
  - Validation: order number unique, box count > 0, box count ≥ already-placed (on edit)
  - Used for both create and edit (pre-filled on edit)

- [ ] **2.3** Order card component
  - `order-card.tsx`: shadcn `Card` with:
    - Order number (large, bold)
    - Client name
    - Box progress bar ("12 / 24 placed") — reads from placements data
    - Pickup time badge
    - Status badge (computed: pending / loaded / done)
    - Action buttons: Edit, Delete (Place button — wired in Phase 3, Mark Done — wired in Phase 5)

- [ ] **2.4** Order sidebar
  - `order-sidebar.tsx`: scrollable list of order cards
  - "Add Order" button at top
  - Sort by pickup_time (nulls last)
  - Empty state: "No orders yet. Add your first order."

- [ ] **2.5** Delete order
  - Confirmation dialog: "Delete order #N? This will remove N placements from the map."
  - Cascade delete handled by DB (ON DELETE CASCADE on placements)

- [ ] **2.6** Summary stats (live)
  - `summary-bar.tsx`: computed from orders data
  - "N Orders" | "N / M Boxes" | "N Done"
  - Updates reactively when data changes

### Deliverable
Operator can create, edit, delete, and view orders in the sidebar. Stats update live. Realtime sync works across tabs.

### Acceptance Test
- [ ] Create order → appears in sidebar sorted by pickup time
- [ ] Edit order → changes reflected immediately
- [ ] Delete order with confirmation → removed from sidebar
- [ ] Duplicate order number → validation error
- [ ] Open second tab → order CRUD syncs in real-time
- [ ] Summary stats update on every change

---

## Phase 3: Trailer Map & Placements

**Goal**: The core product — visual trailer map with validated placement interactions.

### Tasks

- [ ] **3.1** `use-placements.ts` hook
  - Query: fetch all placements for active shipment
  - Mutations: create, update, delete, move (all with optimistic updates)
  - Expose `wallData` computed array: for each wall number (1..N), aggregate placements with order info

- [ ] **3.2** `use-wall-data.ts` hook
  - Combines orders + placements into `WallData[]` array
  - Each wall: wall_number, placements (with order details), total_boxes, remaining_capacity, is_full
  - Memoized computation — only recalculates when orders or placements change

- [ ] **3.3** Trailer map grid
  - `trailer-map.tsx`: vertically scrollable container
  - Renders wall cells 1 (top, deepest) → N (bottom, doors)
  - "DOORS" label at bottom
  - Walls numbered on left edge

- [ ] **3.4** Wall cell component
  - `wall-cell.tsx`: renders based on state:
    - **Empty**: dashed border, muted bg, "0 / 24", tappable
    - **Occupied**: solid card bg, placement chips (order# + count), total, tappable
    - **Full**: accent indicator (success border or filled bar)
    - **Has done orders**: done placements dimmed
  - On tap → opens wall popover

- [ ] **3.5** Wall popover (add placement)
  - `wall-popover.tsx`: shadcn `Popover` anchored to wall
  - Shows: wall number, current placements, remaining capacity
  - Add form: order select (filtered to orders with remaining boxes) + box count input + save
  - Validation: box count ≤ order remaining, box count ≤ wall remaining

- [ ] **3.6** Wall popover (edit/delete placement)
  - Tap existing placement chip in popover → edit box count or remove
  - Remove: immediate delete, wall updates

- [ ] **3.7** Move placement
  - "Move" action in popover → enters move mode
  - Source wall highlighted, operator taps target wall
  - Validation: target wall has enough capacity
  - Execute: delete from source, create on target (transaction-like)
  - Toast: "Moved #23 (12 boxes) wall 5 → wall 8"

- [ ] **3.8** Place from sidebar
  - "Place" button on order card → order selected, map enters placement mode
  - Tap wall → popover opens with order pre-selected
  - ESC or tap elsewhere → exit placement mode

- [ ] **3.9** Order status auto-computation
  - When all boxes placed (SUM = box_count) → order card shows "loaded" status
  - When placement deleted → order may revert to "pending"
  - No DB writes for status — purely client-side computation

- [ ] **3.10** Summary stats update
  - "Boxes Placed" stat reflects total placed across all orders

### Deliverable
Operator can build the full trailer map. Walls render correctly. Placements are validated. Move works. Status auto-computes.

### Acceptance Test
- [ ] Tap empty wall → popover → add placement → wall shows order + count
- [ ] Wall capacity enforced (cannot exceed 24)
- [ ] Order box count enforced (cannot exceed remaining)
- [ ] One wall, multiple orders → both shown
- [ ] One order, multiple walls → progress bar reflects total
- [ ] Edit placement count → wall + sidebar update
- [ ] Delete placement → wall may become empty, order reverts to pending
- [ ] Move placement → source empties, target fills, toast confirms
- [ ] Place from sidebar → order pre-selected in popover
- [ ] All placements sync across tabs via Realtime

---

## Phase 4: Search & Highlight

**Goal**: Fast order lookup — the key speed enhancement over paper.

### Tasks

- [ ] **4.1** `use-search.ts` hook
  - State: search query string, matched order IDs, highlighted wall numbers
  - Logic: match against order_number (partial) and client_name (case-insensitive partial)
  - Debounce: 300ms after typing stops (or immediate on Enter)
  - Clear: reset all highlights

- [ ] **4.2** Search input (wire up)
  - `search-input.tsx`: connect to `use-search` hook
  - Show clear (X) button when query is non-empty
  - Show "No results" message when query matches nothing

- [ ] **4.3** Wall blink animation
  - Apply `wall-highlight` CSS class to matched walls
  - 3 pulse cycles, 400ms each
  - Auto-remove class after animation ends (use `onAnimationEnd`)
  - Scroll first matched wall into view

- [ ] **4.4** Sidebar card highlight
  - Matched order cards get a temporary visual accent (ring or bg change)
  - Scrolls matched card into view in sidebar

- [ ] **4.5** Highlight from sidebar tap
  - Tap order card → triggers same highlight on its walls
  - Map scrolls to first matched wall

- [ ] **4.6** Clear search
  - Clear input → remove all highlights
  - Tap highlighted order card again → remove highlight (toggle)

### Deliverable
Worker can type an order number or client name, see matching walls blink, and find any order in under 5 seconds.

### Acceptance Test
- [ ] Type "23" → walls with order #23 blink 3 times
- [ ] Type "petrov" → walls with Petrov's orders blink
- [ ] No match → "No results" message
- [ ] Clear search → all highlights removed
- [ ] Tap order card in sidebar → its walls blink + scroll into view
- [ ] Works on iPhone (portrait) — search in header, map below

---

## Phase 5: Mark as Done

**Goal**: Unloading workflow — the primary value proposition at the market.

### Tasks

- [ ] **5.1** Mark as Done from sidebar
  - "Mark as Done" button on order card (visible when status is `loaded` or `pending`)
  - Tap → confirmation dialog: "Mark order #N as done?"
  - Confirm → `UPDATE orders SET is_done = true, done_at = now() WHERE id = X`
  - Optimistic update + Realtime sync

- [ ] **5.2** Mark as Done from map popover
  - "Mark as Done" button per order inside wall popover
  - Same confirmation dialog and behavior as sidebar

- [ ] **5.3** Done visual treatment
  - Order card: dimmed (opacity 50%), muted colors, "Done" badge
  - Wall placements: done order chips are dimmed/strikethrough
  - Summary stats: "N Done" counter updates

- [ ] **5.4** Undo Done
  - "Undo" button on done order cards
  - No confirmation needed for undo (low risk)
  - `UPDATE orders SET is_done = false, done_at = NULL WHERE id = X`
  - Card and map revert to loaded/pending visual state

- [ ] **5.5** Multi-device sync verification
  - Test: Device A marks order done → Device B sees it dimmed within 1 second
  - Test: Device B undoes → Device A sees it revert

### Deliverable
Workers can mark orders as done during unloading. All devices sync instantly. Done orders are visually distinct.

### Acceptance Test
- [ ] Mark as Done → confirmation dialog → order dimmed in sidebar + map
- [ ] Undo Done → order reverts to loaded/pending state
- [ ] Second device sees Done/Undo changes within 1 second
- [ ] Summary "Done" counter is accurate
- [ ] Cannot accidentally double-tap (confirmation dialog prevents it)

---

## Phase 6: Polish & Production Readiness

**Goal**: Responsive layout, error handling, empty states, loading states — production-quality app.

### Tasks

- [ ] **6.1** Responsive layout
  - iPad landscape: map 60% + sidebar 40%, both visible
  - iPhone portrait: map full-width, sidebar as bottom sheet or tab toggle
  - Test on real devices (or Safari responsive mode)

- [ ] **6.2** Touch targets
  - Audit all interactive elements for 44x44px minimum
  - Wall cells, order cards, buttons, popover triggers

- [ ] **6.3** Empty states
  - No shipment: show shipment setup screen
  - No orders: sidebar shows "No orders yet. Add your first order." with CTA
  - No placements: map shows all empty walls with inviting dashed borders
  - All done: celebratory state? Or just dimmed everything + "All orders handed out"

- [ ] **6.4** Loading states
  - Skeleton loaders for order list and trailer map during initial data fetch
  - Button loading spinners during mutations

- [ ] **6.5** Error handling
  - Network errors: toast with retry suggestion
  - Validation errors: inline on forms, toast for unexpected errors
  - Auth errors: redirect to login with message
  - Supabase connection loss: banner or toast "Connection lost. Reconnecting..."

- [ ] **6.6** Toast notifications
  - Verify every action has appropriate toast feedback:
    - Order created/edited/deleted
    - Placement saved/edited/deleted/moved
    - Order marked as done / undone
    - Errors (validation, network)

- [ ] **6.7** Shipment reset
  - "Clear All" button in header or settings
  - Confirmation: "This will delete ALL orders and placements. Are you sure?"
  - Cascade delete via Supabase

- [ ] **6.8** Final visual polish
  - Spacing consistency (Tailwind spacing scale)
  - Typography hierarchy (headings, body, muted)
  - Shadow/elevation consistency on cards and popovers
  - Color token audit (no raw hex, all using CSS variables)
  - Dark mode verification (all tokens have dark variants)

- [ ] **6.9** Cross-device testing
  - iPad Safari (landscape + portrait)
  - iPhone Safari (portrait)
  - Chrome desktop (for development)
  - 4-5 simultaneous tabs/devices — Realtime stress test

### Deliverable
Production-ready app. Professional quality. Works on all target devices. Handles errors gracefully.

### Acceptance Test
- [ ] iPad landscape: both panels visible, no overflow issues
- [ ] iPhone portrait: map visible, sidebar accessible via sheet/toggle
- [ ] All touch targets ≥ 44px
- [ ] Empty states render correctly for each scenario
- [ ] Network error shows recovery message
- [ ] Validation errors show inline
- [ ] All actions have toast feedback
- [ ] Shipment reset works with confirmation
- [ ] 5 simultaneous tabs stay in sync
- [ ] Lighthouse score: Performance ≥ 90, Accessibility ≥ 90

---

## Dependency Graph

```
Phase 1: Foundation
  │
  ├──→ Phase 2: Orders (needs: DB, types, auth, layout, Realtime)
  │      │
  │      └──→ Phase 3: Map & Placements (needs: orders data, sidebar)
  │             │
  │             ├──→ Phase 4: Search (needs: map + placements rendered)
  │             │
  │             └──→ Phase 5: Mark as Done (needs: map + placements + orders)
  │                    │
  │                    └──→ Phase 6: Polish (needs: all features built)
  │
  └──→ Phase 4 and 5 can run in parallel after Phase 3
```

**Critical path**: 1 → 2 → 3 → 6
**Parallelizable**: Phase 4 and Phase 5 can be developed simultaneously after Phase 3.

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase Realtime filter by `shipment_id` doesn't work with RLS | Low | High | Test in Phase 1 before building data hooks. Fallback: unfiltered subscription + client-side filter. |
| Popover positioning on mobile Safari | Medium | Medium | Test early in Phase 3. Fallback: use Sheet instead of Popover on mobile. |
| 30 wall cells cause scroll performance issues on iPhone | Low | Medium | Profile in Phase 3. Fallback: virtualize with `react-window` (unlikely needed for 30 items). |
| Optimistic updates cause flicker when Realtime re-fetch follows | Medium | Low | Use `cancelQueries` in `onMutate` to prevent redundant re-fetch. Already in the pattern. |
| Auth session expires during unloading chaos | Low | High | Supabase auto-refreshes tokens. Add `onAuthStateChange` listener to handle edge cases. |
