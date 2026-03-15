# Implementation Plan — Visual Redesign (Look & Feel)

**Date**: 2026-03-14 (updated 2026-03-15)
**PRD**: `docs/prd-visual-redesign.md`
**Brand book**: `docs/brand/visual-identity.md`
**Branch**: `feature/visual-redesign`
**Brand name**: Grida
**Estimated phases**: 4

---

## Overview

We are replacing the default shadcn/ui visual identity with the Grida brand design
language: emerald green accent (`oklch(0.70 0.19 160)` — same value in both light
and dark modes), Zalando Sans Expanded (headings, buttons, badges, tabs) + Zalando
Sans (body text), square shapes (radius 0), bold borders (2px), and updated
functional colors. All changes are CSS/component-level with zero database impact.
Both light and dark themes are updated.

---

## Phase 1: Foundation — Design Tokens & Fonts

**Goal**: New color palette, fonts, and base tokens. After this phase, the entire
app will visually transform because all components read from CSS variables.

### Tasks

- [ ] **1.1** Install font packages
  - `pnpm add @fontsource-variable/zalando-sans @fontsource-variable/zalando-sans-expanded`
  - Files: `package.json`

- [ ] **1.2** Import fonts in app entry
  - Add font imports to main.tsx
  - Files: `src/main.tsx`

- [ ] **1.3** Update CSS design tokens — Light mode
  - Replace all `:root` CSS variables in `index.css`
  - Brand primary (same in both modes): `oklch(0.70 0.19 160)` (emerald)
  - Primary foreground (dark text on green): `oklch(0.13 0.02 160)` (both modes)
  - Updated success: teal `oklch(0.62 0.12 192)` hue 192 (NOT lime hue 130 — different color family from brand)
  - Updated destructive: saturated red `oklch(0.55 0.22 27)`
  - New `--warning` token: amber `oklch(0.75 0.15 80)`
  - New `--info` token: blue `oklch(0.58 0.16 250)`
  - New `--tab-active` token: `oklch(0.55 0.20 160)` (darker emerald for text)
  - New `--tab-inactive` token: `oklch(0.38 0.04 160)` (muted dark)
  - New `--tab-active-indicator` token: `oklch(0.70 0.19 160)` (bright primary for underline)
  - New `--input-focus` token: foreground color (NOT green) — near-black in light mode
  - Updated neutrals — green-whisper gray (hue 160, subtle chroma):
    - `--background`: `oklch(0.985 0 0)`
    - `--foreground`: `oklch(0.13 0.01 160)`
    - `--card`: `oklch(1 0 0)`
    - `--card-foreground`: `oklch(0.13 0.01 160)`
    - `--popover`: `oklch(1 0 0)`
    - `--popover-foreground`: `oklch(0.13 0.01 160)`
    - `--secondary`: `oklch(0.94 0.02 160)`
    - `--secondary-foreground`: `oklch(0.18 0.02 160)`
    - `--muted`: `oklch(0.94 0.005 100)`
    - `--muted-foreground`: `oklch(0.46 0.01 160)`
    - `--accent`: `oklch(0.92 0.03 160)`
    - `--accent-foreground`: `oklch(0.18 0.02 160)`
    - `--border`: `oklch(0.87 0.01 160)`
    - `--input`: `oklch(0.87 0.01 160)`
    - `--ring`: `oklch(0.55 0.20 160)`
  - Files: `src/index.css`

- [ ] **1.4** Update CSS design tokens — Dark mode
  - Replace all `.dark` CSS variables
  - Same brand primary `oklch(0.70 0.19 160)` — identical in dark mode
  - Primary foreground: `oklch(0.13 0.02 160)` (dark text on green, same as light)
  - Updated success: teal `oklch(0.58 0.10 192)` (dark variant)
  - Updated destructive: `oklch(0.40 0.15 27)` / foreground `oklch(0.60 0.19 25)`
  - Warning: `oklch(0.70 0.14 80)`, info: `oklch(0.55 0.14 250)`
  - Tab tokens for dark: `--tab-active`: `oklch(0.70 0.19 160)`, `--tab-inactive`: `oklch(0.55 0.03 160)`, `--tab-active-indicator`: `oklch(0.70 0.19 160)`
  - `--input-focus`: `oklch(0.96 0.005 160)` (foreground, NOT green)
  - Updated dark neutrals — green-whisper gray:
    - `--background`: `oklch(0.13 0.01 160)`
    - `--foreground`: `oklch(0.96 0.005 160)`
    - `--card`: `oklch(0.17 0.01 160)`
    - `--card-foreground`: `oklch(0.96 0.005 160)`
    - `--popover`: `oklch(0.17 0.01 160)`
    - `--popover-foreground`: `oklch(0.96 0.005 160)`
    - `--secondary`: `oklch(0.22 0.02 160)`
    - `--secondary-foreground`: `oklch(0.96 0 0)`
    - `--muted`: `oklch(0.22 0.01 160)`
    - `--muted-foreground`: `oklch(0.62 0.01 160)`
    - `--accent`: `oklch(0.22 0.03 160)`
    - `--accent-foreground`: `oklch(0.96 0 0)`
    - `--border`: `oklch(0.27 0.02 160)`
    - `--input`: `oklch(0.27 0.02 160)`
    - `--ring`: `oklch(0.70 0.19 160)`
  - Files: `src/index.css`

- [ ] **1.5** Set radius to zero
  - Set `--radius: 0` and explicitly override all derived values:
    `--radius-sm: 0`, `--radius-md: 0`, `--radius-lg: 0`, `--radius-xl: 0`
  - Override in `@theme inline` block as well
  - Files: `src/index.css`

- [ ] **1.6** Update font variables
  - Change `--font-sans` to `"Zalando Sans Variable", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
  - Add `--font-heading` as `"Zalando Sans Expanded Variable", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
  - Register `--font-heading` in `@theme inline` block
  - Register ALL new color tokens in `@theme inline`: `--color-warning`, `--color-warning-foreground`,
    `--color-info`, `--color-info-foreground`, `--color-tab-active`, `--color-tab-inactive`,
    `--color-tab-active-indicator`, `--color-input-focus`
  - Files: `src/index.css`

### Deliverable
The app renders with new colors, new fonts (body text), square corners on all
components, and updated palette in both light and dark modes. The visual change
is dramatic and immediate — everything reads from CSS variables.

### Acceptance Test
- [ ] App loads with Zalando Sans body text (no Inter)
- [ ] Primary buttons are brand green (emerald) with dark text on green (not white)
- [ ] All corners are square (0px radius) — buttons, cards, inputs, badges
- [ ] Light mode palette is updated with green-whisper neutrals
- [ ] Dark mode palette is updated — same primary green as light mode
- [ ] Success (teal hue 192) is visually distinct from primary (emerald hue 160) — different color families
- [ ] Tab tokens render: active text darker emerald, inactive text muted
- [ ] No TypeScript errors (`pnpm build` passes)
- [ ] No external font requests in Network tab (fonts self-hosted)

---

## Phase 2: UI Components — Bold Borders & Heading Font

**Goal**: Apply bold 2px borders to Tier 1 components, heading font to titles,
buttons, and badges, and update individual component styles for the new design
language.

### Tasks

- [ ] **2.1** Update Card component
  - Add `border-2` to card root
  - Remove `shadow-sm` (flat + border approach, InPost style)
  - Files: `src/components/ui/card.tsx`

- [ ] **2.2** Update Button component
  - Add `border-2` to outline and secondary variants
  - Ensure primary variant uses brand green background
  - Add `font-heading` class (Zalando Sans Expanded for all buttons)
  - Update font-weight to `font-medium` (weight 500, per brand book)
  - Files: `src/components/ui/button.tsx`

- [ ] **2.3** Update Input component
  - Add `border-2`
  - Update focus border to use foreground color (NOT brand green) — `--input-focus` token
  - Files: `src/components/ui/input.tsx`

- [ ] **2.4** Update Badge component
  - Replace `rounded-full` with `rounded-none` (explicit square)
  - Add `border-2` where bordered
  - Add `font-heading font-medium` (Expanded, weight 500)
  - Add `uppercase` class (ALL CAPS)
  - Add `tracking-wide` class (letter-spacing)
  - Files: `src/components/ui/badge.tsx`

- [ ] **2.5** Update Dialog & AlertDialog
  - Add `border-2` to content panels
  - Files: `src/components/ui/dialog.tsx`, `src/components/ui/alert-dialog.tsx`

- [ ] **2.6** Update Select component
  - Add `border-2` to trigger and content
  - Files: `src/components/ui/select.tsx`

- [ ] **2.7** Update Sheet component
  - Add `border-2` to content edge borders
  - Files: `src/components/ui/sheet.tsx`

- [ ] **2.8** Update DropdownMenu
  - Add `border-2` to content
  - Files: `src/components/ui/dropdown-menu.tsx`

- [ ] **2.9** Update Progress bar
  - Ensure square shape (no rounded ends)
  - Brand green indicator
  - Height: 6px (brand book specification)
  - Files: `src/components/ui/progress.tsx`

- [ ] **2.10** Update Sonner (toast)
  - Ensure toasts use new design tokens, square shape
  - Files: `src/components/ui/sonner.tsx`

- [ ] **2.11** Update Table component
  - Keep thin borders (Tier 2: 1px)
  - Files: `src/components/ui/table.tsx`

- [ ] **2.12** Update ScrollArea, Separator, Label
  - Minor adjustments for consistency
  - Files: `src/components/ui/scroll-area.tsx`, `src/components/ui/separator.tsx`, `src/components/ui/label.tsx`

- [ ] **2.13** Apply heading font to component titles, buttons, and badges
  - Add `font-heading` class to CardTitle in card.tsx
  - Add `font-heading` class to DialogTitle in dialog.tsx
  - Add `font-heading` class to AlertDialogTitle in alert-dialog.tsx
  - Add `font-heading` class to SheetTitle in sheet.tsx
  - Add `font-heading` class to Button (all variants) in button.tsx
  - Add `font-heading` class to Badge (all variants) in badge.tsx
  - Files: `src/components/ui/card.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/alert-dialog.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`

- [ ] **2.14** Apply Tier 3 border (4px) to tab active indicators
  - Active tab underline uses 4px border-bottom with `--tab-active-indicator` token
  - Files: `src/index.css` (utility class or component styles as needed)

### Deliverable
All shadcn/ui components have bold borders (Tier 1: 2px), square shapes,
heading font on titles, buttons, and badges. Components feel "branded" not "default."

### Acceptance Test
- [ ] Cards have 2px border, no shadow, square corners
- [ ] Buttons (outline/secondary) have 2px border, rendered in Zalando Sans Expanded
- [ ] Inputs have 2px border with foreground-color focus border (not green)
- [ ] Badges are square (not pills), ALL CAPS with letter-spacing
- [ ] Card titles, dialog titles render in Zalando Sans Expanded
- [ ] Buttons and badges render in Zalando Sans Expanded
- [ ] Progress bars are square-ended
- [ ] Table rows keep thin (1px) borders
- [ ] Active tab indicators use 4px border
- [ ] All components look correct in both light and dark mode
- [ ] `pnpm build` passes

---

## Phase 3: App Components — Brand Alignment

**Goal**: Update all app-level components to use the new design language
consistently. Fix any hardcoded colors or styles that don't flow from tokens.

### Tasks

- [ ] **3.1** Update LoginForm
  - Logo is Scoped G SVG from `docs/brand/logo/final-scoped-g-icon.svg` (not Package icon)
  - Horizontal lockup: Scoped G + "Grida" wordmark (Zalando Sans Expanded 500, baseline-aligned to inner G with `translateY(4px)`, gap 3px — see brand book mockup and `docs/brand/logo/presentation-round4.html`)
  - Left-align logo + subtitle + form to same left edge (not centered)
  - Update placeholder email: `operator@krnvch.app` → `operator@grida.io`
  - Square icon container (remove `rounded-full`)
  - Files: `src/components/login-form.tsx`

- [ ] **3.2** Update OrderCard
  - Status badge colors aligned with new tokens
  - Ensure ring highlight uses brand green
  - Verify progress bar renders correctly
  - Files: `src/components/order-card.tsx`

- [ ] **3.3** Update WallCell
  - Keep thin borders (Tier 2: 1px) for grid cells
  - Update success border color to new success token (teal hue 192)
  - Verify wall-highlight animation uses new primary
  - Files: `src/components/wall-cell.tsx`

- [ ] **3.4** Update AppLayout
  - Header border consistency (border-b with new border color)
  - Sidebar tokens: update `--sidebar-*` tokens in `src/index.css` to match green-whisper neutrals (derive from card/secondary values)
  - Horizontal lockup in header: Scoped G + "Grida" (same spec as login — see 3.1)
  - Square user avatar (no rounded corners — consistent with "everything is square" rule)
  - Files: `src/components/app-layout.tsx`, `src/index.css`

- [ ] **3.5** Update OrderSidebar
  - Header styling consistency
  - Empty state text colors
  - Files: `src/components/order-sidebar.tsx`

- [ ] **3.6** Update SummaryBar
  - Icon colors and text alignment with new tokens
  - Files: `src/components/summary-bar.tsx`

- [ ] **3.7** Update SearchInput
  - Square dropdown, border consistency
  - Files: `src/components/search-input.tsx`

- [ ] **3.8** Update TrailerMap
  - Label styling consistency
  - Files: `src/components/trailer-map.tsx`

- [ ] **3.9** Update WallPopover
  - Dialog styling, inline select square shape
  - Files: `src/components/wall-popover.tsx`

- [ ] **3.10** Update form dialogs
  - OrderForm, ShipmentFormDialog, RenameShipmentDialog
  - Files: `src/components/order-form.tsx`, `src/components/shipment-form-dialog.tsx`, `src/components/rename-shipment-dialog.tsx`

- [ ] **3.11** Update ThemeSubmenu
  - Ensure icons and labels look correct with new palette
  - Files: `src/components/theme-submenu.tsx`

- [ ] **3.12** Apply nav tab styling
  - Navigation tabs use `font-heading` (Zalando Sans Expanded)
  - Active tab text uses `--tab-active` token (darker emerald)
  - Inactive tab text uses `--tab-inactive` token (muted)
  - Active tab has 4px underline indicator using `--tab-active-indicator` token
  - Files: `src/components/app-layout.tsx` (or wherever nav tabs live)

### Deliverable
All app components are visually aligned with the new brand. No component
looks "old" or uses legacy styling.

### Acceptance Test
- [ ] Login page renders with Scoped G logo SVG, left-aligned with form
- [ ] Login heading in Zalando Sans Expanded
- [ ] Order cards display correctly with new status colors
- [ ] Load map (trailer grid) uses thin borders, correct success colors (teal)
- [ ] All dialogs/forms have square shapes and bold borders
- [ ] Nav tabs use Zalando Sans Expanded with correct active/inactive tokens
- [ ] No hardcoded colors remain that conflict with new palette
- [ ] Both themes look consistent
- [ ] `pnpm build` passes

---

## Phase 4: Pages & Final Polish

**Goal**: Update page-level components, fix any remaining visual issues,
verify full consistency, update brand name to "Grida", and integrate final logo assets.

### Tasks

- [ ] **4.1** Update ShipmentsPage
  - Filter tabs: active text uses `--tab-active` token (darker emerald), NOT bright primary
  - Active tab: 4px underline indicator using `--tab-active-indicator` token (bright primary)
  - Tab font is Zalando Sans Expanded (`font-heading`)
  - Loading spinner: brand green
  - Table wrapper: square shape, 2px border
  - Heading in Zalando Sans Expanded
  - Brand name "Grida" in header, Zalando Sans Expanded font
  - Files: `src/pages/ShipmentsPage.tsx`

- [ ] **4.2** Update ShipmentDetailPage
  - Loading spinner brand alignment
  - Files: `src/pages/ShipmentDetailPage.tsx`

- [ ] **4.3** Update ProfilePage
  - Card titles in Zalando Sans Expanded
  - Theme button styling with new palette
  - Password section styling
  - Files: `src/pages/ProfilePage.tsx`

- [ ] **4.4** Update NotFoundPage
  - Heading in Zalando Sans Expanded
  - Button with brand color
  - Files: `src/pages/NotFoundPage.tsx`

- [ ] **4.5** Integrate Grida logo and favicon
  - Replace `Package` icon with Scoped G SVG from `docs/brand/logo/final-scoped-g-icon.svg` in header and login
  - Update favicon from `docs/brand/logo/final-favicon-g.svg`
  - Brand name "Grida" displayed in header
  - Files: `src/components/login-form.tsx`, `src/pages/ShipmentsPage.tsx`, `src/components/app-layout.tsx`, `index.html`

- [ ] **4.6** Update all "krnvchLogistic" / "krnvch" text references to "Grida"
  - Header brand name (including shortened "krnvch" variant)
  - Login page title/subtitle, placeholder email → `operator@grida.io`
  - Page `<title>` and meta tags
  - localStorage key: `krnvch-last-shipment-id` → `grida-last-shipment-id` (in `src/hooks/use-last-shipment.ts`)
  - Any hardcoded references in components
  - Search all variations: `krnvch`, `krnvchLogistic`, `krnvch-logistic`
  - Files: `index.html`, `src/components/login-form.tsx`, `src/pages/ShipmentsPage.tsx`, `src/components/app-layout.tsx`, `src/hooks/use-last-shipment.ts`, and any other files

- [ ] **4.7** Update website favicon
  - Replace default Vite/React favicon with Grid G SVG from `docs/brand/logo/final-favicon-g.svg`
  - Copy SVG to `public/` directory (or inline in `index.html`)
  - Update `<link rel="icon">` in `index.html`
  - Files: `index.html`, `public/favicon.svg`

- [ ] **4.8** Update GitHub project
  - Update repository description to mention "Grida"
  - Upload Scoped G logo as repository social preview (if applicable)
  - Update README if it references old name
  - Via: GitHub web UI or `gh` CLI

- [ ] **4.9** Update Vercel project
  - Update project name if applicable (currently "krnvch-logistic")
  - Update any Vercel-specific branding settings
  - Note: URL may remain `krnvch-logistic.vercel.app` unless custom domain is set up
  - Via: Vercel dashboard

- [ ] **4.10** Full visual QA pass
  - Walk through every page in light mode
  - Walk through every page in dark mode
  - Check responsive (mobile) view
  - Verify loading states, empty states, error states
  - Verify toasts render correctly
  - Files: N/A (manual testing)

- [ ] **4.11** Update architecture docs
  - Update `docs/architecture.md` Section 9 (Design System Tokens) with new values
  - Files: `docs/architecture.md`

### Deliverable
Complete visual redesign applied to all pages. Brand name is "Grida", logo is
Scoped G, both themes work, all edge states look correct.

### Acceptance Test
- [ ] ShipmentsPage header shows "Grida" brand name in Zalando Sans Expanded with Scoped G logo
- [ ] Active filter tab text uses darker emerald (`--tab-active`), 4px underline indicator
- [ ] Profile page theme buttons reflect new design
- [ ] 404 page uses new brand styling
- [ ] Brand name shows as "Grida" everywhere (no "krnvch" references remain)
- [ ] Scoped G logo is displayed (not generic Package icon)
- [ ] Favicon shows Grid G in browser tab
- [ ] User avatar is square (no rounded corners)
- [ ] localStorage key is `grida-last-shipment-id`
- [ ] GitHub project updated with Grida branding
- [ ] All pages consistent in light mode
- [ ] All pages consistent in dark mode
- [ ] Mobile responsive — no broken layouts
- [ ] `pnpm build` passes with zero errors
- [ ] `pnpm lint` passes

---

## Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/index.css` | Modify | All design tokens (colors, radius, fonts, tab tokens, input-focus) |
| `src/main.tsx` | Modify | Font imports |
| `src/components/ui/button.tsx` | Modify | Border-2, font-heading, font weight |
| `src/components/ui/card.tsx` | Modify | Border-2, remove shadow, font-heading |
| `src/components/ui/badge.tsx` | Modify | Square shape, border, font-heading, uppercase, tracking-wide |
| `src/components/ui/input.tsx` | Modify | Border-2, foreground focus border |
| `src/components/ui/dialog.tsx` | Modify | Border-2, font-heading |
| `src/components/ui/alert-dialog.tsx` | Modify | Border-2, font-heading |
| `src/components/ui/select.tsx` | Modify | Border-2 |
| `src/components/ui/sheet.tsx` | Modify | Border-2, font-heading |
| `src/components/ui/dropdown-menu.tsx` | Modify | Border-2 |
| `src/components/ui/progress.tsx` | Modify | Square shape |
| `src/components/ui/sonner.tsx` | Modify | Token alignment |
| `src/components/ui/table.tsx` | Modify | Thin border (keep 1px) |
| `src/components/ui/scroll-area.tsx` | Modify | Minor consistency |
| `src/components/ui/separator.tsx` | Modify | Minor consistency |
| `src/components/ui/label.tsx` | Modify | Minor consistency |
| `src/components/login-form.tsx` | Modify | Scoped G logo, left-align, heading font |
| `src/components/order-card.tsx` | Modify | Status colors, ring |
| `src/components/wall-cell.tsx` | Modify | Thin borders, teal success color |
| `src/components/app-layout.tsx` | Modify | Header, sidebar, Grida brand name, nav tabs |
| `src/components/order-sidebar.tsx` | Modify | Header, empty state |
| `src/components/summary-bar.tsx` | Modify | Icon/text colors |
| `src/components/search-input.tsx` | Modify | Square dropdown |
| `src/components/trailer-map.tsx` | Modify | Labels |
| `src/components/wall-popover.tsx` | Modify | Dialog, select |
| `src/components/order-form.tsx` | Modify | Dialog styling |
| `src/components/shipment-form-dialog.tsx` | Modify | Dialog styling |
| `src/components/rename-shipment-dialog.tsx` | Modify | Dialog styling |
| `src/components/theme-submenu.tsx` | Modify | Palette alignment |
| `src/pages/ShipmentsPage.tsx` | Modify | Filters, header, spinner, Grida name, tab tokens |
| `src/pages/ShipmentDetailPage.tsx` | Modify | Spinner |
| `src/pages/ProfilePage.tsx` | Modify | Cards, theme buttons |
| `src/pages/NotFoundPage.tsx` | Modify | Heading, button |
| `index.html` | Modify | Favicon, page title "Grida" |
| `docs/architecture.md` | Modify | Design tokens section |
| `docs/brand/logo/final-scoped-g-icon.svg` | Source | Scoped G icon for header and login |
| `docs/brand/logo/final-favicon-g.svg` | Source | Favicon SVG source |

---

## Dependencies

| Package | Justification |
|---------|---------------|
| `@fontsource-variable/zalando-sans` | Self-hosted body font (GDPR, performance) |
| `@fontsource-variable/zalando-sans-expanded` | Self-hosted heading font (GDPR, performance) |

No other new dependencies. All changes use existing Tailwind CSS 4 + shadcn/ui.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Brand green vs success green confusion | Now different color families entirely: emerald hue 160 vs teal hue 192. Visual testing in Phase 1 confirms clear distinction. |
| Bold borders feel heavy on small components (badges, small buttons) | Start with 2px, adjust to 1px per-component if needed |
| Font loading delays (FOUT) | Self-hosted via @fontsource — bundled with app, no network dependency |
| Square corners look harsh on very small elements | Monitor during Phase 2, all elements already square via radius token |
| Extensive file changes risk regressions | Each phase has acceptance tests. `pnpm build` verified after each phase. |
| Dark mode inconsistencies | Phase 1 sets all tokens (same primary in both modes); Phase 4 includes full dark mode QA pass |
| "krnvchLogistic" references missed during rename | Phase 4.6 includes a search for all old name references across the codebase |
