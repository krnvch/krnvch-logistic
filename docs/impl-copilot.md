# Implementation Plan — Grida Copilot

**Linear**: GRD-104 · **PRD**: `docs/prd-copilot.md` (v1.1, architect-reviewed)
**Scope of this plan**: **Phase 1 (Foundation)** only — the full vertical slice.
Later phases (Read tools → Write safe → Write destructive → Hardening) are
sketched at the end but NOT broken into tasks yet.

---

## Phase 1 — Foundation (the demo)

Goal: floating button → drawer → ask one question → Gemini calls one read tool →
streamed grounded answer. No writes, no persistence, no confirmations.

Build order is deliberately **back-to-front**: the RPC and Edge Function are the
risky/unknown parts (Deno, streaming, RLS) — prove them first, then the UI is
straightforward.

### Step 1 — Postgres RPC (the data foundation)

| File | What |
|------|------|
| `supabase/migrations/<ts>_copilot_shipment_overview.sql` | `CREATE FUNCTION get_shipment_overview(p_shipment_id uuid) RETURNS jsonb` — `SECURITY INVOKER`. Aggregates orders + placements; status rule mirrors `getOrderStatus`. Returns the §FR-CP-05 JSON shape. Verify `shipment_id` indexes on `orders`/`placements`; add if missing. |

- **Test the RPC manually first** in the Supabase SQL editor against a real
  shipment before wiring anything else. This de-risks the whole chain.
- Acceptance: `select get_shipment_overview('<id>')` returns correct counts; a
  worker session (lower RLS) returns only permitted rows.

### Step 2 — Framework-agnostic tool registry

| File | What |
|------|------|
| `supabase/functions/_shared/copilot-tools/types.ts` | `CopilotTool`, `ToolContext` interfaces (PRD §4). No AI-SDK / MCP imports. |
| `supabase/functions/_shared/copilot-tools/get-shipment-overview.ts` | The one tool: JSON-Schema params `{ shipment_id }`, `allowedRoles: ["operator","worker"]`, `execute()` calls `ctx.supabase.rpc("get_shipment_overview", { p_shipment_id })`. |
| `supabase/functions/_shared/copilot-tools/index.ts` | `export const tools: CopilotTool[] = [getShipmentOverview]` + a `filterByRole(role)` helper. |

- Acceptance: registry is pure data + `execute`; zero framework imports — proves
  MCP can consume it later.

### Step 3 — Copilot Edge Function (the runtime)

| File | What |
|------|------|
| `supabase/functions/copilot/index.ts` | `Deno.serve`. CORS mirroring `create-suggestion`. Verify JWT → build a Supabase client from the caller's `Authorization` header (RLS applies). Read `role` from user metadata, `filterByRole`. Map tools through `jsonSchema()` into the AI SDK `tools` map. `streamText({ model: google("gemini-2.5-flash"), system, messages, tools, maxSteps: 5, maxOutputTokens })`. Return `result.toDataStreamResponse()`. Graceful 200 "unavailable" payload if `GOOGLE_GENERATIVE_AI_API_KEY` is missing. |

- Deps via Deno `npm:` specifiers: `npm:ai`, `npm:@ai-sdk/google`.
- System prompt: who it is, that it must use tools (not guess), reply in the
  passed `locale`, ask the user to open a shipment if no `shipment_id` context.
- **Deploy WITHOUT `--no-verify-jwt`** (this endpoint is per-user).
- Set the secret: `supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY=...`.
- Acceptance: `curl` with a valid user JWT + a "how many open orders" message
  streams a tool-grounded answer. **Confirm the stream isn't buffered** (flag #1).

### Step 4 — Client deps + i18n keys

| File | What |
|------|------|
| `package.json` | `pnpm add @ai-sdk/react ai` (client bindings only). |
| `src/locales/en.json` + `ru.json` | Add the `copilot.*` keys from PRD §6. EN first, then RU. |
| `.env.example` | Document `GOOGLE_GENERATIVE_AI_API_KEY` (Edge Function secret, not a `VITE_` var). |

### Step 5 — Copilot UI

| File | What |
|------|------|
| `src/components/copilot/copilot.tsx` | Top component: square FAB launcher (2px border, radius 0, `Sparkles`) + `Sheet` drawer. `useChat` from `@ai-sdk/react` pointed at the Edge Function URL, with `headers: { Authorization: Bearer <token> }`. Reads `shipment_id` from `useLocation().pathname`. Sends `locale` + `shipment_id` as request body context. |
| `src/components/copilot/message-list.tsx` | `ScrollArea` of user/assistant bubbles (brand: 2px border, no shadow), streaming, "Thinking…" indicator, empty-state with 3 tappable example questions. |
| `src/components/copilot/composer.tsx` | `Textarea` + Send button. Enter sends, Shift+Enter newline, disabled while streaming. |
| `src/App.tsx` | Mount `<Copilot/>` once inside the authenticated tree (`session` present), ideally `React.lazy`. Hidden on login. |

- **Consult `docs/brand/visual-identity.md` before styling** (border tiers,
  radius 0, no shadow, fonts). The square-FAB decision may warrant a documented
  note there afterward (Code → Brand sync).
- Acceptance: click button → drawer → ask in RU and EN → streamed grounded
  answer in both languages.

### Step 6 — Tests, changelog, polish

| File | What |
|------|------|
| `src/__tests__/copilot-overview-parity.test.ts` (or SQL test) | Assert RPC status counts match the client `getOrderStatus` rule for seeded data (PRD §6 parity test). |
| `docs/CHANGELOG.md` | New entry (MANDATORY, same commit as code). Likely `## [4.8.0]` — new feature. |
| `docs/architecture.md` | Add AD-Copilot-01..04 (or reference PRD §9). |
| `docs/brand/visual-identity.md` | Note the square-launcher pattern if it's a new component pattern. |

---

## Definition of Done (Phase 1)

- [ ] RPC deployed + manually verified (operator + worker RLS).
- [ ] Edge Function deployed (JWT-verified), streams a tool-grounded answer.
- [ ] Floating button + drawer work; RU and EN both answer correctly.
- [ ] Model key absent from the client bundle (grep the build output).
- [ ] Graceful behaviour when the key is unset.
- [ ] `pnpm lint` + `pnpm test` + `pnpm build` green; **prod build tested**
      (`pnpm build && pnpm preview`, per project rule — chunk bugs hide in dev).
- [ ] Changelog updated in the same commit.
- [ ] Tested locally by owner before any PR.

---

## Later phases (NOT planned in detail yet)

| Phase | Adds | New infra |
|-------|------|-----------|
| 2 — Read tools | more read tools (cross-shipment, single order lookup, search) | none (more RPCs/queries) |
| 3 — Write safe | `mark_order_done` / undo (idempotent, low-risk) + confirmation UX | `agent_actions` audit table |
| 4 — Write create/destructive | create/edit/delete orders, placements | confirmation gating, RLS write tests |
| 5 — Hardening | persistent history, per-user rate limiting, Langfuse (GRD-121) | `chat_threads`, `chat_messages` |

GRD-105 (MCP server) can begin once the tool registry (Step 2) is stable — it
adapts the **same** `CopilotTool[]` array to MCP, with API-key auth instead of
browser-session JWT.
