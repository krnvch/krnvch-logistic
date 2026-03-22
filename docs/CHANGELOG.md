# Changelog — Grida (formerly krnvchLogistic)

All notable changes to the platform are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [4.2.0] — 2026-03-22

### Product Analytics (PostHog)

Key user actions are now tracked via PostHog — enabling data-driven product decisions, funnel analysis, and retention metrics.

#### Added
- PostHog JS SDK (`posthog-js`) integrated via `src/lib/analytics.ts`
- User identification on login (`posthog.identify` with user ID, email, role)
- Session reset on logout (`posthog.reset`)
- 10 tracked events: `user_logged_in`, `user_logged_out`, `shipment_created`, `shipment_completed`, `shipment_deleted`, `order_created`, `order_updated`, `order_marked_done`, `placement_created`, `language_changed`, `theme_changed`
- `VITE_POSTHOG_KEY` env var (added to `.env.example`)
- Graceful degradation: if `VITE_POSTHOG_KEY` is not set, all tracking is silently skipped

#### Technical
- `autocapture: false` — only explicit events, no noise
- `capture_pageview: true` — automatic page view tracking via PostHog
- Analytics module is a no-op when key is missing (safe for local dev without PostHog)

---

## [4.1.0] — 2026-03-22

### Lighthouse Audit & Optimization

Performance, SEO, and accessibility improvements based on Lighthouse audit.

#### Performance
- Code-split JS bundle into 3 chunks: vendor (303 KB), app (302 KB), ui (160 KB) — was single 765 KB chunk
- Vendor chunk (React, Supabase, Router) cached separately — changes less frequently than app code

#### SEO
- Added `<meta name="description">` to `index.html`
- Added `<meta name="theme-color" content="#3ECF8E">` for mobile browsers
- Fixed `<html lang="en">` (was hardcoded `"ru"`, now matches default language)

#### Accessibility
- Removed `maximum-scale=1.0, user-scalable=no` from viewport — was blocking pinch-to-zoom
- Added `aria-label` to 12 icon-only buttons across 6 components (edit, delete, close, search clear, password toggle, actions)

#### Cleanup
- Removed unused `public/vite.svg` (Vite default asset)

---

## [4.0.0] — 2026-03-22

### Internationalization (i18n) — English / Russian

The app is now a multilanguage platform. All UI text comes from translation files — zero hardcoded strings. Users can switch between English and Russian.

#### Added
- `i18next` + `react-i18next` for translation runtime (~5 KB gzipped)
- `src/locales/en.json` — English translations (~115 keys)
- `src/locales/ru.json` — Russian translations (~115 keys)
- Language toggle in user dropdown menu (same pattern as theme submenu)
- Language card on profile page (English / Русский buttons)
- EN / RU toggle on login page (top-right corner of card)
- `useLocaleSync` hook — syncs locale to Supabase `user_metadata.locale` + localStorage
- `<html lang>` attribute updates on language change (accessibility)
- `Locale` type (`"en" | "ru"`) in `src/types/index.ts`
- i18n rules added to `CLAUDE.md` — enforced for all future development
- PRD (`docs/prd-i18n.md`) and implementation plan (`docs/impl-i18n.md`)

#### Changed
- Default language: **English** (was Russian)
- All ~110 hardcoded Russian strings extracted from 20+ components, pages, and hooks
- `validate-password.ts` returns translation keys instead of hardcoded labels
- Date locale in shipments table follows active language (`toLocaleDateString(i18n.language)`)
- Password validation tests updated to check translation keys

#### Technical
- Components use `useTranslation()` hook → `t("key")`
- Hooks/utilities use `i18n.t("key")` from `@/lib/i18n` (avoids React hook dependency issues)
- Interpolation for dynamic values: `t("wall.title", { number: 5 })` → "Wall 5" / "Стена 5"
- Fallback chain: current locale → English → raw key (never shown to users)
- Architecture supports N languages — add a new JSON file to ship a third language

---

## [3.3.0] — 2026-03-22

### Order Priority (Database Migration)

Orders can now be marked as **urgent** — they get a visual indicator and are sorted to the top of the list.

#### Added
- `priority` column on `orders` table (`normal` | `urgent`, default `normal`) — first database migration on live prod
- Priority selector (Обычный / Срочный) in the order create/edit form
- Amber "Срочный" badge with warning icon on urgent order cards
- Left border accent (4px warning color) on urgent cards for quick scanning
- Urgent orders automatically sorted above normal orders in the sidebar

#### Technical
- `ALTER TABLE orders ADD COLUMN priority` with `CHECK` constraint and `DEFAULT` — backward-compatible, zero downtime
- Updated `database.ts` types (Row, Insert, Update) and added `OrderPriority` type alias
- Optimistic create includes `priority: "normal"` default
- Sorting in `use-wall-data.ts` — stable sort preserves pickup_time order within same priority

---

## [3.2.0] — 2026-03-21

### Password Strength Enhancement

Password change now enforces strong passwords with real-time visual feedback — you can see exactly which requirements are met as you type.

#### Added
- 5 password rules: 8+ characters, uppercase, lowercase, digit, special character (was: only 6 characters minimum)
- Live checklist below "Новый пароль" field — each rule shows a green checkmark or gray circle as you type
- Strength meter (3 bars): weak (red), medium (yellow), strong (green) with label
- Eye toggle on all password fields (profile page + login page) to show/hide entered text
- `getPasswordRules()` and `getPasswordStrength()` utilities in `src/lib/validate-password.ts`
- 15 unit tests for password validation (was: 5)

#### Changed
- Minimum password length increased from 6 to 8 characters
- Password rules checklist is always visible when the section is open (no need to start typing first)

---

## [3.1.0] — 2026-03-21

### Domain Split — grida.space

Separated the brand's web presence from the application following the standard SaaS pattern.

#### Added
- Placeholder website at `grida.space` — logo lockup, tagline, CTA to app, light/dark theme (OS-driven), CSS fade-in animation
- New repo `krnvch/grida-website` (Vite + vanilla TS + Tailwind CSS 4 + Zalando Sans fonts)
- `app.grida.space` custom domain for the logistics application
- `robots.txt` for both sites (allow on marketing, disallow on app)
- `sitemap.xml` for the placeholder site
- PRD: `docs/prd-domain-split.md`
- Architecture decision AD-06 in `docs/architecture.md`

#### Changed
- Hosting entry in architecture doc: "TBD" → "Vercel (auto-deploy from main)"

---

## [3.0.0] — 2026-03-15

### Visual Redesign — Grida Brand Identity

Complete visual transformation from default shadcn/ui to the Grida brand design language. The platform now has its own identity: emerald green accent, Zalando Sans typography, square shapes, bold borders, and the Scoped G logo.

#### Added
- Zalando Sans (body) + Zalando Sans Expanded (headings/buttons/badges/tabs) — self-hosted via @fontsource
- New CSS tokens: `--warning`, `--info`, `--tab-active`, `--tab-inactive`, `--tab-active-indicator`, `--input-focus`
- `GridaLogo` reusable component (Scoped G SVG with `currentColor`)
- Grid G favicon (`public/favicon.svg`)
- `ghost-destructive` button variant (red text + light red hover)
- User avatar button with initials (replaces hamburger menu)
- User initials computed from Supabase `user_metadata` (first_name + last_name), fallback to email
- Middle dot separators (`·`) between header counters
- Vertical separator between logo and summary bar
- Clear (X) button in shipments page search field
- Font type declarations (`src/fonts.d.ts`)

#### Changed
- **Brand rename**: krnvchLogistic → **Grida** everywhere (page title, headers, login, localStorage key)
- **Color palette**: emerald green primary `oklch(0.70 0.19 160)` — same in light and dark modes
- **Neutrals**: green-whisper gray (hue 160, subtle chroma) for brand coherence
- **Success color**: changed from lime (hue 145) to teal (hue 192) — visually distinct from brand green
- **Border radius**: 0 on all components — no exceptions
- **Border width**: Tier 1 (2px) for cards, buttons, inputs, dialogs, badges, table rows; Tier 2 (1px) for wall cells, separators; Tier 3 (4px) for active tab indicators
- **Shadows**: removed from all components (flat + bold border approach)
- **Input focus**: foreground color border (not green) — brand green reserved for actions
- **Filter tabs**: underline style (4px accent indicator) instead of filled background
- **Active status badge**: blue (`bg-info`) instead of green — green implies "done"
- **Dropdown hover**: neutral gray (`bg-muted`) instead of green-tinted accent
- **Table row borders**: 2px (promoted to Tier 1 for visual consistency)
- **Progress bar**: 6px height, square ends
- **Login page**: icon-only logo + tagline "The grid sees everything."
- **Header logo**: icon-only (28px), no wordmark
- **"Новый рейс" button**: moved from header to content area (next to search)
- **Button/input heights**: aligned to `h-9` (36px) across the platform
- **Sort column icons**: single arrow (↑ or ↓) when active, dual arrow when inactive
- **Native `<select>` in wall popover**: replaced with shadcn `Select` component
- **Dialog/Sheet close buttons**: now use `Button variant="ghost"` (consistent with all icon buttons)
- **Empty state text**: `muted-foreground/40` for placeholder dashes
- **Placeholder email**: `operator@krnvch.app` → `operator@grida.io`
- **localStorage key**: `krnvch-last-shipment-id` → `grida-last-shipment-id`

#### Updated Docs
- `docs/brand/visual-identity.md` — new Section 5 (Component Patterns), updated border tiers
- `docs/brand/brand-journey.md` — Phase 7 (implementation + UX polish)
- `docs/TODO.md` — task 10.2 marked complete

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
