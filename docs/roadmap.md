# Grida — Learning Roadmap Execution Plan

> Approved 2026-04-04. This document defines the execution order for all backlog tasks in the Learning Roadmap project (Linear).

## Principles

1. **Observability before features** — set up monitoring and tooling first, so every feature built afterward is automatically tracked, tested, and protected
2. **Quick wins after infrastructure** — alternate between infra and fun/visible tasks to maintain motivation
3. **Testing after a batch of features** — build several features, then lock them down with tests before building more
4. **Scale prep last** — infrastructure evolution and big-scope items come after the core product is solid

## Phase A — Observability & Tooling

*Why first: every feature you build afterward gets monitored, tested, and protected automatically.*

| # | Ticket | What | Effort | Code Changes |
|---|--------|------|--------|--------------|
| 1 | GRD-96 | Postman — learn API surface, REST, auth, API discovery & governance | Medium | None |
| 2 | GRD-52 | Sentry — error monitoring | Medium | Small PR (SDK init + error boundary) |
| 3 | GRD-94 | Cloudflare — DNS, CDN, WAF, edge security | Medium | None (config only) |

**Learning chain:** Postman (understand your API) → Sentry (monitor it for errors) → Cloudflare (protect it at the edge). No hard dependencies — this is a learning progression, not a technical one.

## Phase B — Quick Wins

*Why now: 3 infra tasks in a row is the max before it gets tedious. These are easy, design-oriented, and immediately rewarding.*

| # | Ticket | What | Effort |
|---|--------|------|--------|
| 4 | GRD-66 | Login Page Animation (3 concepts already prepared) | Easy |
| 5 | GRD-44 | Online User Indicator | Easy |

## Phase C — Core Features

*Real product functionality. Sentry catches bugs as you build. Cloudflare protects new endpoints.*

| # | Ticket | What | Effort |
|---|--------|------|--------|
| 6 | GRD-59 | User Registration | Medium |
| 7 | GRD-45 | Drag & Drop for Placements | Medium |
| 8 | GRD-63 | View Toggle: Table ↔ Kanban Board | Medium |

## Phase D — Testing & Quality

*You've built several features — now lock them down with tests before building more.*

| # | Ticket | What | Effort |
|---|--------|------|--------|
| 9 | GRD-37 | Component Tests (Testing Library) | Medium |
| 10 | GRD-38 | E2E Tests (Playwright) | Hard |
| 11 | GRD-64 | Platform Security Audit | Medium |

## Phase E — Advanced Integrations

*Deepen understanding of tools already in the stack.*

| # | Ticket | What | Effort |
|---|--------|------|--------|
| 12 | GRD-49 | PostHog Advanced — dashboards, funnels, session replay | Medium |
| 13 | GRD-68 | API Security Testing (Wallarm) | Hard |

## Phase F — Infrastructure Evolution

*Prepare for scale, improve developer experience.*

| # | Ticket | What | Effort |
|---|--------|------|--------|
| 14 | GRD-42 | DB Migration: Audit Log | Medium |
| 15 | GRD-40 | Preview Deployments | Medium |
| 16 | GRD-48 | Feature Flags | Medium |
| 17 | GRD-54 | Conventional Commits + Changelog automation | Medium |
| 18 | GRD-51 | PWA (Progressive Web App) | Medium |

## Phase G — Long-term

*Big scope, needs product thinking first.*

| # | Ticket | What | Effort |
|---|--------|------|--------|
| 19 | GRD-46 | Push Notifications | Medium |
| 20 | GRD-55 | Multi-tenancy (Multiple Companies) | Hard |
| 21 | GRD-65 | Landing Page / Marketing Site | Medium |

## Triage Cleanup

These tickets need attention — duplicates, overlaps, or raw ideas that need refinement:

| Ticket | Verdict | Action |
|--------|---------|--------|
| GRD-88 | Duplicate of GRD-94 (Cloudflare) | Close as Duplicate |
| GRD-89 | Overlaps with GRD-94 (Cloudflare) | Close as Duplicate |
| GRD-87 | Session Replay → belongs in GRD-49 (PostHog Advanced) | Merge into GRD-49, close |
| GRD-84 | Firecrawl — assessed as not relevant for Grida | Close as Canceled |
| GRD-86 | CAPTCHA — valid idea, needs refinement | Keep, refine later |
| GRD-85 | Design skills, MSP builder, Playwright | Keep, refine later |
| GRD-82 | SDD (specification driven development) | Conceptual — fits with Postman/API learning |

## Tool Assessment Summary (2026-04-04)

Reviewed the full Cursor marketplace (~50 tools). Verdict:

**In the stack:** Figma, Linear, Supabase, Vercel, PostHog
**Planned:** Cloudflare (GRD-94), Postman (GRD-96), Sentry (GRD-52)
**Assessed and skipped:** Neon (duplicates Supabase), Firebase (competes with Supabase), all AWS tools (different ecosystem), MongoDB/PlanetScale (wrong DB type), Datadog/Amplitude/Pendo (overlaps PostHog), Render (competes with Vercel), Clerk (overlaps Supabase Auth), Redis/LaunchDarkly/Grafana (overkill for current scale), and 20+ others — not relevant to Grida's stack or learning goals.
