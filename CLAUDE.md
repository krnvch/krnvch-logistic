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

## Development Workflow

- **Branching**: feature branches (`feature/task-name`) → PR → merge to `main`
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) runs on every PR and push to `main`: lint → test → build
- **Deploy**: Vercel auto-deploys from `main` branch
- All CI checks must pass (green) before merging a PR
- **Changelog**: After every merge that adds features, changes behavior, or fixes bugs — update `docs/CHANGELOG.md` (Technical Writer agent owns this). Follow semver and [Keep a Changelog](https://keepachangelog.com/) format.

## Project Structure

```
src/
  App.tsx              — route definitions
  main.tsx             — app entry (providers: QueryClient, BrowserRouter, Toaster)
  components/ui/       — shadcn/ui primitives (button, card, sonner)
  components/          — app-level components
  pages/               — route page components
  hooks/               — custom React hooks
  lib/                 — utilities (supabase client, cn helper)
  types/               — shared TypeScript types
```

## Conventions

- Path alias: `@/` maps to `src/`
- Prettier: double quotes, semicolons, trailing commas (es5), 80 char width, tailwindcss plugin
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- Environment variables prefixed with `VITE_` (accessed via `import.meta.env`)
- Never commit `.env` files — use `.env.example` as reference

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
