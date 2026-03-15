# Grida — Visual Identity Specification

**Date**: 2026-03-15
**Status**: Approved
**Owner**: Alfredo (Brand Designer)

---

## 1. Typography

### Font Selection

| Role | Font Family | Weights | Source |
|------|------------|---------|--------|
| **Headings** | Zalando Sans Expanded | 600 (SemiBold), 700 (Bold) | @fontsource-variable |
| **Body** | Zalando Sans | 400 (Regular), 500 (Medium) | @fontsource-variable |
| **Monospace** | System mono stack | 400 | Built-in |

### Installation

```bash
pnpm add @fontsource-variable/zalando-sans @fontsource-variable/zalando-sans-expanded
```

### CSS Token Mapping

```css
--font-sans: "Zalando Sans Variable", ui-sans-serif, system-ui, sans-serif,
  "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

--font-heading: "Zalando Sans Expanded Variable", ui-sans-serif, system-ui, sans-serif,
  "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

### Usage Rules

- **h1-h4, card titles, dialog titles, brand name**: `font-heading` + weight 600-700
- **Buttons, badges, tabs**: `font-heading` + weight 500
- **Badges**: ALL CAPS, letter-spacing 1px
- **Labels, body text, inputs, table cells, descriptions**: `font-sans` + weight 400-500
- **Bold body text**: `font-sans` weight 500 (Medium), NOT 700
- **Rule**: Expanded (heading font) is for all "action" and "label" elements. Regular is for "content" elements.

### Rationale

User referenced Zalando Sans directly. Both fonts are open source (SIL OFL 1.1),
available on @fontsource for self-hosting. Same design DNA (geometric sans-serif),
different widths create natural hierarchy without visual friction.

Replaces the original PRD proposal of Space Grotesk + DM Sans.

---

## 2. Color System

All values in OKLCh color space (perceptually uniform, modern CSS).

### 2.1 Brand Color — Emerald Green

**Hue: 160** (locked across all contexts)

| Swatch | Context | Value | Usage |
|--------|---------|-------|-------|
| Primary | Both | `oklch(0.70 0.19 160)` | Buttons, links, active tabs, focus rings |
| Primary fg | Both | `oklch(0.13 0.02 160)` | Dark text on green (both modes) |
| Primary pressed | Both | `oklch(0.55 0.20 160)` | Pressed/hover state (darker) |

### 2.2 Neutrals — Green-Whisper Gray

Neutrals carry a subtle green tint (hue 160, chroma 0.005-0.02) for brand coherence.

#### Light Mode

| Token | Value | Role |
|-------|-------|------|
| `--background` | `oklch(0.985 0 0)` | Page background |
| `--foreground` | `oklch(0.13 0.01 160)` | Primary text |
| `--card` | `oklch(1 0 0)` | Card surfaces |
| `--card-foreground` | `oklch(0.13 0.01 160)` | Card text |
| `--popover` | `oklch(1 0 0)` | Popover/dropdown surfaces |
| `--popover-foreground` | `oklch(0.13 0.01 160)` | Popover text |
| `--secondary` | `oklch(0.94 0.02 160)` | Secondary button bg |
| `--secondary-foreground` | `oklch(0.18 0.02 160)` | Secondary button text |
| `--muted` | `oklch(0.94 0.005 100)` | Disabled / subtle areas |
| `--muted-foreground` | `oklch(0.46 0.01 160)` | Secondary / disabled text |
| `--accent` | `oklch(0.92 0.03 160)` | Hover backgrounds |
| `--accent-foreground` | `oklch(0.18 0.02 160)` | Accent text |
| `--border` | `oklch(0.87 0.01 160)` | All borders |
| `--input` | `oklch(0.87 0.01 160)` | Input borders |
| `--ring` | `oklch(0.55 0.20 160)` | Focus ring (= pressed/darker emerald) |
| `--input-focus` | `oklch(0.13 0.01 160)` | Input focus border (foreground, NOT green) |

#### Dark Mode

| Token | Value | Role |
|-------|-------|------|
| `--background` | `oklch(0.13 0.01 160)` | Page background |
| `--foreground` | `oklch(0.96 0.005 160)` | Primary text |
| `--card` | `oklch(0.17 0.01 160)` | Card surfaces |
| `--card-foreground` | `oklch(0.96 0.005 160)` | Card text |
| `--popover` | `oklch(0.17 0.01 160)` | Popover surfaces |
| `--popover-foreground` | `oklch(0.96 0.005 160)` | Popover text |
| `--secondary` | `oklch(0.22 0.02 160)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.96 0 0)` | Secondary text |
| `--muted` | `oklch(0.22 0.01 160)` | Disabled areas |
| `--muted-foreground` | `oklch(0.62 0.01 160)` | Secondary text |
| `--accent` | `oklch(0.22 0.03 160)` | Hover backgrounds |
| `--accent-foreground` | `oklch(0.96 0 0)` | Accent text |
| `--border` | `oklch(0.27 0.02 160)` | All borders |
| `--input` | `oklch(0.27 0.02 160)` | Input borders |
| `--ring` | `oklch(0.70 0.19 160)` | Focus ring (= primary) |
| `--input-focus` | `oklch(0.96 0.005 160)` | Input focus border (foreground, NOT green) |

**Tab color rule**: Tab text uses dedicated tokens, NOT the bright primary.
Active tab text uses the darker pressed emerald for readability; the bright primary
is only used for the active underline indicator.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--tab-active` | `oklch(0.55 0.20 160)` | `oklch(0.70 0.19 160)` | Active tab text (darker emerald) |
| `--tab-active-indicator` | `oklch(0.70 0.19 160)` | `oklch(0.70 0.19 160)` | Active underline (bright primary) |
| `--tab-inactive` | `oklch(0.38 0.04 160)` | `oklch(0.55 0.03 160)` | Inactive tab text (muted dark) |

**Input focus rule**: Inputs use foreground color for focus border, not brand green.
Brand green is reserved for buttons, links, and active states — not input focus.
Light mode: near-black border on focus. Dark mode: near-white border on focus.

#### Sidebar (both modes)

Sidebar tokens follow the same pattern: slightly shifted from main background
for visual separation. Values derived from card/secondary tokens.

### 2.3 Functional Colors

**Rule**: Brand emerald (hue 160) must be visually distinguishable from success
(hue 192, teal) at a glance. Different hue, not just lightness.

| Token | Light Mode | Dark Mode | Hue |
|-------|-----------|-----------|-----|
| `--success` | `oklch(0.62 0.12 192)` | `oklch(0.58 0.10 192)` | 192 (teal) |
| `--success-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0 0)` | — |
| `--destructive` | `oklch(0.55 0.22 27)` | `oklch(0.40 0.15 27)` | 27 (red) |
| `--destructive-foreground` | `oklch(0.55 0.22 27)` | `oklch(0.60 0.19 25)` | — |
| `--warning` | `oklch(0.75 0.15 80)` | `oklch(0.70 0.14 80)` | 80 (amber) |
| `--warning-foreground` | `oklch(0.18 0 0)` | `oklch(0.15 0 0)` | — |
| `--info` | `oklch(0.58 0.16 250)` | `oklch(0.55 0.14 250)` | 250 (blue) |
| `--info-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0 0)` | — |

---

## 3. Shape & Structure

### Border Radius

```css
--radius: 0;
--radius-sm: 0;
--radius-md: 0;
--radius-lg: 0;
--radius-xl: 0;
```

**No exceptions.** All components are square. Grids are squares. Grida is squares.

### Border Width

| Tier | Width | Elements |
|------|-------|----------|
| **Tier 1** | `2px` | Cards, buttons, inputs, dialogs, sheets, badges, alert dialogs, table rows, table header |
| **Tier 2** | `1px` | Wall cells, separators |
| **Tier 3 (Accent)** | `4px` | Active tab indicators, emphasis lines |

> **Updated 2026-03-15:** Table rows promoted from Tier 2 to Tier 1 (2px) for visual consistency with the table's outer border.

### Progress Bar

Progress bar height: **6px**. Square-ended (no rounded ends). Brand green indicator.

### Shadows

**No box-shadows on cards.** Flat + bold border approach (InPost style).
Shadow implies softness. Grida is sharp.

Exception: focus ring `box-shadow` for accessibility is preserved.

### Dropdown Hover

Dropdown menu items use **neutral gray** (`bg-muted`) for hover/focus state — NOT the green-tinted `bg-accent`. This keeps menus visually calm. Destructive items use `bg-destructive/10` on hover.

### Empty State Text

Placeholder dashes ("—") in tables and empty fields use `text-muted-foreground/40` — noticeably lighter than real content, signaling absence without visual noise.

### Inline Separators

Counter groups in headers are separated by middle dots (`·`) in `text-muted-foreground/40`. Vertical separators between logo and content use a 1px `bg-border` line.

---

## 4. Design Token Summary (for implementation)

### New tokens to add

| Token | Light | Dark |
|-------|-------|------|
| `--warning` | `oklch(0.75 0.15 80)` | `oklch(0.70 0.14 80)` |
| `--warning-foreground` | `oklch(0.18 0 0)` | `oklch(0.15 0 0)` |
| `--info` | `oklch(0.58 0.16 250)` | `oklch(0.55 0.14 250)` |
| `--info-foreground` | `oklch(0.98 0 0)` | `oklch(0.98 0 0)` |
| `--font-heading` | Zalando Sans Expanded | — |

### Tokens to modify

All existing color tokens (see Section 2 for complete values).
All radius tokens set to 0.
`--font-sans` changed from Inter to Zalando Sans.

### New dependencies

| Package | Purpose |
|---------|---------|
| `@fontsource-variable/zalando-sans` | Body font (self-hosted) |
| `@fontsource-variable/zalando-sans-expanded` | Heading font (self-hosted) |

### Packages to remove

| Package | Reason |
|---------|--------|
| None | Inter was loaded from system / @theme default, not a package |

---

## 5. Component Patterns (added during implementation)

### Button: Ghost-Destructive Variant

A new button variant for destructive icon buttons (e.g. delete trash icons):

- **Default**: red text/icon (`text-destructive`)
- **Hover**: light red background (`bg-destructive/10`), text stays red
- **Dark mode**: uses `destructive-foreground` tokens

Use instead of `variant="ghost" className="text-destructive"` — the old pattern broke on hover (green background replaced red text).

### Status Badge Semantics

| Status | Color | Token | Rationale |
|--------|-------|-------|-----------|
| Active / In Progress | Blue | `bg-info text-info-foreground` | Blue = ongoing activity |
| Completed / Done | Gray | `bg-secondary text-secondary-foreground` | Muted = finished, not attention-worthy |
| Success (loaded) | Teal | `bg-success text-success-foreground` | Teal hue 192 = positive completion |
| Error / Delete | Red | `bg-destructive` | Red = danger / destructive |

> Green (`bg-primary`) is reserved for primary actions (buttons, links), NOT status badges. Green badges create false "completed" impression.

### Logo Usage Rules

| Context | Variant | Size |
|---------|---------|------|
| **Login page** | Icon only (no wordmark) + tagline | 48px |
| **App header** | Icon only (no wordmark) | 28px |
| **Marketing / external** | Full lockup (icon + wordmark) | ≥ 32px |

Header uses icon-only because the wordmark competes with page content at small sizes. The brand is recognizable from the Scoped G alone.

### User Avatar Button

Navigation trigger uses an **outline button** with:
- `User` icon (lucide) on the left
- Two-letter initials (first name + last name) from user metadata
- Falls back to first letter of email, then `?`
- Same height as adjacent inputs (`h-9` / 36px)

Replaces the generic hamburger menu icon for personalized navigation.
