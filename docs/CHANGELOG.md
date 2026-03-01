# Changelog — krnvchLogistic

All notable changes to the platform are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [2.2.0] — 2026-03-01

### Dark Theme

Users can now switch between Light, Dark, and System themes.

#### Added
- Theme toggle in burger dropdown menus (both ShipmentsPage and ShipmentDetailPage) via nested submenu with radio selection
- "Оформление" card on Profile page with 3 theme buttons (Светлая / Тёмная / Системная)
- `useThemeSync` hook — syncs theme preference to Supabase `raw_user_meta_data.theme` for cross-device persistence
- `ThemeSubmenu` reusable component for dropdown menus
- `Theme` type (`"light" | "dark" | "system"`) in shared types
- PRD document (`docs/prd-dark-theme.md`)

#### Technical Details
- Powered by `next-themes` (already in dependencies) — handles `.dark` class toggle, localStorage, system preference detection, and flash prevention
- CSS was already ready: `index.css` has full `:root` (light) and `.dark` (dark) token sets
- localStorage is primary storage (instant, no flash); Supabase sync is background (cross-device only)
- Login page respects theme from localStorage / system preference
- Toast notifications automatically follow theme via CSS variables

---

## [2.1.0] — 2026-02-28

### Profile Settings Page (#4)

Users can now manage their profile without SQL or admin help.

#### Added
- Profile page (`/profile`) with first name, last name, and role editing
- Password change section (collapsed by default, with current password verification)
- "Профиль" menu item in both ShipmentsPage and ShipmentDetailPage dropdowns
- Password validation utility with 5 unit tests (15 total in project)

#### Changed
- Role switching is now self-service via the profile page (previously required SQL)

---

## [2.0.0] — 2026-02-28

### Rebrand: Tulip Logistic → krnvchLogistic

The platform is now **goods-agnostic** — no longer tied to the original tulip-farm use case.

#### Changed
- Renamed `tulip_count` → `item_count` across DB, types, forms, hooks, and tests
- Swapped Flower2 icon → Package icon on login, header, and shipments page
- Updated all UI text: "Tulip Logistic" → "krnvchLogistic", "Тюльпанов" → "Количество"
- Renamed localStorage key: `tulip-last-shipment-id` → `krnvch-last-shipment-id`
- Renamed GitHub repo: `tulip-logistic` → `krnvch-logistic`
- Renamed Vercel project: `krnvch-logistic.vercel.app`
- Updated all docs titles and references
- Added historical notes to 7 discovery docs and the original spec file
- Renamed `tulip-truck-load-map-spec.md` → `load-map-spec.md`

#### Migration
```sql
ALTER TABLE orders RENAME COLUMN tulip_count TO item_count;
```

---

## [1.2.0] — 2026-02-28

### Dev Workflow Setup

Infrastructure for professional development workflow.

#### Added
- GitHub Actions CI pipeline: lint → test → build on every PR and push to `main`
- Unit tests for `getOrderStatus()` — 10 tests covering done/loaded/pending logic (Vitest)
- Feature branch workflow: `feature/task-name` → PR → CI → merge
- Learning log (`docs/learning-log.md`) for tracking educational progress

---

## [1.1.0] — 2026-02-28

### Multi-Shipment Support

Operators can now manage multiple shipments in parallel.

#### Added
- Shipments list page with table view, filtering (all/active/completed), sorting, and search
- Create / rename / delete / reopen shipments
- Progress bar per shipment (% of done orders)
- Quick entrance: auto-redirect to last visited shipment
- Realtime updates for shipment list
- DB migration for multi-shipment schema changes

---

## [1.0.0] — 2026-02-22

### Initial Release — MVP

Full logistics load map application for managing trailer loading.

#### Added
- **Auth**: Email/password login via Supabase Auth
- **Shipment setup**: Configure trailer walls and boxes per wall
- **Orders**: CRUD for orders (number, client, description, item count, box count, pickup time)
- **Trailer map**: Visual grid of trailer walls with box placement tracking
- **Placements**: Drag-and-assign boxes to walls via popover UI
- **Order status**: Computed status (pending → loaded → done) based on placements and `is_done` flag
- **Mark done/undo**: Workers can mark orders as done or revert
- **Realtime sync**: Live updates across all connected clients via Supabase Realtime
- **Search**: Search orders by number/client, highlights matching walls on the map
- **User roles**: Operator (full access) and Worker (read-only + done/undo)
- **Responsive**: Works on desktop and mobile (sidebar collapses below map)
- **Complete docs**: PRD, architecture, implementation plan, discovery docs (7 files), domain glossary
- **13-agent team**: Full multi-agent collaboration setup for development workflow
