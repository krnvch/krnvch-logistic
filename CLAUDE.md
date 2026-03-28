# Grida (formerly krnvchLogistic)

Logistics management web application.
**Brand name**: Grida. **Tagline**: "The grid sees everything."

## Tech Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Build**: Vite 7, pnpm
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **UI Components**: shadcn/ui (new-york style, lucide icons)
- **Backend**: Supabase (client in `src/lib/supabase.ts`)
- **Data Fetching**: TanStack React Query
- **Routing**: React Router DOM v7
- **Notifications**: Sonner toasts

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — typecheck + build (`tsc -b && vite build`)
- `pnpm lint` — run ESLint
- `pnpm test` — run unit tests once (Vitest)
- `pnpm test:watch` — run tests in watch mode
- `pnpm format` — run Prettier on src/

## Testing

- **Framework**: Vitest (v4)
- **Test location**: `src/__tests__/`
- **Existing tests**: `get-order-status.test.ts` — 10 tests for `getOrderStatus()` (done/loaded/pending logic)
- **Conventions**: `describe` + `it` blocks, `makeOrder()` helper for test fixtures, import from `@/types`
- Pure functions first — ideal candidates for unit tests (no mocks needed)

## Task Management (Linear)

**Linear is the single source of truth** for all tasks, planning, and progress tracking. `docs/TODO.md` is a pointer only — never add tasks there.

- **Workspace**: [test-uxd](https://linear.app/test-uxd)
- **Team**: Grida (`GRD`)
- **Project**: Learning Roadmap
- **Integration**: Linear MCP server — create, update, search, and close issues directly from Claude Code
- **Language**: All Linear issues, titles, and descriptions MUST be in **English only**
- **Labels**: Category (Testing, CI/CD, Database, UX/UI, Product, Performance, Collaboration, Security, Infrastructure) + Complexity (Easy, Medium, Hard) + Type (Feature, Improvement, Bug)
- **States**: Backlog → Todo → In Progress → Done (+ Canceled, Duplicate)

### Workflow

1. Before starting work, find or create the corresponding Linear issue
2. Move issue to "In Progress" when starting
3. **Post updates as comments** on the Linear issue throughout the work:
   - PRD summary (with link to file in repo) when PRD is written
   - Architecture decisions or scope changes
   - Implementation progress at major milestones
   - Final summary when work is complete
4. Move issue to "Done" when complete
5. Reference the Linear issue ID (e.g., `GRD-52`) in PR descriptions and commits

## Development Workflow

- **Branching**: feature branches (`feature/task-name`) → PR → merge to `main`
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) runs on every PR and push to `main`: lint → test → build
- **Deploy**: Vercel auto-deploys from `main` branch
- **App URL**: `https://app.grida.space` (custom domain on Vercel)
- **Website URL**: `https://grida.space` (placeholder, separate repo `krnvch/grida-website`)
- All CI checks must pass (green) before merging a PR
- **Changelog (MANDATORY)**: `docs/CHANGELOG.md` MUST be updated **in the same commit as the code** — never as a separate commit after merging. This is part of the definition of done for every feature, fix, or behavioral change. Follow semver and [Keep a Changelog](https://keepachangelog.com/) format. If you are about to commit code that adds features, changes behavior, or fixes bugs, and the changelog is not updated — **stop and update it first**.

## Platform Overview

For a high-level guide to how the platform works (entities, data flow, integrations, file map), see [`docs/how-it-works.md`](docs/how-it-works.md). Read this first if you're new to the project.

## Project Structure

```
src/
  App.tsx              — route definitions
  main.tsx             — app entry (providers: QueryClient, BrowserRouter, Toaster)
  components/ui/       — shadcn/ui primitives (button, card, sonner)
  components/          — app-level components
  pages/               — route page components
  hooks/               — custom React hooks
  lib/                 — utilities (supabase client, cn helper, i18n config)
  locales/             — translation files (en.json, ru.json)
  types/               — shared TypeScript types
```

## Conventions

- Path alias: `@/` maps to `src/`
- Prettier: double quotes, semicolons, trailing commas (es5), 80 char width, tailwindcss plugin
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- Environment variables prefixed with `VITE_` (accessed via `import.meta.env`)
- Never commit `.env` files — use `.env.example` as reference

## Internationalization (i18n)

The app is a **multilanguage platform** (English + Russian). All user-facing strings MUST go through the translation system — never hardcode text in components.

### Rules

1. **Never hardcode user-facing strings** in components, pages, or hooks. Use `t("key")` from `react-i18next` (in components) or `i18n.t("key")` from `@/lib/i18n` (in hooks/utilities).
2. **Add keys to both locale files** when creating new UI text: `src/locales/en.json` (English) and `src/locales/ru.json` (Russian).
3. **English is the default and fallback language**. Write English keys first, then add Russian translations.
4. **Key naming convention**: flat, dot-separated namespaces — `{namespace}.{element}.{variant}` (e.g., `orders.status.pending`, `toast.orderCreated`, `common.cancel`).
5. **Use interpolation** for dynamic values: `t("wall.title", { number: 5 })` → "Wall 5" / "Стена 5".
6. **Use correct logistics terminology** for English translations (see glossary in `docs/prd-i18n.md` Section 7). "Рейс" = Shipment (not trip), "Стена" = Wall, "Загружен" = Loaded (not uploaded).
7. **Locale persistence**: `raw_user_meta_data.locale` in Supabase + `localStorage["grida-locale"]`. Same pattern as theme sync.

### Key Files

| File | Purpose |
|------|---------|
| `src/locales/en.json` | English translations (source of truth) |
| `src/locales/ru.json` | Russian translations |
| `src/lib/i18n.ts` | i18next configuration |
| `src/hooks/use-locale-sync.ts` | Locale persistence (Supabase + localStorage) |
| `src/components/language-submenu.tsx` | Language switcher in dropdown menu |

## Brand Governance

The brand book is the source of truth for all visual decisions. Two-directional sync:

### Brand → Code (before any UI work)

Before writing or modifying any UI component, styling, or CSS:

1. **Consult** `docs/brand/visual-identity.md` for exact token values (colors, fonts, borders, radius)
2. **Check** `docs/brand/brand-book.html` for design principles (left-alignment, shape language, voice)
3. **Use oklch values** from visual-identity.md, NOT hex approximations from the brand book HTML
4. **Follow font rules**: Zalando Sans Expanded for headings/buttons/badges/tabs. Zalando Sans for body/labels/inputs/tables.
5. **Follow border tiers**: Tier 1 (2px) for cards, buttons, inputs, dialogs, badges, table rows. Tier 2 (1px) for wall cells, separators. Tier 3 accent (4px) for tab indicators. No shadows on cards.
6. **Follow color rules**: Input focus = foreground color (not green). Tab active text = darker emerald (not bright primary). Badges = ALL CAPS.
7. **Follow component patterns**: Dropdown hover = `bg-muted` (neutral gray, not green accent). Ghost-destructive buttons for delete icons. Status badges: blue = active, gray = completed (green ≠ status). Empty state dashes use `muted-foreground/40`. Header logo = icon-only (no wordmark). User avatar = outline button with User icon + initials.

### Code → Brand (after creating new patterns)

After implementing a new UI pattern, component variant, or design decision NOT covered by the brand book:

1. **Update** `docs/brand/visual-identity.md` with new token values or rules
2. **Update** `docs/brand/brand-book.html` if the change affects visual guidelines (add mockup, swatch, or rule)
3. **Update** `docs/brand/brand-journey.md` with the decision and rationale
4. Never let code drift from the brand book — if you make a visual choice, document it immediately

### Key Brand Files

| File | Purpose | When to read |
|------|---------|-------------|
| `docs/brand/visual-identity.md` | Token values (source of truth for implementation) | Before ANY CSS/styling work |
| `docs/brand/brand-book.html` | Design principles, mockups, do's/don'ts | Before designing new UI patterns |
| `docs/brand/brand-journey.md` | Decision log (why choices were made) | When questioning a design decision |
| `docs/brand/logo/final-*.svg` | Logo SVG assets | When touching logo/favicon/header |

## Team & Agents

The `team/` folder contains agent role definitions for multi-agent collaboration:

- `team/TEAM.md` — team roster and orchestration overview
- `team/agents/` — individual agent personas (15 roles)

| # | Role | File |
|---|------|------|
| 0 | Advanced Project Manager | `team/agents/project-manager.md` |
| 1 | SME — Logistics & Warehousing | `team/agents/sme-logistics.md` |
| 2 | Senior Business Analyst | `team/agents/business-analyst.md` |
| 3 | Principal Product Manager | `team/agents/product-manager.md` |
| 4 | Principal Full-Stack Architect | `team/agents/fullstack-architect.md` |
| 5 | Principal UX Researcher | `team/agents/ux-researcher.md` |
| 6 | Principal Product Designer | `team/agents/product-designer.md` |
| 7 | Principal Interaction Designer | `team/agents/interaction-designer.md` |
| 8 | Staff Frontend Engineer — UI | `team/agents/frontend-engineer-1.md` |
| 9 | Staff Frontend Engineer — Data | `team/agents/frontend-engineer-2.md` |
| 10 | Staff Backend Engineer — API | `team/agents/backend-engineer-1.md` |
| 11 | Staff Backend Engineer — Infra | `team/agents/backend-engineer-2.md` |
| 12 | QA Tester | `team/agents/qa-tester.md` |
| 13 | Technical Writer | `team/agents/technical-writer.md` |
| 14 | Staff Security Engineer | `team/agents/security-engineer.md` |
| 15 | Principal Brand Designer — Alfredo | `team/agents/brand-designer.md` |

**Requirements triad**: PM + BA + SME collaborate on all discovery and requirements gathering. **Technical authority**: Full-Stack Architect owns all architectural decisions, schema design, and technical direction. **Security gate**: Security Engineer reviews code for vulnerabilities, secrets exposure, and auth/RLS correctness — invoked after major features, new dependencies, or before releases. The **Project Manager** orchestrates all collaboration. See `team/TEAM.md` for protocols.

### How to Invoke Agents

When working on a task, invoke agents by reading their system prompt from `team/agents/<role>.md` and acting as that agent. You can invoke multiple agents in sequence to simulate team collaboration.

Example: "As the Product Designer, review this filter component and provide feedback."

See `team/TEAM.md` for full collaboration rules, orchestration flow, and decision log format.
