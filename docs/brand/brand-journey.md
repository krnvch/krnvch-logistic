# Grida — Brand Journey

A running log of all branding decisions, from discovery to final assets.
Updated as we progress through the brand design process.

**Date started**: 2026-03-15
**Participants**: Product Owner (Artem), Brand Designer (Alfredo, agent #15)
**Skills used**: brand-name-generator, brand-architect (pending), svg-logo-designer (pending)

---

## Phase 1: Brand Discovery Interview

**Status**: Done

### What we learned

- **Origin**: Tool to digitally track truck loading for personal + close people use
- **Brand story**: "An island of craft in chaos" — a beautifully designed control center
  in the middle of a loud, dirty, physical warehouse process
- **Character**: Bold startup founder in black turtleneck. Y Combinator energy.
- **Five words**: Stylish, Bold, Vivid, Modern, Clever
- **Anti-archetype**: SAP, Salesforce — soul-crushing enterprise UI. The exact opposite.
- **Premium level**: 5/5 — design-award territory, every pixel intentional
- **Color direction**: Emerald green
- **Font reference**: Zalando Sans (body) + Zalando Sans Expanded (headings)
- **Design language**: Square shapes (radius 0), bold borders, geometric

### Visual references analyzed (9 screenshots)

InPost (4), Firecrawl (1), Supabase (2), UXD (1), Mailgun/Apollo (1)

**Common patterns**: One dominant accent color, square shapes, thick borders, high
contrast, clean whitespace, monochrome base + one punch color.

### Key tension surfaced

Green (Supabase/tech) vs. Yellow (InPost/bold). Owner chose **green** — confident,
tech-forward energy over disruptive/loud energy.

---

## Phase 2: Naming

**Status**: Done
**Decision**: Grida

### Process

Three directions explored:

1. **Direction A — Abstract English Word** (Linear/Notion style):
   Stow, Crate, Dock, Convoy, Vessel, Latch

2. **Direction B — Invented Word** (Figma/Asana style):
   Grida, Staxo, Kubik, Nesto, Haulo, Cargon

3. **Direction C — Cryptic** (MSCHF/RVCA style):
   KRNVCH — rejected (unpronounceable)

Owner chose **Direction B**. Three finalists: Grida, Staxo, Kubik.

### Final comparison

- **Grida** (grid + a): Sharp, precise, Figma energy. Magnetic pronunciation.
- **Staxo** (stack + o): Dynamic, startup energy. Slightly harder to spell.
- **Kubik** (cubic): Geometric perfection. Name IS the design language.

Alfredo recommended Kubik (name embodies the design language).
**Owner picked Grida** — the pronunciation won ("GRI-da" is memorable, vivid, sticks).

### Compromise

Take Kubik's geometric visual rationale (squares, grids, zero radius) and apply it
to Grida. The grid IS the product — the name directly references the trailer wall grid.

### What happens to "krnvch"

Kept as GitHub org / personal signature. Not used as product brand.

**Details**: [naming-decision-log.md](naming-decision-log.md)

---

## Phase 3: Brand Positioning

**Status**: Done

### Personality statement

> Grida is the sharp, confident tool that brings geometric precision to a chaotic physical
> world. It doesn't shout — it commands attention through craft. Every square corner, every
> bold line, every emerald accent says the same thing: *someone cared enough to make this
> beautiful, even here.*

### Brand attributes

| Attribute | Means | Does NOT mean |
|-----------|-------|---------------|
| Bold | Confident, decisive, unapologetic | Not aggressive or overwhelming |
| Precise | Every pixel intentional, grid-aligned | Not rigid or clinical |
| Modern | Tech-forward, YC-era aesthetics | Not trendy for trend's sake |
| Crafted | Attention to detail, designed with care | Not over-decorated |
| Clear | Instantly readable, zero ambiguity | Not minimal to emptiness |

### Archetype

- **Primary**: The Creator — beautiful and functional where nobody expected it
- **Secondary**: The Magician — transforms chaos into order

### Competitive position

Beautiful + Simple-leaning (slightly toward capable/complex — "not a toy").
Owner feedback: reduce level of simpleness slightly. Product has depth.

### Tagline

**"The grid sees everything."**

Chosen over: "Order in every load", "Load with precision", "Craft meets cargo."
Rationale: bold, memorable, slightly mysterious. Positions Grida as an all-seeing
control center.

### Voice

Casual-professional, plain first, warm, confident.

**Details**: [positioning-decision-log.md](positioning-decision-log.md)

---

## Phase 4: Visual Identity

**Status**: Done

### Typography

| Role | Font | Weight |
|------|------|--------|
| Headings | Zalando Sans Expanded | 600-700 |
| Body | Zalando Sans | 400-500 |
| Mono | System mono (unchanged) | 400 |

- Both fonts: open source (SIL OFL), available via @fontsource
- Self-hosted (GDPR, performance, no external requests)
- Owner confirmed after sharing Google Fonts links as reference

### Color — Brand Emerald (hue 160)

| Context | Token | Value |
|---------|-------|-------|
| Light primary | `--primary` | `oklch(0.55 0.20 160)` |
| Light foreground | `--primary-foreground` | `oklch(0.98 0 0)` |
| Dark primary | `--primary` | `oklch(0.70 0.19 160)` |
| Dark foreground | `--primary-foreground` | `oklch(0.13 0.02 160)` |

### Color — Neutrals (green-whisper gray)

All neutrals carry a subtle green tint (hue 160, very low chroma) for brand coherence.

**Light mode**:
- Background: `oklch(0.985 0 0)` (near-white)
- Foreground: `oklch(0.13 0.01 160)` (near-black, green whisper)
- Card: `oklch(1 0 0)` (pure white, lifted from bg)
- Border: `oklch(0.87 0.01 160)` (visible, slight green)
- Muted: `oklch(0.94 0.005 100)` / Muted fg: `oklch(0.46 0.01 160)`
- Secondary: `oklch(0.94 0.02 160)` / Secondary fg: `oklch(0.18 0.02 160)`
- Accent: `oklch(0.92 0.03 160)` / Accent fg: `oklch(0.18 0.02 160)`

**Dark mode**:
- Background: `oklch(0.13 0.01 160)` (deep dark, green hint)
- Foreground: `oklch(0.96 0.005 160)` (near-white)
- Card: `oklch(0.17 0.01 160)` (lifted from bg)
- Border: `oklch(0.27 0.02 160)`
- Muted: `oklch(0.22 0.01 160)` / Muted fg: `oklch(0.62 0.01 160)`
- Secondary: `oklch(0.22 0.02 160)` / Secondary fg: `oklch(0.96 0 0)`
- Accent: `oklch(0.22 0.03 160)` / Accent fg: `oklch(0.96 0 0)`

### Color — Functional

| Token | Light | Dark | Hue | Purpose |
|-------|-------|------|-----|---------|
| Success | `oklch(0.62 0.18 130)` | `oklch(0.58 0.16 130)` | 130 | Loaded/complete |
| Destructive | `oklch(0.55 0.22 27)` | `oklch(0.60 0.19 25)` | 27 | Errors, delete |
| Warning | `oklch(0.75 0.15 80)` | `oklch(0.70 0.14 80)` | 80 | Caution |
| Info | `oklch(0.58 0.16 250)` | `oklch(0.55 0.14 250)` | 250 | Information |

**Critical rule**: Brand emerald (hue 160) ≠ success (hue 130). Different hue, not just lightness.

### Shape & Structure

| Property | Value |
|----------|-------|
| Border radius | `0` on ALL tokens (no exceptions) |
| Tier 1 border | `2px` (cards, buttons, inputs, dialogs, badges) |
| Tier 2 border | `1px` (table rows, grid cells, separators) |
| Shadow | None on cards (flat + bold border, InPost style) |

### The Grida Formula

```
Grida = Emerald Green (oklch hue 160)
      + Zalando Sans Expanded (headings) / Zalando Sans (body)
      + Square everything (radius 0)
      + Bold borders (2px)
      + No shadows (flat + border)
      + Monochrome neutrals with green whisper
      + One accent color, used like a weapon
```

**Details**: [visual-identity.md](visual-identity.md)

---

## Phase 5: Logo Design

**Status**: Done

### Process (4 rounds)

**Round 1** — Three initial concepts:
1. "The Window" (3×3 grid, center empty) — eliminated: too detailed/messy
2. "Grid G" (letter G from bars) — kept
3. "The Signal" (corner brackets) — kept

Owner feedback: keep it simple. No grid icon (too direct). Try merging 2+3.

**Round 2** — Three options: Grid G alone, Signal alone, Scoped G (merged).
Owner feedback: loves Scoped G. Fix proportions — equalize bar weights.

**Round 3** — All bars equalized to 6px. Lockup proportions refined.
Owner chose **Scoped G (Option C)**.

**Round 4** — Final polish:
- Lockup text sized to inner G height, weight reduced to 500
- Favicon variant: G only (no brackets) for browser tabs
- Baseline alignment: translateY(4px) on wordmark

**Final decision: Scoped G** — approved.

### Logo System

| Asset | Usage |
|-------|-------|
| **Scoped G** (brackets + G) | Primary mark, ≥32px |
| **Grid G** (G only) | Favicon, browser tab, <32px |
| **Lockup** | [Scoped G]rida — weight 500, baseline-aligned |

### Specs
- All bars: 6px in 64×64 viewBox (equal weight)
- Light: #00875A / Dark: #3ECF8E
- Lockup font: Zalando Sans Expanded, 500, translateY(4px)

### Files
- Final SVGs: `docs/brand/logo/final-*.svg`
- All round presentations preserved: `presentation*.html`
- Detailed log: [logo-decision-log.md](logo-decision-log.md)

---

## Phase 6: Brand Guidelines (Brand Book)

**Status**: Done (v1.0, with iterative refinements)
**Deliverable**: `docs/brand/brand-book.html`

### Post-delivery refinements (during review):
- All Russian UI text → English (mono-language brand book)
- Input focus border: green → foreground color (new `--input-focus` token)
- Labels: reverted from Expanded back to Regular (body font)
- Badges: ALL CAPS with letter-spacing
- Left-alignment: added as design principle (logo + form on same left edge)
- Success color: lime (hue 130) → teal (hue 192) — modern, premium
- Primary color (light mode): brightened from oklch(0.55) to oklch(0.70) — dark text on green
- Tab tokens: `--tab-active` (darker emerald), `--tab-inactive` (muted dark), `--tab-active-indicator` (bright primary)
- Tier 3 border: 4px for tab indicators, progress bars, emphasis lines
- Tabs font: Zalando Sans Expanded (same as buttons/badges)

### Architect Gate Review (2026-03-15)

Full-Stack Architect reviewed PRD + impl plan against brand book:
- **3 contradictions** (all fixed — doc text errors, actual values were correct)
- **10 gaps** (all resolved — added sidebar tokens task, @theme inline registration,
  lockup spec reference, localStorage rename, placeholder email, badge font-medium,
  progress bar 6px height, favicon/GitHub/Vercel tasks)
- **6 open questions** — all answered by owner:
  1. localStorage rename: YES (reset is fine)
  2. Square avatar: YES
  3. Source of truth: oklch (not hex)
  4. Progress bar: 6px height
  5. Button weight: 500 (not bold/700)
  6. Primary button border: green-on-green (structural consistency)

Interactive HTML brand book covering 9 sections:

1. **Brand Story** — origin, personality statement, 5 attributes
2. **Logo System** — Scoped G, favicon, lockup, clear space, do's/don'ts
3. **Color System** — emerald palette, light/dark neutrals, functional colors with swatches
4. **Typography** — Zalando Sans Expanded + Zalando Sans specimens, type scale, rules
5. **Shape & Structure** — radius 0, border tiers, no shadows
6. **Voice & Tone** — dimensions, copy examples in Russian
7. **Component Expression** — buttons, cards, badges, inputs with live mockups
8. **Mockups** — login screen, dashboard header in brand context
9. **Quick Reference** — one-page summary table of all values

---

## Phase 7: Visual Redesign Implementation + UX Polish

**Date**: 2026-03-15
**Status**: Done
**Branch**: `feature/visual-redesign`

Full implementation of the Grida visual identity across the entire application, followed by a UX polish round with the product owner.

### Implementation (4 phases)

1. **Foundation** — Installed Zalando Sans / Expanded fonts, replaced all CSS tokens (colors, radius, fonts), registered new tokens (warning, info, tab-active, input-focus)
2. **UI Components** — Applied border-2 to all Tier 1 components, font-heading to titles/buttons/badges, removed shadows, badge ALL CAPS, progress bar 6px
3. **App Components** — Created `GridaLogo` component (Scoped G SVG with currentColor), replaced Package icon everywhere, updated wall cells, search popups, native selects
4. **Pages & Polish** — Updated all pages, favicon Grid G, renamed krnvch→Grida everywhere, filter tabs with 4px accent indicators

### UX Polish decisions (owner-driven)

| Decision | Rationale |
|----------|-----------|
| Table row borders → 2px (Tier 1) | Visual consistency with outer table border |
| Dropdown hover → neutral gray (`bg-muted`) | Green-tinted accent felt off in menus |
| New `ghost-destructive` button variant | Delete icons need red hover, not green |
| Active status badge → blue (`bg-info`) | Green implies "done"; blue = in progress |
| Empty state text → `muted-foreground/40` | Dashes should be lighter than real content |
| Header → icon-only logo | Wordmark too busy at small sizes |
| Hamburger menu → user initials button | Personalized navigation (outline button with User icon + initials) |
| Login page → icon + tagline | "The grid sees everything." as brand touchpoint |
| Counter separators → middle dots (`·`) | Cleaner visual rhythm than spacing alone |
| "Новый рейс" button → next to search | Better UX proximity to content area |
| Button/input heights aligned → `h-9` | Visual consistency for adjacent elements |
| Sort icons → single arrow when active | Cleaner than showing both ↑↓ and arrow |
| Native select → shadcn Select | Consistent component library usage |
| Dialog/Sheet X button → ghost Button | Consistent with all other icon buttons |

### Brand book updates

- `visual-identity.md` Section 3: Table rows promoted to Tier 1 (2px)
- `visual-identity.md` Section 5 (new): Component Patterns — ghost-destructive, status semantics, logo usage, avatar button, dropdown hover, empty states, inline separators

---

## Phase 8: Domain Split + Placeholder Website

**Date**: 2026-03-21
**Status**: Done
**PRD**: `docs/prd-domain-split.md`
**Architecture**: AD-06 in `docs/architecture.md`

Split `grida.space` into two domains following the standard SaaS pattern (Figma, Linear, Notion):

- **`grida.space`** — placeholder website (brand presence)
- **`app.grida.space`** — logistics application

### Placeholder design decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mood | "A quiet room, not an empty room" | Confident presence, not a "coming soon" apology |
| Content | 5 elements only (logo, tagline, CTA, separator, descriptor) | Intentional minimalism — landing page (10.9) handles the full story |
| Logo | Full lockup (icon + wordmark) | Marketing context = full lockup per brand rules |
| Animation | CSS-only staggered fade-in | No canvas/shader — save for login page (10.10) |
| Theme | Both (OS-driven, `prefers-color-scheme`) | Ecosystem consistency with the app |
| Alignment | Center | Exception to left-align rule — no data hierarchy to serve |
| CTA text | "OPEN GRIDA" | Brand voice: plain, direct, confident |
| Tech stack | Vite + vanilla TS + Tailwind | Same toolchain, zero framework overhead, easy migration to Next.js/Astro for 10.9 |

### Infrastructure

- New repo: `krnvch/grida-website` (private)
- New Vercel project linked to `grida.space` + `www.grida.space` (redirect)
- Existing app: `app.grida.space` added as custom domain
- `robots.txt`: allow on marketing site, disallow on app
- Supabase Site URL updated to `https://app.grida.space`

---
