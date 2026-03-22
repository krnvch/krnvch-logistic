# System Architecture — krnvchLogistic (Load Map)

**Version**: 1.0
**Date**: 2026-02-22
**Owner**: Principal Full-Stack Architect
**Status**: Approved (architect review applied)

---

## Table of Contents

1. [Stack](#1-stack)
2. [Database Schema](#2-database-schema)
3. [Validation Rules](#3-validation-rules)
4. [Row-Level Security](#4-row-level-security)
5. [Real-Time Sync](#5-real-time-sync)
6. [Data Flow](#6-data-flow)
7. [Auth Flow](#7-auth-flow)
8. [TypeScript Types](#8-typescript-types)
9. [Design System Tokens](#9-design-system-tokens)
10. [Project File Structure](#10-project-file-structure)
11. [Architecture Decisions](#11-architecture-decisions)
12. [Technical Debt Register](#12-technical-debt-register)

---

## 1. Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + TypeScript (strict) | SPA, no SSR |
| Build | Vite 7, pnpm | `@tailwindcss/vite` plugin |
| Styling | Tailwind CSS 4, shadcn/ui (new-york) | CSS variables, OKLch color space |
| State / Data | TanStack React Query + Supabase Realtime | Optimistic updates + cache invalidation |
| Backend | Supabase (PostgreSQL, Auth, Realtime) | No Edge Functions for MVP |
| Hosting | Vercel (auto-deploy from `main`) | Static SPA deploy |

---

## 2. Database Schema

```sql
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
  item_count INTEGER,
  box_count INTEGER NOT NULL CHECK (box_count > 0),
  pickup_time TEXT,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal', 'urgent')),
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
```

### Why `is_done` Instead of `status` Column

Storing `status` as `pending | loaded | done` would create a sync problem:
- `pending` and `loaded` are **derived from placement data** (SUM of placed boxes vs. order box_count)
- Every placement create/edit/delete would require a corresponding order status update
- If the app forgets to update (or a Realtime event is missed), the status column disagrees with reality

By storing only `is_done` (user-initiated action), the `pending`/`loaded` states are always computed from the source of truth — the placements table. No stale data, no sync bugs.

---

## 3. Validation Rules

Enforced at **both** app level (for UX feedback) and DB level (for data integrity).

| Rule | App-Level Check | DB-Level Enforcement |
|------|----------------|---------------------|
| Box count per order | `SUM(placements.box_count) WHERE order_id = X` ≤ `orders.box_count` | No DB constraint (aggregate checks need triggers — overkill for MVP). App enforces. |
| Box count per wall | `SUM(placements.box_count) WHERE shipment_id = X AND wall_number = N` ≤ `shipments.boxes_per_wall` | No DB constraint (same reason). App enforces. |
| Wall number range | `1` ≤ `wall_number` ≤ `shipments.trailer_walls` | `CHECK (wall_number > 0)` in DB. Upper bound checked by app (needs shipment context). |
| Unique placement | One record per `(shipment_id, order_id, wall_number)` | `UNIQUE (shipment_id, order_id, wall_number)` in DB. |
| Order number unique | One order number per shipment | `UNIQUE (shipment_id, order_number)` in DB. |
| Box count positive | `box_count > 0` | `CHECK (box_count > 0)` in DB. |

**Principle**: DB constraints catch bugs. App checks provide user-facing error messages. Both must agree.

---

## 4. Row-Level Security

MVP approach — single shared account. RLS is simple but present (security baseline).

```sql
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
```

**Future evolution path**: When per-user auth is added (out of scope for MVP):
1. Add `user_id` column to shipments
2. Split into separate SELECT/INSERT/UPDATE/DELETE policies
3. Workers get read + update-is_done-only access
4. Operator gets full access
5. No schema migration for orders/placements — they inherit access through shipment_id FK

---

## 5. Real-Time Sync

### Architecture

Real-time sync is **infrastructure, not a feature**. It's wired into the data layer from Phase 1.

```
┌─────────────────────────────────────────────────┐
│  Device A (Operator)                            │
│                                                 │
│  User action → mutation hook                    │
│    → optimistic update (TanStack Query cache)   │
│    → Supabase INSERT/UPDATE/DELETE              │
│                                                 │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Supabase PostgreSQL                            │
│    → Write committed                            │
│    → Realtime broadcasts change event           │
│      (filtered by shipment_id)                  │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
┌──────────────────┐ ┌──────────────────┐
│  Device B        │ │  Device C        │
│  (Worker)        │ │  (Worker)        │
│                  │ │                  │
│  Realtime event  │ │  Realtime event  │
│    → invalidate  │ │    → invalidate  │
│      query cache │ │      query cache │
│    → re-fetch    │ │    → re-fetch    │
│    → UI updates  │ │    → UI updates  │
└──────────────────┘ └──────────────────┘
```

### Subscription Setup

One channel per active shipment. Subscribe to both `orders` and `placements`:

```typescript
// In use-realtime.ts — created in Phase 1, used by all data hooks
function useRealtimeSync(shipmentId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`shipment:${shipmentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `shipment_id=eq.${shipmentId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', shipmentId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'placements',
        filter: `shipment_id=eq.${shipmentId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['placements', shipmentId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shipmentId, queryClient]);
}
```

### Conflict Resolution

**MVP**: Last-write-wins. Acceptable because:
- Loading phase: 1 operator, no conflicts possible
- Unloading phase: workers only write `is_done` (idempotent boolean flip)
- Simultaneous placement edits: operator-only action, extremely rare

**Future path**: If conflicts become an issue, add `version` column (optimistic locking) or use Supabase Broadcast for presence awareness.

### Optimistic Updates

All mutations use TanStack Query's `onMutate` → `onError` → `onSettled` pattern:

```typescript
// Pattern for all mutations
mutationFn: (data) => supabase.from('table').insert(data),
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, optimisticUpdate);
  return { previous };
},
onError: (_err, _data, context) => {
  queryClient.setQueryData(queryKey, context?.previous); // rollback
  toast.error("Failed to save. Please try again.");
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey }); // re-fetch truth
},
```

---

## 6. Data Flow

### Query Architecture

All data access goes through typed hooks. Components never call Supabase directly.

```
Component (render)
  ↓ reads from
TanStack Query cache
  ↓ populated by
use-orders.ts / use-placements.ts / use-shipment.ts
  ↓ fetches from
Supabase client (typed with Database generic)
  ↓ queries
PostgreSQL (with RLS applied)
```

### Mutation Architecture

```
Component (user action)
  ↓ calls
Mutation hook (from use-orders.ts / use-placements.ts)
  ↓ executes
1. Optimistic cache update (instant UI feedback)
2. Supabase INSERT/UPDATE/DELETE
  ↓ on success
3. Supabase Realtime broadcasts to other devices
4. onSettled invalidates local cache (re-fetch truth)
  ↓ on error
3. Rollback optimistic update
4. Show error toast
```

### Query Keys

Consistent key structure for cache management:

```typescript
const queryKeys = {
  shipment: ['shipment'] as const,
  orders: (shipmentId: string) => ['orders', shipmentId] as const,
  placements: (shipmentId: string) => ['placements', shipmentId] as const,
};
```

---

## 7. Auth Flow

```
App loads
  → supabase.auth.getSession()
  → Session exists?
    YES → load active shipment → render main app
    NO  → render branded login screen
          → email + password form
          → supabase.auth.signInWithPassword()
          → on success → redirect to main app
          → on error → show error message
```

Session is managed by the Supabase SDK (stored in localStorage, auto-refreshed).

No logout button required for MVP, but include one in a menu for completeness.

---

## 8. TypeScript Types

### Database Types (generated)

After schema is created, generate types from Supabase:

```bash
supabase gen types typescript --project-id <id> > src/types/database.ts
```

The Supabase client is typed with this:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Application Types

These complement (not duplicate) the generated types. They represent domain concepts and UI-derived state.

```typescript
// --- Status (computed, not stored) ---

type OrderDisplayStatus = "pending" | "loaded" | "done";

function getOrderStatus(order: Order, placedBoxes: number): OrderDisplayStatus {
  if (order.is_done) return "done";
  if (placedBoxes >= order.box_count) return "loaded";
  return "pending";
}

// --- Derived types for UI ---

interface OrderWithStatus {
  order: Order;
  placed_boxes: number;       // SUM of placements.box_count for this order
  remaining_boxes: number;    // box_count - placed_boxes
  status: OrderDisplayStatus; // computed
}

interface WallData {
  wall_number: number;
  placements: PlacementWithOrder[];
  total_boxes: number;
  remaining_capacity: number;
  is_full: boolean;
}

interface PlacementWithOrder {
  placement: Placement;
  order: Order;
}

// --- Row types (from generated Database type) ---
// These are shorthand aliases for readability:

type Shipment = Database['public']['Tables']['shipments']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Placement = Database['public']['Tables']['placements']['Row'];

type ShipmentInsert = Database['public']['Tables']['shipments']['Insert'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type PlacementInsert = Database['public']['Tables']['placements']['Insert'];

type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type PlacementUpdate = Database['public']['Tables']['placements']['Update'];
```

---

## 9. Design System Tokens

### Current State

The project uses shadcn/ui's default **neutral** palette (all grayscale, zero chroma). This is clean but lacks semantic color tokens needed for status indicators and interactions.

### Required Additions

Add to `src/index.css` before building UI components:

```css
:root {
  /* --- Existing shadcn/ui tokens (unchanged) --- */

  /* --- Custom semantic tokens --- */
  --success: oklch(0.65 0.16 145);
  --success-foreground: oklch(0.98 0.01 145);
}

.dark {
  /* --- Custom semantic tokens (dark mode) --- */
  --success: oklch(0.55 0.16 145);
  --success-foreground: oklch(0.98 0.01 145);
}
```

And register in the `@theme inline` block:

```css
@theme inline {
  /* ... existing tokens ... */
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
}
```

### Token Usage Map

| Element | Light Token | Notes |
|---------|------------|-------|
| Page background | `bg-background` | Light warm neutral |
| Empty wall | `bg-muted` + dashed border | Inviting "add here" feel |
| Occupied wall | `bg-card` + `border-border` + shadow | Solid, present |
| Full wall | `bg-card` + `border-success/30` accent | Subtle "full" indicator |
| Done placement | `text-muted-foreground` + `opacity-50` | Clearly "finished" |
| Search highlight | `ring-primary` pulse animation | Eye-catching, temporary |
| Selected wall | `ring-ring` | Active selection |
| Status badge: pending | `bg-secondary` | Neutral, default |
| Status badge: loaded | `bg-success text-success-foreground` | Positive, ready |
| Status badge: done | `bg-muted text-muted-foreground` | De-emphasized |

### Blink Animation

Define in `src/index.css`:

```css
@keyframes wall-highlight {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50% { box-shadow: 0 0 0 4px var(--primary); }
}

.wall-highlight {
  animation: wall-highlight 0.4s ease-in-out 3;
}
```

---

## 10. Project File Structure

```
src/
  main.tsx                       — app entry (providers: QueryClient, BrowserRouter, Toaster)
  App.tsx                        — route definitions + auth gate
  index.css                      — Tailwind + design tokens

  types/
    database.ts                  — generated Supabase types (DO NOT EDIT)
    index.ts                     — app-level types, derived types, type helpers

  lib/
    supabase.ts                  — typed Supabase client
    utils.ts                     — cn() helper
    query-keys.ts                — centralized query key factory

  hooks/
    use-auth.ts                  — auth state, login/logout
    use-shipment.ts              — active shipment query + create/reset mutations
    use-orders.ts                — orders CRUD queries + mutations
    use-placements.ts            — placements CRUD queries + mutations
    use-realtime.ts              — Supabase Realtime subscriptions + cache invalidation
    use-search.ts                — search state + highlight logic
    use-wall-data.ts             — derived wall data (computed from orders + placements)

  components/
    app-layout.tsx               — main layout shell (header + map + sidebar)
    summary-bar.tsx              — header stats (orders, boxes placed, done)
    search-input.tsx             — search field with clear button

    trailer-map.tsx              — map grid container (scrollable)
    wall-cell.tsx                — individual wall rendering (empty/occupied/full/done)
    wall-popover.tsx             — placement actions (add/edit/remove/move/mark done)

    order-sidebar.tsx            — sidebar container (scrollable)
    order-card.tsx               — individual order card (status, progress, actions)
    order-form.tsx               — create/edit order (Dialog or Sheet)

    login-form.tsx               — branded auth screen
    shipment-setup.tsx           — create new / load active shipment

    ui/                          — shadcn/ui primitives (managed by CLI, do not edit)
      button.tsx
      card.tsx
      sonner.tsx
      ... (added via `pnpm dlx shadcn@latest add`)

  pages/
    HomePage.tsx                 — main (only) page, composes all components
    NotFoundPage.tsx             — 404
```

### Module Dependency Rules

```
pages/ → components/ → hooks/ → lib/
                                  ↓
                              types/

components/ui/ ← (no app dependencies, standalone primitives)
```

- `pages/` imports from `components/` only — never from `hooks/` or `lib/` directly
- `components/` imports from `hooks/` and `components/ui/` — never from `lib/supabase` directly
- `hooks/` imports from `lib/` and `types/` — never from `components/`
- `lib/` imports from `types/` only
- `components/ui/` has zero app-level imports

---

## 11. Architecture Decisions

### AD-01: Computed Order Status (not stored)

- **Context**: Order status (`pending | loaded | done`) could be stored or computed
- **Decision**: Only store `is_done` boolean. Compute `pending`/`loaded` from placement SUM.
- **Rationale**: Eliminates sync bugs between status column and placement data. Source of truth is always placements.
- **Trade-off**: Requires client-side computation on every render. Acceptable — max 40 orders, trivial computation.
- **Reversal cost**: Low. Can add a materialized/cached status column later if performance requires it.

### AD-02: Realtime as Infrastructure (Phase 1)

- **Context**: Real-time sync could be added as a feature in a later phase
- **Decision**: Wire Realtime into the data layer from Phase 1
- **Rationale**: Realtime affects how every hook is structured (cache invalidation). Retrofitting is rework.
- **Trade-off**: Slightly more complex Phase 1. Worth it to avoid hook rewrites in later phases.
- **Reversal cost**: N/A — this is foundational, not reversible.

### AD-03: Last-Write-Wins Conflict Resolution

- **Context**: Multiple devices may write simultaneously
- **Decision**: Last write wins, no conflict detection for MVP
- **Rationale**: Loading phase is single-operator. Unloading writes are idempotent boolean flips (`is_done`). Conflicts are near-impossible.
- **Reversal cost**: Medium. Adding optimistic locking (version column) is additive but touches all mutation hooks.

### AD-04: Single Shared Account

- **Context**: 1 operator + 3-4 workers need access
- **Decision**: One email/password account shared across all devices
- **Rationale**: Simplest auth model. Workers don't need distinct identities for MVP.
- **Reversal cost**: Low. Supabase Auth supports per-user accounts. Adding user_id to shipments and role-based RLS is additive.

### AD-05: No Edge Functions for MVP

- **Context**: Aggregate validation (box count per wall, per order) could be enforced server-side
- **Decision**: Enforce in app layer only. DB has column-level constraints but no aggregate triggers.
- **Rationale**: For 5 concurrent users with 40 orders, race conditions on aggregate checks are theoretical. App-level validation is sufficient.
- **Reversal cost**: Low. Can add a Supabase Edge Function or PostgreSQL trigger later for server-side validation.

### AD-06: Domain Split — Apex for Marketing, Subdomain for App

- **Context**: Grida needs a public web presence separate from the logistics app. Domain `grida.space` is owned via Vercel.
- **Decision**: `grida.space` serves a static placeholder (future landing page). `app.grida.space` serves the logistics app. Separate Vercel projects, separate GitHub repos (`krnvch/grida-website` + `krnvch/krnvch-logistic`).
- **Rationale**: Standard SaaS pattern. Marketing and product evolve independently — different stacks, deploy cadences, and (eventually) teams. Separate repos enforce this boundary cleanly.
- **Trade-off**: Two Vercel projects to manage. Acceptable — path-based routing in a monorepo adds complexity for zero benefit at this scale.
- **Reversal cost**: Low. Merging back is a DNS + Vercel config change.

---

## 12. Technical Debt Register

Items we knowingly skip in MVP, with planned resolution.

| ID | Debt | Why We Skip It | When to Fix | Effort |
|----|------|---------------|-------------|--------|
| TD-01 | No server-side aggregate validation | Race conditions are theoretical at MVP scale | When concurrent writes increase or multi-operator | Medium (Edge Function or PG trigger) |
| TD-02 | RLS policies are blanket "authenticated = full access" | Single shared account, no role separation needed | When per-user auth is added | Low (split policies) |
| TD-03 | No automated tests | MVP is small, manually testable | Before any feature expansion post-MVP | Medium (Vitest + RTL setup) |
| TD-04 | No error boundary components | App is simple, errors surface via toast | Before production hardening | Low |
| TD-05 | No CI/CD pipeline | Manual deploy is fine for 1 release | Before regular iteration begins | Low (GitHub Actions) |
| TD-06 | `staleTime: 60s` may cause stale reads between Realtime events | Realtime invalidation covers most cases | If users report stale data | Low (reduce staleTime or use `refetchInterval`) |
