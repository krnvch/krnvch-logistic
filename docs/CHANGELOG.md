# Changelog — Grida (formerly krnvchLogistic)

All notable changes to the platform are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [4.8.0] — 2026-06-09

### Mira — Grida's in-app AI assistant (GRD-104, Phase 1 + Stage A)

Added **Mira**, an in-app AI assistant ("The grid, answered."). A header button opens a right-side push panel where users ask about the current shipment in English or Russian and get answers grounded in real data — the model calls a database tool instead of guessing. Read-only for now: one tool, no persistence, no write actions.

#### Added
- `get_shipment_overview(uuid)` Postgres RPC — single source of truth for shipment counts (total/done/open/urgent + per-wall breakdown); `SECURITY INVOKER`, so RLS applies; `EXECUTE` revoked from `anon`
- Framework-agnostic tool registry (`supabase/functions/_shared/copilot-tools/`) with role filtering — designed for reuse by the future MCP server (GRD-105)
- `copilot` Edge Function — agent runtime on Vercel AI SDK v5 + Gemini 2.5 Flash; deployed **with** JWT verification; the model key never reaches the browser; tool queries run under the caller's RLS; loop bounded to 5 steps / 1024 output tokens
- Chat UI (`src/components/copilot/`): header launcher (Sparkles, far right, both main pages) toggling a **push panel** (480px, page shrinks and stays interactive — not a modal overlay); conversation survives panel close and route changes; lazy-loaded so it stays out of the initial bundle
- Chat experience adapted from the owner's Wally design system (PRD v2 §1a — structure adopted, skin follows the Grida brand): personalized greeting + tappable suggestion pills, assistant answers rendered as **markdown without a bubble** (lists, headings, inline-code chips), **activity chain** showing tool calls live («Посмотрела сводку рейса»), copy action under answers, "Mira can make mistakes" disclaimer under the composer
- `copilot.*` i18n keys (EN/RU); Russian copy uses feminine forms («Мира думает…», «Посмотрела…»)
- Client deps: `ai@^5`, `@ai-sdk/react@^2` (pinned to the same major as the Edge Function runtime), `react-markdown`
- Parity test `copilot-overview-parity.test.ts` guarding SQL ↔ `getOrderStatus` status-rule drift (27 tests total)
- Migration backfill: `orders.priority` column formalized in a migration (`ADD COLUMN IF NOT EXISTS`)

#### Notes
- Edge Function secret `GOOGLE_GENERATIVE_AI_API_KEY` (documented in `.env.example`); the function returns a graceful 503 when unset
- Naming: user-facing name **Mira**; technical slug stays `copilot` (see `docs/mira-naming-handoff.md`)
- PRD bumped to v2.0 with delivery stages B–D tracked as GRD-124/125/126 (threads & history, write tools with approval cards, polish)
- Known trade-off: `react-markdown` + AI SDK live in the shared `vendor` chunk (+~36 kB gzip) because of the single-vendor-chunk rule from the v4.7.1 fix; revisiting chunking is Stage-D material

---

## [Infrastructure] — 2026-06-03

### Cloudflare integration (GRD-94)

DNS, edge proxy, WAF, and analytics for `grida.space`. Configuration only — no application code changes (managed in the Cloudflare and Vercel dashboards).

#### Added
- DNS migrated to Cloudflare nameservers
- Edge proxy (orange cloud) on apex / `www` / `app`; SSL Full (Strict); Always Use HTTPS
- WAF: Cloudflare managed ruleset, Bot Fight Mode, Browser Integrity Check, a custom scanner-block rule (`/wp-*`, `/.env`, `/.git`, …), and per-IP rate limiting
- Cookieless Web Analytics (page views, visits, Core Web Vitals)

#### Security
- All `grida.space` traffic now passes through Cloudflare's edge (DDoS mitigation, WAF, bot filtering) before reaching the Vercel origin
- Note: the Supabase backend is called directly by the frontend and is **not** behind Cloudflare — its protection relies on Supabase RLS/rate-limits

---

## [4.7.1] — 2026-06-03

### Fixed
- **Production build crash** (`Cannot read properties of undefined (reading 'createContext')` → blank screen). The manual `vendor`/`ui` chunk split separated React from React-dependent libraries (radix-ui) across chunks, creating a circular `ui ↔ vendor` dependency where the `ui` chunk evaluated before React was defined. Replaced with a single `vendor` chunk (all `node_modules`), keeping React and its consumers together. Surfaced after the v4.7.0 Sentry dependency tipped the latent cycle into a hard crash; the bug only manifests in the chunked production build, not `pnpm dev`. (GRD-52)

---

## [4.7.0] — 2026-06-03

### Error Monitoring (Sentry) (GRD-52)

Integrated Sentry for frontend error monitoring. Unhandled exceptions and React render crashes are now captured and reported, with a graceful fallback UI instead of a blank screen.

#### Added
- `@sentry/react` dependency
- `src/lib/sentry.ts` — Sentry init module (graceful no-op when `VITE_SENTRY_DSN` is absent, mirroring the analytics pattern)
- `src/components/error-fallback.tsx` — recoverable fallback UI (i18n) shown by the Sentry `ErrorBoundary` on render crashes
- `ErrorBoundary` wrapping the app in `main.tsx`
- `VITE_SENTRY_DSN` env var (added to `.env.example`)
- i18n keys: `error.title`, `error.description`, `error.retry` (en + ru)

#### Privacy
- `sendDefaultPii: false` — no automatic collection of PII (IP address, cookies, request bodies)
- Events tagged by `environment` (build mode) to separate production from local dev

---

## [4.6.0] — 2026-04-04

### Postman API Collection & Learning Roadmap (GRD-96)

Set up Postman as an API exploration tool for the Grida platform. Built a complete API collection covering auth, REST CRUD, and Edge Functions — all tested against the live Supabase backend.

#### Added
- Postman workspace "Grida" with environment "Grida — dev" (supabase_url, supabase_anon_key, access_token)
- Auth collection: Sign In (Operator) with auto-token-save post-response script
- Shipments collection: List All (GET), Get Single (GET)
- Orders collection: List by Shipment (GET), Create (POST), Update (PATCH), Delete (DELETE)
- Placements collection: List by Shipment (GET)
- Edge Functions collection: Create Suggestion (POST)
- `docs/roadmap.md` — execution plan for all 21 backlog tasks across 7 phases (A–G)

#### Learning outcomes
- Full CRUD cycle demonstrated: GET (200) → POST (201) → PATCH (200) → DELETE (204)
- REST API vs Edge Functions: auto-generated endpoints with OpenAPI spec vs custom undocumented endpoints (shadow API concept from Wallarm's API Discovery)
- HTTP concepts: methods, headers, status codes, JWT auth, Bearer tokens
- Environment variables and auto-scripting in Postman

---

## [4.5.1] — 2026-04-04

### Seed Platform with Realistic Test Data

A comprehensive SQL seed script that populates the database with realistic logistics data — 8 shipments in different lifecycle states, 198 orders with real German client names, and ~400 placements distributed across trailer walls.

#### Added
- `supabase/seed.sql` — idempotent seed script (re-runnable via Supabase SQL Editor or psql)
- 8 shipments: 2 heavily loaded, 1 moderate, 1 light, 1 empty, 2 completed full, 1 completed small
- 198 orders with realistic client names (hotels, markets, supermarkets, cafés, florists)
- Mix of statuses: pending (0%), partially loaded, fully loaded, done
- ~15% urgent priority orders across active shipments
- Box counts ranging from 3 to 45 per order
- Large orders split across 2–3 walls, some walls at full capacity (24 boxes)
- Realistic timestamps spread across multiple days

---

## [4.5.0] — 2026-03-28

### Telegram Bot for Quick Idea Capture

A private Telegram bot that captures ideas on the go — send a message and it creates a Linear issue in the Learning Roadmap project automatically.

#### Added
- Supabase Edge Function `telegram-bot` — receives Telegram webhook, creates Linear issues
- Private auth: only the configured Telegram user ID can create issues
- First line of message = issue title, rest = description
- Bot replies with issue identifier and Linear link
- `/start` command with usage instructions

#### Technical
- Telegram Bot API webhook → Supabase Edge Function → Linear GraphQL API
- Secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USER_ID` (+ existing `LINEAR_API_KEY`)
- All responses return 200 to Telegram (webhook contract requirement)

---

## [4.4.0] — 2026-03-28

### In-App Idea Suggestions (User Feedback Channel)

Users can now submit feature ideas and suggestions directly from within the app — a lightweight feedback loop that routes to a dedicated Linear project for triage.

#### Added
- Lightbulb icon button in the header (both ShipmentsPage and AppLayout), left of the avatar
- Suggestion dialog with free-form text field (10–1000 chars), character counter, and reassurance text
- Supabase Edge Function `create-suggestion` — validates payload and creates Linear issues via GraphQL API
- "User Suggestions" Linear project (separate from Learning Roadmap) for triage
- Bilingual UI: 8 i18n keys in both `en.json` and `ru.json`
- PostHog events: `suggestion_submitted` and `suggestion_failed`
- `Textarea` shadcn/ui component (`src/components/ui/textarea.tsx`)

#### Technical
- Edge Function at `supabase/functions/create-suggestion/index.ts` — Deno runtime, Linear GraphQL API
- `LINEAR_API_KEY` stored in Supabase Edge Function secrets (never exposed to client)
- Metadata attached to Linear issues: user role, current page, timestamp (no PII)
- Linear workflow rule added to CLAUDE.md: post PRDs and updates as comments on issues

---

## [4.3.0] — 2026-03-23

### Linear Integration (Project Management)

All tasks, planning, and progress tracking have moved from a local TODO.md file to **Linear** — a professional project management tool, managed directly from the terminal via Linear MCP.

#### Added
- Linear MCP server connection — create, search, update, and close issues from Claude Code
- "Learning Roadmap" project in the Grida team (GRD)
- 34 issues migrated with full English translations, completion notes, and PR references
- Label taxonomy: 9 categories (Testing, CI/CD, Database, UX/UI, Product, Performance, Collaboration, Security, Infrastructure) + 3 complexity levels (Easy, Medium, Hard) + type (Feature, Improvement, Bug)
- Priority system based on recommended learning order (High → Medium → Low)
- 14 completed issues moved to Done state with historical context preserved
- New "Task Management (Linear)" section in CLAUDE.md — Linear is the single source of truth

#### Changed
- `docs/TODO.md` replaced with a pointer to Linear (no longer contains tasks)
- CLAUDE.md updated with Linear workflow rules and English-only requirement for all issues

#### Technical
- Patched 2 bugs in the Linear MCP server (`create_issues` batch mutation used wrong GraphQL operation; `delete_issue` used array param instead of singular)
- All issues linked to Learning Roadmap project with labels via `issueBatchCreate` API

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
