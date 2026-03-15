# PRD — Visual Redesign (Look & Feel)

**Version**: 2.0
**Date**: 2026-03-15
**Status**: Updated with brand book values
**Parent feature**: Task 10.2 in `docs/TODO.md`

---

## 1. Overview

### Problem

The platform currently uses default shadcn/ui styling — monochrome grays, standard
Inter font, generic rounded corners. It looks like "yet another gray SaaS" with zero
brand identity. Users cannot visually distinguish Grida from any other
shadcn-based app.

### Solution

Create a distinctive visual identity by updating design tokens across the entire
platform: introduce a brand accent color (green), switch to a two-font type system,
change to sharp square shapes (radius 0), add bolder borders, and update all
functional/status colors to align with the new brand. All changes apply equally
to light and dark themes.

### Success Criteria

| Metric | Target |
|--------|--------|
| Brand recognition | Platform is visually distinct from default shadcn/ui |
| Consistency | All pages look cohesive in both light and dark themes |
| Status clarity | Brand green and success teal are visually distinguishable |
| No UX regression | All touch targets remain >=44px, layout unchanged |
| Performance | No measurable impact on load time (fonts loaded efficiently) |

---

## 2. Scope

### In Scope

- Design tokens: full color palette (brand, functional, neutral)
- Typography: new font pair (headings + body)
- Shape: border-radius -> 0 (all components)
- Borders: increased width (2-4px for major elements, 1px for grid)
- All shadcn/ui components visual update (buttons, cards, badges, inputs, etc.)
- Status/functional colors: updated, more saturated, brand-aligned
- Both themes (light + dark)
- Brand icon: Scoped G SVG mark + Grid G favicon

### Out of Scope

| Feature | Reason |
|---------|--------|
| UX/layout changes | Pure visual update, no workflow changes |
| Navigation restructure | Separate task |
| New features | Not related |
| Logo/brand design | Completed by Brand Designer agent (Alfredo) — see `docs/brand/visual-identity.md` |

---

## 3. Design Language

### 3.1 Visual References

| Reference | What to take |
|-----------|-------------|
| **InPost** | Bold yellow CTA buttons, thick borders, square shapes, dark text on bright backgrounds |
| **Supabase** | Green accent color family, clean dashboard UI, sharp components |
| **Firecrawl** | Orange accent warmth, clean sidebar, minimal UI |
| **Stripe** | Premium polish, typography hierarchy, whitespace |
| **Linear** | Dark theme excellence, minimal UI, precision |
| **Vercel** | Sharp geometric shapes, high contrast, monochrome + accent |
| **cal.com** | Bold UI, strong brand color, square buttons |
| **Sentry** | Purple accent approach, dashboard density |
| **Work.os / Apollo** | SaaS dashboard patterns, color usage |

### 3.2 Design Principles

1. **Sharp, not soft.** Square corners (radius 0), bold borders, geometric shapes.
2. **Bold, not shy.** Saturated colors, thick lines, strong typographic hierarchy.
3. **Clean, not cluttered.** Generous whitespace, clear information hierarchy.
4. **Branded, not generic.** Every element should feel like Grida, not "default library."
5. **Left-aligned, not centered.** Content and headings default to left alignment. Center alignment is an exception, not the rule.

---

## 4. Functional Requirements

### FR-VR-01: Brand Color Palette

Update all CSS custom properties in `src/index.css` to the new brand palette.

**Primary/Accent — Brand Green:**

| Swatch | Context | Value | Usage |
|--------|---------|-------|-------|
| Primary | Both modes | `oklch(0.70 0.19 160)` | Buttons, links, active tabs, focus rings |
| Primary foreground | Both modes | `oklch(0.13 0.02 160)` | Dark text on green |
| Primary pressed | Both modes | `oklch(0.55 0.20 160)` | Hover/pressed state (darker) |

The primary green is the **same color in both light and dark modes** — no lightness
adjustment needed. Dark text (`oklch(0.13 0.02 160)`) on brand green background
provides sufficient contrast in both themes.

**Neutral palette — Green-Whisper Gray:**

Neutrals carry a subtle green tint (hue 160, very low chroma 0.005-0.02) for
brand coherence. Not pure gray — everything whispers green.

- Background: warm off-white (light) / deep green-tinted dark (dark)
- Foreground: near-black with green tint (light) / near-white with green tint (dark)
- Borders: visible, not subtle — supports thick border style
- Muted: for secondary text, disabled states

**Tab tokens (new):**

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--tab-active` | `oklch(0.55 0.20 160)` | `oklch(0.70 0.19 160)` | Active tab text (darker emerald) |
| `--tab-inactive` | `oklch(0.38 0.04 160)` | `oklch(0.55 0.03 160)` | Inactive tab text (muted dark) |
| `--tab-active-indicator` | `oklch(0.70 0.19 160)` | `oklch(0.70 0.19 160)` | Active underline (bright primary) |

**Input focus token (new):**

| Token | Usage |
|-------|-------|
| `--input-focus` | Input focus border uses **foreground color** (NOT green). Light mode: near-black. Dark mode: near-white. |

Brand green is reserved for buttons, links, and active states — not input focus.

**Functional colors (all updated, more saturated):**

| Token | Light Mode | Dark Mode | Hue | Purpose |
|-------|-----------|-----------|-----|---------|
| `--success` | `oklch(0.62 0.12 192)` | `oklch(0.58 0.10 192)` | 192 (teal) | Loaded/complete status |
| `--success-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0 0)` | — | Text on success |
| `--destructive` | `oklch(0.55 0.22 27)` | `oklch(0.40 0.15 27)` | 27 (red) | Errors, delete actions |
| `--destructive-foreground` | `oklch(0.55 0.22 27)` | `oklch(0.60 0.19 25)` | — | Text on destructive |
| `--warning` | `oklch(0.75 0.15 80)` | `oklch(0.70 0.14 80)` | 80 (amber) | Caution states |
| `--warning-foreground` | `oklch(0.18 0 0)` | `oklch(0.15 0 0)` | — | Text on warning |
| `--info` | `oklch(0.58 0.16 250)` | `oklch(0.55 0.14 250)` | 250 (blue) | Informational |
| `--info-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0 0)` | — | Text on info |

**Critical rule:** Brand green (emerald, hue 160) must be **visually distinguishable**
from success (teal, hue 192) at a glance. Different hue, not just different lightness.
Success is teal (192), NOT lime (130) as originally proposed.

### FR-VR-02: Typography System

Replace Inter with a two-font system using Zalando Sans family.

**Heading font — Zalando Sans Expanded:**
- Wide geometric sans-serif — creates natural hierarchy through width contrast
- Used for: page titles, card titles, section headers, brand name, buttons, badges, tabs
- Weights: 500 (medium — buttons/badges/tabs), 600 (semibold), 700 (bold — headings)
- Source: @fontsource-variable, self-hosted (SIL OFL 1.1)

**Body font — Zalando Sans:**
- Clean, readable geometric sans-serif — same design DNA as Expanded, different width
- Used for: body text, labels, inputs, table cells, descriptions
- Weights: 400 (regular), 500 (medium — bold body text, NOT 700)
- Source: @fontsource-variable, self-hosted (SIL OFL 1.1)

**Rule:** Expanded (heading font) is for all "action" and "label" elements (headings,
buttons, badges, tabs). Regular is for "content" elements (body, inputs, tables).

**Badge styling:**
- ALL CAPS with `letter-spacing: 1px`
- Uses heading font (Zalando Sans Expanded)

**Given** the user views any page
**When** they see headings (h1-h4, card titles, page titles)
**Then** the font is Zalando Sans Expanded at weight 600-700
**And** buttons, badges, and tabs use Zalando Sans Expanded at weight 500
**And** all body text, labels, inputs, and table content use Zalando Sans at weight 400-500

### FR-VR-03: Square Shapes (Radius Zero)

**Given** any UI component (button, card, input, badge, dialog, dropdown)
**When** it renders
**Then** it has 0px border-radius (sharp 90-degree corners)

Implementation: set `--radius: 0` in CSS variables. **Important:** also
explicitly set all derived radius values to 0 — `--radius-xl` uses
`calc(var(--radius) + 4px)` which would yield 4px, not 0.

```css
--radius: 0;
--radius-sm: 0;
--radius-md: 0;
--radius-lg: 0;
--radius-xl: 0;
```

**Exception:** None. All elements go square.

### FR-VR-04: Bold Borders

**Tier 1 — Major elements (2px border):**
- Cards
- Buttons (all variants)
- Inputs / selects
- Dialogs / sheets
- Badges
- Alert dialogs

**Tier 2 — Grid/dense elements (1px border):**
- Wall cells (trailer grid)
- Table rows
- Separators
- Dropdown menu items

**Tier 3 — Accent elements (4px border):**
- Active tab indicators (underline)
- Progress bars
- Emphasis lines

**Given** a Card component
**When** it renders
**Then** its border is 2px solid (not the default 1px)

### FR-VR-05: Component Visual Updates

All shadcn/ui components updated to reflect new design language:

**Buttons:**
- Square corners (radius 0)
- 2px border on outline/secondary variants
- Zalando Sans Expanded font, weight 500
- Brand green background with dark text for default/primary variant

**Cards:**
- Square corners
- 2px border
- No box-shadow — flat + bold border approach (InPost style)

**Badges:**
- Square corners
- Bold border
- ALL CAPS with letter-spacing 1px
- Zalando Sans Expanded font
- Status badges use updated functional colors

**Inputs:**
- Square corners
- 2px border
- Focus border uses **foreground color** (NOT green) — brand green is for action elements only

**Progress bars:**
- Square shape (no rounded ends)
- Brand green for indicator
- 4px height (Tier 3 accent border)

**Dropdown menus:**
- Square corners
- Bold borders
- Clear hover states

### FR-VR-06: Status Colors Update

| Status | Current | New |
|--------|---------|-----|
| Pending (secondary) | Gray `oklch(0.97 0 0)` | Green-whisper gray (hue 160, low chroma) |
| Loaded (success) | Green `oklch(0.65 0.16 145)` | Teal `oklch(0.62 0.12 192)` — hue 192, distinct from brand emerald (160) |
| Done (muted) | Muted gray | Muted with green-whisper tint for brand alignment |
| Error (destructive) | Red `oklch(0.577 0.245 27.325)` | Saturated red `oklch(0.55 0.22 27)` |

**Critical rule:** Brand green (emerald, hue 160) must be **visually distinguishable**
from success (teal, hue 192) at a glance. Different hue, not just lightness.

### FR-VR-07: Dark Theme Parity

**Given** the user is in dark mode
**When** they view any component
**Then** it uses the **same** brand green accent color `oklch(0.70 0.19 160)` — no lightness adjustment needed
**And** all visual changes (square corners, bold borders, new fonts, status colors)
apply identically to dark mode

The primary green is identical in both modes. Dark text on green buttons works
in both themes because the green lightness (0.70) provides sufficient contrast
with the dark foreground (`oklch(0.13 0.02 160)`).

### FR-VR-08: Brand Icon — Scoped G Mark

The brand icon is the **Scoped G** — a letterform "G" framed by brackets,
representing Grida's identity as a grid-based logistics platform.

**Logo mark (header, login page):** Scoped G SVG — brackets + G.
- Light mode: `docs/brand/logo/final-scoped-g-icon.svg`
- Dark mode: `docs/brand/logo/final-scoped-g-icon-dark.svg`

**Favicon (browser tab):** Grid G — simplified G letterform only.
- Light mode: `docs/brand/logo/final-favicon-g.svg`
- Dark mode: `docs/brand/logo/final-favicon-g-dark.svg`

**Given** the user sees the header or login page
**When** the brand icon/logo is displayed
**Then** it uses the Scoped G SVG mark (not a generic lucide icon)
**And** the favicon uses the Grid G variant

---

## 5. UI Layout

No layout changes. All pages retain their current structure.
Only visual properties change (colors, fonts, borders, radius).

**Default alignment: left.** All headings, text blocks, and content sections
default to left alignment. Center alignment is used only for specific cases
(e.g., empty states, login page hero). This follows design principle #5:
"Left-aligned, not centered."

### Component update preview (ASCII)

**Current button vs. New button:**
```
Current:                    New:
+----------------+         +================+
|   Создать      |         ||   СОЗДАТЬ    ||
+----------------+         +================+
 rounded, 1px border,       square, 2px border,
 gray primary,               brand green primary,
 Inter font                   Zalando Sans Expanded
```

**Current card vs. New card:**
```
Current:                    New:
+-------------------+      +===================+
| Рейс #123        |      || Рейс #123       ||
| 15 заказов       |      || 15 заказов      ||
+-------------------+      +===================+
 rounded, thin border       square, bold border,
                             no shadow, green-whisper gray
```

---

## 6. Data Model

No database changes. This feature is purely frontend — CSS variables,
component styles, and font assets. No Supabase schema impact.

---

## 7. Implementation Notes

### Font Loading Strategy (Architect-revised)

**Do NOT use Google Fonts CDN.** Self-host fonts via `@fontsource` packages
for privacy (GDPR), performance (same-origin), and reliability (no external dep).

```bash
pnpm add @fontsource-variable/zalando-sans @fontsource-variable/zalando-sans-expanded
```

Import in `src/main.tsx`:
```ts
import "@fontsource-variable/zalando-sans";
import "@fontsource-variable/zalando-sans-expanded";
```

Vite bundles the font files with the app. Zero external requests.

### CSS Variables Approach

All color changes go through `src/index.css` CSS custom properties. No
hardcoded colors in components. This is already the pattern — we just
update the values.

### Font Variables

Update `--font-sans` in `@theme inline` block to Zalando Sans:
```css
--font-sans: "Zalando Sans Variable", ui-sans-serif, system-ui, sans-serif,
  "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

Add a new `--font-heading` variable for Zalando Sans Expanded:
```css
--font-heading: "Zalando Sans Expanded Variable", ui-sans-serif, system-ui, sans-serif,
  "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

Apply heading font via Tailwind `font-heading` utility on headings, buttons,
badges, and tabs.

### Border Width Strategy (Architect-revised)

Define a custom `--border-width` CSS token (default: `2px`) and apply
via `@layer base` for typical elements. Wall cells and grid elements
explicitly use `border` (1px) to preserve density. Accent elements (active
tab indicators, progress bars) use 4px.

For shadcn/ui components: replace `border` class with `border-2` in
Tier 1 component files (~15 files). This is explicit and reviewable.

### Radius Zero (Architect-revised)

Set `--radius: 0` and **explicitly override** all derived radius values.
Do NOT rely on `calc()` — `--radius-xl: calc(0 + 4px)` = 4px, which
breaks the "all square" rule. Override all five values to 0 explicitly.

---

## 8. Out of Scope

| Feature | Reason |
|---------|--------|
| UX/layout changes | Pure visual update — no page structure changes |
| New navigation | Separate feature |
| Logo/brand identity design | Completed — see `docs/brand/visual-identity.md` |
| Landing page styling | Task 10.9, will inherit this design language |
| Animations/transitions | Not in scope for MVP redesign |

---

## 9. Open Questions

All questions from v1.0 have been resolved through the brand book process:

| # | Question | Resolution |
|---|----------|------------|
| 1 | Exact brand green oklch value | **Resolved:** `oklch(0.70 0.19 160)` — same in both modes. Confirmed in brand book. |
| 2 | Font pair confirmed? | **Resolved:** Zalando Sans (body) + Zalando Sans Expanded (headings). Replaces the originally proposed Space Grotesk + DM Sans. Both SIL OFL, self-hosted via @fontsource-variable. |
| 3 | Brand icon — which one? | **Resolved:** Scoped G SVG mark (brackets + G) for logo, Grid G (G only) for favicon. Files in `docs/brand/logo/final-*.svg`. Truck/Container/Flower2 not used. |
| 4 | Should `--warning` and `--info` tokens be added? | **Resolved:** Yes. Warning `oklch(0.75 0.15 80)` (amber), Info `oklch(0.58 0.16 250)` (blue). Completes functional color system. |
| 5 | Border width — exactly 2px or 3px for Tier 1? | **Resolved:** 2px for Tier 1, 1px for Tier 2, 4px for Tier 3 (accent). Three tiers defined in brand book. |
