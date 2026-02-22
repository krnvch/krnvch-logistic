# Tulip Logistic

Logistics management web application.

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
- `pnpm format` — run Prettier on src/

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

## Team & Agents

The `team/` folder contains agent role definitions for multi-agent collaboration:

- `team/TEAM.md` — team roster and orchestration overview
- `team/agents/` — individual agent personas (13 roles)

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

**Requirements triad**: PM + BA + SME collaborate on all discovery and requirements gathering. **Technical authority**: Full-Stack Architect owns all architectural decisions, schema design, and technical direction. The **Project Manager** orchestrates all collaboration. See `team/TEAM.md` for protocols.

### How to Invoke Agents

When working on a task, invoke agents by reading their system prompt from `team/agents/<role>.md` and acting as that agent. You can invoke multiple agents in sequence to simulate team collaboration.

Example: "As the Product Designer, review this filter component and provide feedback."

See `team/TEAM.md` for full collaboration rules, orchestration flow, and decision log format.
