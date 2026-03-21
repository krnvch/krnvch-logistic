# PRD — Domain Split + Placeholder Website

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Approved (architect review applied)
**Parent feature**: Task 10.11 in `docs/TODO.md`
**Related**: Task 10.9 (future landing page will replace placeholder)

---

## 1. Overview

### Problem

The Grida app currently lives at `krnvch-logistic.vercel.app` — a technical URL that reveals the old project name and has no brand identity. The domain `grida.space` was purchased through Vercel but is not in use. There is no separation between the marketing surface (public-facing website) and the product (logistics app). This is a problem because:

- The URL doesn't match the brand ("krnvch-logistic" vs "Grida")
- There is no web presence for the brand outside the app itself
- When a real landing page (task 10.9) is needed, there's no infrastructure ready for it
- Sharing the app URL externally looks unprofessional

### Solution

Split `grida.space` into two subdomains following the standard SaaS pattern:

- **`grida.space`** (apex domain) — a minimal placeholder website showing the brand identity. New GitHub repo, new Vercel project.
- **`app.grida.space`** — the existing logistics app, same repo and Vercel project with a custom domain added.

The placeholder is intentionally minimal: logo, tagline, one CTA button, one descriptive line. It is not a "coming soon" page — it's a quiet, confident brand presence that happens to have minimal content.

### Success Criteria

| Metric | Target |
|--------|--------|
| `app.grida.space` serves the logistics app | Works identically to current URL |
| `grida.space` serves the placeholder page | Renders correctly, < 10KB gzipped (excl. font files) |
| Both themes work (light/dark) | Follows OS `prefers-color-scheme` |
| Page load time (placeholder) | < 1 second on 3G |
| Auth/Supabase unaffected by domain change | Login, realtime, all features work |
| Old URL redirects to new | `krnvch-logistic.vercel.app` → `app.grida.space` (after verification period) |

---

## 2. User Flow

There are two separate flows — one for visitors, one for app users.

### Visitor lands on grida.space

```
Visitor → grida.space
  → Sees: logo + tagline + "OPEN GRIDA" button + descriptor
  → Clicks "OPEN GRIDA"
  → Redirected to app.grida.space
  → Sees login page
```

### Existing user with old bookmark

```
User → krnvch-logistic.vercel.app (old URL)
  → 308 permanent redirect → app.grida.space
  → Sees login page (must re-login once, localStorage is origin-scoped)
  → Normal app usage continues
```

---

## 3. Functional Requirements

### Part A: Placeholder Website (grida.space)

#### FR-DS-01: Page Content

The page displays exactly 5 elements, vertically stacked, horizontally and vertically centered:

1. **Full lockup logo** — Scoped G icon (48px) + "Grida" wordmark. This is a marketing/external context, so the full lockup is used per brand rules (not icon-only).
2. **Tagline** — "The grid sees everything." in Zalando Sans 400 italic, muted color.
3. **CTA button** — "OPEN GRIDA" linking to `https://app.grida.space`. Primary emerald button, 2px border, Zalando Sans Expanded 500, uppercase.
4. **Separator** — 48px horizontal line, 1px, muted color at 40% opacity.
5. **Footer note** — "Logistics management platform" in small muted text.

Nothing else. No navigation, no "coming soon", no email signup, no feature list, no social links, no version badge.

#### FR-DS-02: Dark/Light Theme

**Given** a visitor's OS is set to dark mode
**When** they open `grida.space`
**Then** the page renders with dark background (`oklch(0.13 0.01 160)`) and light text

**Given** a visitor's OS is set to light mode
**When** they open `grida.space`
**Then** the page renders with light background (`oklch(0.985 0 0)`) and dark text

Implementation: CSS `@media (prefers-color-scheme: dark)`. No manual toggle — the page follows the OS setting.

#### FR-DS-03: Entrance Animation

**Given** a visitor loads the page
**When** the page renders
**Then** each of the 5 elements fades in with a staggered animation: `opacity: 0 → 1` with 8px upward translate, each delayed by 100ms. Total duration ~600ms.

**Given** a visitor has `prefers-reduced-motion: reduce` enabled
**When** the page renders
**Then** all elements appear instantly, no animation.

Implementation: CSS-only `@keyframes` + `animation-delay`. Zero JavaScript for animation.

#### FR-DS-04: Meta Tags and SEO

- `<title>`: "Grida — The grid sees everything."
- `<meta name="description">`: "Logistics management platform."
- `<meta name="theme-color">`: `#1a2a22` (dark green for mobile browser chrome)
- Open Graph: `og:title`, `og:description`, `og:image` (Scoped G logo as PNG/SVG)
- Favicon: Grid G (`final-favicon-g.svg`)

#### FR-DS-05: Responsive Layout

- Content is centered vertically and horizontally (`min-h-screen`, flexbox center)
- Maximum content width: 400px
- Side padding: 24px (`px-6`) on mobile
- Button minimum tap target: 44px height (WCAG 2.5.5)
- No horizontal scroll at any viewport width

### Part B: App Domain Migration (app.grida.space)

#### FR-DS-06: Custom Domain for App

Add `app.grida.space` as a custom domain to the existing Vercel project (krnvch-logistic). Vercel auto-configures DNS and SSL since it owns the domain zone.

- The app works identically at the new URL
- All existing functionality (login, shipments, realtime, dark mode) is unaffected
- No code changes required in the app itself
- Add `public/robots.txt` with `Disallow: /` to prevent search engines from indexing the authenticated app. This is the right moment — the domain split makes the app discoverable via `app.grida.space`

#### FR-DS-07: Supabase URL Configuration

Update Supabase Dashboard > Authentication > URL Configuration:
- **Site URL**: `https://app.grida.space`
- **Redirect URLs**: add `https://app.grida.space`, keep `http://localhost:5173`

This is preventive — current `signInWithPassword()` auth doesn't use Site URL, but future features (password reset, OAuth, magic links) will.

#### FR-DS-08: Old URL Redirect

**After** verifying `app.grida.space` works correctly for at least 1 day:
- Set `krnvch-logistic.vercel.app` to 308 permanent redirect → `app.grida.space`
- Set `www.grida.space` to 308 permanent redirect → `grida.space`

**Not on day 1.** The redirect is only enabled after verification.

#### FR-DS-09: SEO Files for Placeholder

Add to the placeholder site:
- `public/robots.txt` — allow all crawling (`User-agent: * / Allow: /`) so Google indexes `grida.space`
- `public/sitemap.xml` — one entry (`https://grida.space/`)

---

## 4. Data Model

No new database tables. No changes to existing schema.

The placeholder website is a static page with zero backend. The app domain change does not affect Supabase configuration in code — only the dashboard Site URL setting (FR-DS-07).

**Existing code unchanged:**
```typescript
// src/lib/supabase.ts — no changes needed
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;    // points to xxx.supabase.co
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // project anon key
```

**Known side effect:** Users with active sessions at `krnvch-logistic.vercel.app` will need to re-login at `app.grida.space`. This is because `localStorage` (where Supabase stores the JWT) is origin-scoped. One-time event, no data loss.

---

## 5. UI Layout

### Placeholder Page (grida.space)

```
+--------------------------------------------+
|                                            |
|                                            |
|                                            |
|            [G] Grida                       |   <- Scoped G 48px + wordmark
|       The grid sees everything.            |   <- italic tagline, muted
|                                            |
|           [ OPEN GRIDA ]                   |   <- primary button, emerald
|                                            |
|              --------                      |   <- 48px line, subtle
|                                            |
|     Logistics management platform          |   <- small descriptor, muted
|                                            |
|                                            |
|                                            |
+--------------------------------------------+
```

**Design tokens used:**

| Element | Font | Weight | Color (light) | Color (dark) |
|---------|------|--------|---------------|--------------|
| Logo icon | — | — | `currentColor` (foreground) | `currentColor` (foreground) |
| "Grida" wordmark | Zalando Sans Expanded | 500 | foreground | foreground |
| Tagline | Zalando Sans | 400 italic | muted-foreground | muted-foreground |
| Button text | Zalando Sans Expanded | 500 | primary-foreground (`oklch(0.13 0.02 160)`) | primary-foreground |
| Button bg | — | — | primary (`oklch(0.70 0.19 160)`) | primary |
| Button border | — | — | 2px foreground | 2px foreground |
| Separator | — | — | border at 40% | border at 40% |
| Footer | Zalando Sans | 400 | muted-foreground at 60% | muted-foreground at 60% |
| Page bg | — | — | `oklch(0.985 0 0)` | `oklch(0.13 0.01 160)` |

**Center alignment exception:** The brand default is left-align. This page is center-aligned because there is no data hierarchy to serve — 5 elements and zero information density. The center creates symmetry and presence.

---

## 6. Implementation Notes

### New repo: `krnvch/grida-website`

**Tech stack:** Vite + vanilla TypeScript + Tailwind CSS 4 + @fontsource-variable

Why Vite, not plain HTML:
- Tailwind processing (brand tokens in CSS)
- Font bundling (@fontsource-variable packages)
- Same toolchain as the app repo — familiar build system
- When task 10.9 arrives, easy to add React or migrate

Why not Next.js/Astro:
- Framework overhead for a single static page
- No SSR/SSG needed (no dynamic content)
- Reversal cost is near-zero — migration from a 1-page Vite site takes minutes

**Dependencies (minimal):**
- `vite` + `@tailwindcss/vite` + `tailwindcss`
- `@fontsource-variable/zalando-sans` + `@fontsource-variable/zalando-sans-expanded`
- `typescript`

No React. No router. No state management. No Supabase.

### Font loading strategy

Use `font-display: swap` to prevent invisible text during font loading — text renders immediately in the system fallback, then swaps to Zalando Sans once loaded. Import Latin-only subsets to minimize payload:

```css
@import "@fontsource-variable/zalando-sans/wght.css";           /* Latin subset */
@import "@fontsource-variable/zalando-sans-expanded/wght.css";  /* Latin subset */
```

This directly impacts the "< 1 second on 3G" success criterion — the two variable font files together are ~100-200KB, so swap + subset keeps the page usable before fonts arrive.

### Logo SVG (inline, not component)

Port the SVG from `src/components/grida-logo.tsx` into plain HTML. Use `currentColor` fills so it inherits from the text color (works with both themes). The wordmark is a `<span>` with Zalando Sans Expanded, not an SVG text element.

### Vercel setup (manual, not code)

All domain configuration happens in the Vercel dashboard:
1. **Existing project** (krnvch-logistic): add `app.grida.space` domain
2. **New project** (grida-website): add `grida.space` + `www.grida.space` (redirect)
3. Since Vercel owns the DNS zone, CNAME/A records are auto-configured
4. SSL certificates provisioned automatically

### Security notes (Architect-reviewed)

- **No CORS issues**: Supabase allows any origin for anon key
- **No auth issues**: `signInWithPassword()` calls `xxx.supabase.co` directly, not the app domain
- **No env var changes**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` point to Supabase, not app domain
- **No code changes in the app repo** for the domain migration

---

## 7. Out of Scope

| Feature | Reason |
|---------|--------|
| Full landing page with features/screenshots | That's task 10.9, a separate effort |
| Email signup / waitlist form | Product is live, no waitlist needed |
| Blog or content pages | Placeholder is a single page |
| Analytics on placeholder | Premature — add when landing page (10.9) launches |
| Manual dark/light toggle | OS-driven is sufficient for a 5-element page |
| Canvas/shader/particle animations | Save for login page (task 10.10) |
| CI pipeline for the new repo | Overkill for a static page; add when 10.9 starts |
| Social links in footer | No social presence exists yet; empty links are worse than no links |
| Copyright / legal footer | Premature for a placeholder |
| i18n / multilingual | Single English page; add when 10.9 starts |

---

## 8. Open Questions

| # | Question | Proposed Answer |
|---|----------|----------------|
| 1 | Should the new repo be private or public? | **Private.** It's a placeholder, no value in open-sourcing. Can change later when the real landing page launches. |
| 2 | Should we create an OG image (for social sharing)? | **Yes, minimal.** A simple PNG with the Scoped G + "Grida" on a dark background. Can be generated from the SVG. |
| 3 | Should the old `.vercel.app` URL be redirected immediately? | **No.** Add `app.grida.space` first, verify for 1 day, then enable the 308 redirect. Avoid breaking anything. |
| 4 | Should we add Google Analytics or Plausible? | **No.** Zero visitors expected on a placeholder. Add analytics when the real landing page (10.9) ships. |
| 5 | Should the placeholder mention that Grida is a logistics tool? | **Yes, one line only.** "Logistics management platform" as the footer descriptor. Enough to communicate what it is without over-promising. |
| 6 | Package manager for the new repo? | **pnpm**, same as the app repo. Consistency across projects. |
