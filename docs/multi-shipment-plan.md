# Multi-Shipment Feature — Implementation Plan

> **Status**: Architect-reviewed, ready for implementation
> **Feature**: Parallel shipment sessions (мульти-рейсы)
> **Date**: 2026-02-28

---

## 1. Problem Statement

Currently the app supports only **one active shipment at a time**. In practice, multiple trucks are loaded in parallel (3-5 at once) and operators track them on paper — separate paper schemas on different sheets for different trucks. This feature replaces paper with a digital multi-session workflow.

## 2. Requirements Summary

### 2.1 Shipments List Page (new first screen after login)

| Requirement | Details |
|-------------|---------|
| Show all shipments | Active + completed, in one table |
| Table columns | Name, Status (badge), Progress (bar), Created date, Created by (email), Actions |
| Sorting | By any column, click header to toggle asc/desc |
| Filtering | Tabs: All / Active / Completed (with counts) + search by name |
| Row click | Drill down into shipment detail (existing layout) |
| Create shipment | Operator only — Dialog with name, walls, boxes_per_wall |
| Delete shipment | Operator only — removes from history (with confirmation) |
| Reopen shipment | Operator only — completed → active |
| Worker access | Browse + drill down only, no CRUD on shipments |

### 2.2 Quick Entrance

- On login/page load: auto-redirect to last visited shipment (stored in localStorage)
- If last shipment was deleted → show list instead
- User can always go back to full list

### 2.3 Shipment Detail Page

- Same layout as current (trailer map + order sidebar)
- URL: `/shipments/:id`
- Completed shipments open in **read-only** mode (no edit buttons)
- Burger menu: new item "Все рейсы" → back to list

### 2.4 Roles

| Action | Operator | Worker |
|--------|----------|--------|
| View shipments list | Yes | Yes |
| Create shipment | Yes | No |
| Delete shipment | Yes | No |
| Reopen shipment | Yes | No |
| Drill down into shipment | Yes | Yes |
| Add/edit/delete orders | Yes (active only) | No |
| Add/edit/delete placements | Yes (active only) | No |
| Mark done / Undo | Yes (active only) | Yes (active only) |
| Complete shipment | Yes | No |

### 2.5 Out of Scope

- Move orders between shipments (future idea, parked)
- Data migration (existing data can be wiped)
- Assignment of workers to specific shipments

---

## 3. Database Changes

### 3.1 New Migration

File: `supabase/migrations/YYYYMMDDHHMMSS_multi_shipment.sql`

```sql
-- Track who created the shipment (plain email, no FK to auth)
ALTER TABLE shipments ADD COLUMN created_by TEXT;

-- [ARCHITECT M1] Add updated_at — shipments are now mutable (reopen)
-- Consistent with orders/placements which already have updated_at + trigger
ALTER TABLE shipments ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON shipments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- [ARCHITECT M2] Make name NOT NULL — essential for table identification
ALTER TABLE shipments ALTER COLUMN name SET DEFAULT 'Без названия';
UPDATE shipments SET name = 'Без названия' WHERE name IS NULL;
ALTER TABLE shipments ALTER COLUMN name SET NOT NULL;

-- Index for listing/filtering shipments
CREATE INDEX idx_shipments_status ON shipments(status, created_at DESC);

-- Enable realtime for shipments table (list auto-updates)
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
```

### 3.2 Type Update

`src/types/database.ts` — manually add to shipments types:
- `created_by: string | null` (Row), `created_by?: string | null` (Insert/Update)
- `updated_at: string` (Row), `updated_at?: string` (Insert/Update)
- Change `name` from `string | null` to `string` (Row), add default in Insert

No changes to `orders` or `placements` tables.

---

## 4. Implementation Plan

### Batch 1: Foundation (hooks + types)

All tightly coupled — do together.

| # | Task | File | What changes |
|---|------|------|-------------|
| 1.1 | Migration SQL | `supabase/migrations/...` | New file |
| 1.2 | Update DB types | `src/types/database.ts` | Add `created_by` to shipments |
| 1.3 | Update query keys | `src/lib/query-keys.ts` | `shipments: [...]`, `shipment: (id) => [...]` |
| 1.4 | Rewrite shipment hook | `src/hooks/use-shipment.ts` | Split: `useShipments()` (list, create, delete, reopen) + `useShipment(id)` (fetch by `.eq("id", id).single()`, works for both active AND completed). **[ARCHITECT M3]**: Replace `queryClient.clear()` with targeted invalidation: invalidate `queryKeys.shipments` + `queryKeys.shipment(id)`, do NOT clear orders/placements cache |
| 1.5 | Shipment progress hook | `src/hooks/use-shipment-progress.ts` | NEW — fetch orders for all shipments in one `.in()` query, aggregate client-side. Query key: `["shipments-progress", ...ids]`. **Note**: progress bars on list are NOT realtime-updated — refresh on navigation/focus (acceptable for MVP) |
| 1.6 | Last shipment hook | `src/hooks/use-last-shipment.ts` | NEW — localStorage get/set/clear |
| 1.7 | Realtime for list + detail | `src/hooks/use-realtime.ts` | Add `useRealtimeShipments()` — unfiltered subscription on `shipments` table, invalidates `queryKeys.shipments`. **[ARCHITECT M5]**: Also extend `useRealtimeSync(shipmentId)` to subscribe to `shipments` table filtered by ID — so reopen/complete reflects on detail page without manual refresh |
| 1.8 | New types | `src/types/index.ts` | Add types (see Section 5.6) |

### Batch 2: Routing + New Pages

| # | Task | File | What changes |
|---|------|------|-------------|
| 2.1 | Install table component | CLI | `pnpm dlx shadcn@latest add table` |
| 2.2 | Shipments list page | `src/pages/ShipmentsPage.tsx` | NEW — table with filter/sort/search, create dialog, role-based actions |
| 2.3 | Create shipment dialog | `src/components/shipment-form-dialog.tsx` | NEW — replaces shipment-setup.tsx, Dialog wrapper |
| 2.4 | Shipment detail page | `src/pages/ShipmentDetailPage.tsx` | NEW — extracts logic from HomePage, gets `id` from URL params. **[ARCHITECT M4]**: If `useShipment(id)` returns null → redirect to `/` with toast "Рейс не найден" (handles deleted shipments + stale bookmarks) |
| 2.5 | Update routes | `src/App.tsx` | `/` → ShipmentsPage, `/shipments/:id` → ShipmentDetailPage |
| 2.6 | Clean up | Delete `HomePage.tsx`, `shipment-setup.tsx` | Replaced by new pages/components |

### Batch 3: Component Updates

| # | Task | File | What changes |
|---|------|------|-------------|
| 3.1 | Layout updates | `src/components/app-layout.tsx` | Add "Все рейсы" to burger menu, `isReadOnly` prop, `shipmentName` in header |
| 3.2 | Order sidebar | `src/components/order-sidebar.tsx` | Add `isReadOnly` prop |
| 3.3 | Order card | `src/components/order-card.tsx` | Add `isReadOnly` prop |
| 3.4 | Wall popover | `src/components/wall-popover.tsx` | Add `isReadOnly` prop |

### Batch 4: Polish + Verify

- `pnpm build` — zero TS errors
- Manual testing of all flows (see Verification section)

---

## 5. Technical Decisions

### 5.1 No TanStack Table

The shipments list will have <100 rows. Manual sort/filter with `useMemo` is simpler and adds zero bundle size. TanStack Table (~15KB) is overkill here.

### 5.2 Client-Side Progress Aggregation

Supabase client doesn't support aggregate queries (COUNT/SUM) without DB functions. Since data volume is small (dozens of orders per shipment), we fetch all orders in one `.in()` query and aggregate in JS. Same pattern as existing `use-wall-data.ts`.

### 5.3 `created_by` as Plain Text

Stores email string at creation time. No FK to `auth.users` — keeps things simple (no Edge Functions needed, no cross-schema joins). Matches project philosophy.

### 5.4 Quick Entrance via localStorage

No server-side "last visited" tracking. Simple localStorage key set on every shipment visit. Verified against fetched list on load (handles deleted shipments gracefully).

### 5.5 Read-Only Mode is UI-Only

Completed shipments show no edit buttons, but RLS still allows writes. Acceptable for MVP — same pattern as existing role-based restrictions.

### 5.6 `isReadOnly` vs `isOperator` — Two Orthogonal Dimensions (Architect S3)

These are **different concepts** passed as separate props:
- `isOperator` — role-based: controls CRUD visibility (create/edit/delete orders & placements)
- `isReadOnly` — status-based: `shipment.status === "completed"`, hides ALL action buttons

Logic in components:
- Show edit/delete buttons: `isOperator && !isReadOnly`
- Show Done/Undo buttons: `!isReadOnly` (both roles on active shipments)
- `isReadOnly` overrides everything — completed shipment = no actions at all

### 5.7 New Types (Architect N2)

```typescript
interface ShipmentProgress {
  totalOrders: number;
  doneOrders: number;
  totalBoxes: number;
}

type ShipmentFilter = "all" | "active" | "completed";

interface ShipmentsSort {
  column: "name" | "status" | "created_at" | "created_by";
  direction: "asc" | "desc";
}
```

### 5.8 Quick Entrance Navigation (Architect N3)

Use `navigate(`/shipments/${id}`, { replace: true })` to avoid polluting browser history. Back button goes to the page before, not into a redirect loop.

---

## 6. Files Summary

### New (7 files)
- `supabase/migrations/YYYYMMDDHHMMSS_multi_shipment.sql`
- `src/pages/ShipmentsPage.tsx`
- `src/pages/ShipmentDetailPage.tsx`
- `src/components/shipment-form-dialog.tsx`
- `src/components/shipments-table.tsx`
- `src/hooks/use-shipment-progress.ts`
- `src/hooks/use-last-shipment.ts`

### Modified (10 files)
- `src/types/database.ts`
- `src/types/index.ts`
- `src/lib/query-keys.ts`
- `src/hooks/use-shipment.ts`
- `src/hooks/use-realtime.ts`
- `src/App.tsx`
- `src/components/app-layout.tsx`
- `src/components/order-sidebar.tsx`
- `src/components/order-card.tsx`
- `src/components/wall-popover.tsx`

### Deleted (2 files)
- `src/pages/HomePage.tsx` → replaced by ShipmentsPage + ShipmentDetailPage
- `src/components/shipment-setup.tsx` → replaced by shipment-form-dialog.tsx

---

## 7. Verification

### Test Matrix

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Operator: login → see shipments table | Table with filter tabs, create button |
| 2 | Operator: create new shipment | Dialog opens, shipment appears in table |
| 3 | Operator: click row → drill down | See trailer map + orders (existing layout) |
| 4 | Operator: burger menu → "Все рейсы" | Return to shipments table |
| 5 | Operator: complete shipment | Status changes to "completed" in table |
| 6 | Operator: reopen completed | Status changes back to "active" |
| 7 | Operator: delete shipment | Removed from table (with confirmation) |
| 8 | Worker: login → see shipments table | Table visible, no create/delete buttons |
| 9 | Worker: drill into active shipment | See layout, only Done/Undo buttons |
| 10 | Worker: drill into completed shipment | Read-only, no action buttons at all |
| 11 | Quick entrance: reopen browser | Auto-redirect to last visited shipment |
| 12 | Quick entrance: last shipment deleted | Show list, no 404 |
| 13 | Realtime: operator creates shipment | Other users see it appear in table |
| 14 | Sort/filter table | Columns sortable, tabs filter by status |
| 15 | Build | `pnpm build` — zero TS errors |
