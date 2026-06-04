# PRD — Grida Copilot (in-app AI agent)

**Version**: 1.1
**Date**: 2026-06-03
**Status**: Reviewed by Architect — ready for implementation planning
**Linear**: GRD-104 · **Related**: GRD-105 (MCP server), GRD-121 (Langfuse observability)

> **v1.1 changelog** (architect review): tool now wraps a Postgres RPC instead of
> duplicating `getOrderStatus` in Deno (AD-Copilot-01); `shipment_id` read from
> `useLocation()` not `useParams` (App-level mount can't see route params); tool
> params use JSON Schema via `jsonSchema()` not zod (cross-framework reuse with
> MCP, AD-Copilot-03); `maxSteps`/`maxOutputTokens` cap added in Phase 1 as a
> minimal abuse guard, full rate-limiting tracked as debt.

---

## 1. Overview

### Problem

To answer a simple operational question today — "how many orders are still
open on wall 3?", "which urgent orders haven't been loaded yet?", "what's the
fill rate of this shipment?" — an operator has to manually scan the orders
table and the wall grid and count by eye. There is no way to *ask* the app a
question. And every action (mark done, create order) is a multi-click manual
flow. Grida shows the grid; it can't yet *talk* about it.

### Solution

**Grida Copilot** is an in-app chat assistant. A floating button opens a side
drawer where the user types a question in plain language (RU or EN) and gets an
answer grounded in real data — because the assistant calls **tools** that query
the database, rather than guessing. The assistant runs on Google Gemini via the
Vercel AI SDK, executed inside a Supabase Edge Function so the model key never
reaches the browser and every database read respects the user's permissions.

This PRD covers **Phase 1 (Foundation) only**: a single read-only tool, no
persistence, no write actions, no confirmations. It establishes the full
vertical slice — UI → Edge Function → LLM → tool → answer — that later phases
extend. The tool layer is designed framework-agnostic from day one so the MCP
server (GRD-105) can reuse it without a rewrite.

### Success Criteria

| Metric | Target |
|--------|--------|
| User can open the Copilot drawer from anywhere in the app | 1 click (floating button) |
| Ask "how many open orders are on wall 3?" → correct grounded answer | Tool-backed, not hallucinated |
| Model key (Gemini) exposure in browser bundle | Zero (lives only in Edge Function env) |
| Database reads respect the caller's RLS / role | 100% (no service-role bypass for reads) |
| Works in both UI languages | EN + RU |
| New shadcn primitives required | 0 (`Sheet`, `Button`, `ScrollArea`, `Textarea` all exist) |

---

## 2. User Flow

### Happy path (Phase 1)

```
Any page
  │
  ▼
[Floating button ⌥ bottom-right]  ──click──►  Sheet drawer slides in from right
                                                  │
                                                  ▼
                                       Empty chat + input box
                                                  │
                                user types "сколько открытых заказов на стене 3?"
                                                  │
                                                ──send──►
                                                  │
                       Browser POST → /functions/v1/copilot  (with user JWT)
                                                  │
                                                  ▼
                       Edge Function: Gemini decides to call tool
                       get_shipment_overview({ shipment_id })
                                                  │
                       Tool runs Supabase query *as the user* (RLS applies)
                                                  │
                       Result fed back to Gemini → final natural-language answer
                                                  │
                                  ◄──── streamed tokens ────
                                                  │
                                                  ▼
                       Answer appears in drawer, token by token:
                       "На стене 3 сейчас 4 открытых заказа из 7."
```

### Error paths

```
No Gemini key configured   → assistant returns a friendly "I'm not available
                             right now" message; button still opens (graceful no-op,
                             same philosophy as PostHog/Langfuse).

Network / Edge error       → inline error bubble + Sonner toast, input stays
                             editable so the user can retry.

User not on a shipment page → assistant asks which shipment, OR answers only
                             cross-shipment questions (see Open Questions #3).
```

---

## 3. Functional Requirements

Feature abbreviation: **CP** (Copilot).

### FR-CP-01: Floating launcher button

- A circular floating button is fixed at bottom-right (`fixed bottom-4 right-4`),
  visible on every authenticated page, above page content (`z-50`).
- Icon: `Sparkles` (lucide). Brand-compliant: 2px border, radius 0 per brand book
  — **note for designer review**: a circular FAB conflicts with the radius-0 rule;
  see Open Questions #1.
- Hidden on the login page (only mounts when `session` exists).
- Available to **both roles** (operator and worker).

### FR-CP-02: Chat drawer

**Given** the user clicks the floating button
**When** the drawer opens
**Then** a right-side `Sheet` shows: a header ("Grida Copilot" + subtitle), a
scrollable message list, and a fixed input area at the bottom.

- Drawer width: `sm:max-w-md` (~28rem), full-height.
- First-open state shows a short empty-state hint with 2–3 example questions the
  user can tap to prefill the input.
- Closing the drawer (X / overlay click / Esc) **does not** clear the in-memory
  conversation for the current session (see FR-CP-06).

### FR-CP-03: Send a message

**Given** the input contains non-empty text
**When** the user presses Enter (without Shift) or clicks Send
**Then** the message is appended to the list as a "user" bubble, the input
clears, and a request is sent to the Copilot Edge Function with the user's
Supabase access token in the `Authorization` header.

- Shift+Enter inserts a newline (multi-line `Textarea`).
- While a response is streaming, the Send button shows a loading state and
  further sends are disabled.

### FR-CP-04: Streamed assistant response

**Given** the Edge Function is processing
**When** tokens arrive
**Then** an "assistant" bubble fills in progressively (streaming), and a
"Thinking…" indicator shows before the first token.

- Uses the Vercel AI SDK `useChat` hook on the client, pointed at the Edge
  Function URL with auth headers.

### FR-CP-05: One read tool — `get_shipment_overview`

The Phase-1 assistant has exactly **one** tool. It is read-only and runs **as the
calling user** (RLS-respecting client, not service role). The tool itself is a
thin wrapper over a Postgres RPC — all counting logic lives in SQL (see §4,
AD-Copilot-01), so there is **no status logic duplicated in Deno/TS**.

**Tool contract:**

```
name: get_shipment_overview
description: "Returns a numeric snapshot of a shipment: order counts by status,
              urgent-order count, and per-wall open/loaded counts. Use this to
              answer any 'how many …' question about orders, walls, or progress."
parameters (JSON Schema via jsonSchema()):
  { shipment_id: string }   // required; the shipment to inspect
implementation:
  return supabase.rpc("get_shipment_overview", { p_shipment_id: shipment_id })
returns:
  {
    shipment_name: string,
    total_orders: number,
    done_orders: number,
    open_orders: number,
    urgent_open_orders: number,
    walls: Array<{ wall_number: number, open_orders: number, loaded_orders: number }>
  }
allowedRoles: ["operator", "worker"]
```

- The current `shipment_id` is supplied to the model as **context**, parsed from
  `useLocation().pathname` (match `/shipments/:id`) — NOT `useParams`, because
  `<Copilot/>` mounts at the App level above the route tree (AD-Copilot-02 mount
  note). If the path has no shipment id, the assistant asks the user to open a
  shipment first (Open Question #3).
- Order status (`done`/`loaded`/`pending`) is **computed in the RPC**, mirroring
  the client `getOrderStatus` rule (`done` if `is_done`; else `loaded` if placed
  boxes ≥ `box_count`; else `pending`). SQL is the single source of truth; the
  client function and the RPC must be kept in lockstep (one shared test asserts
  parity — see §6).

### FR-CP-06: Conversation lifetime (Phase 1 = in-memory only)

- Messages live in React state for the lifetime of the page session.
- A full page reload clears the conversation.
- **No `chat_threads` / `chat_messages` tables in Phase 1.** Persistent history
  is explicitly deferred to a later phase.

### FR-CP-07: Internationalization

- All Copilot UI chrome (button aria-label, header, placeholder, empty-state
  hints, error messages, "Thinking…") goes through i18next with keys in both
  `en.json` and `ru.json`.
- The **assistant's answers** are generated by Gemini; a system-prompt
  instruction tells it to reply in the user's current UI locale (passed from the
  client).

### FR-CP-08: Graceful absence of model key

- If `GEMINI_API_KEY` is not set in the Edge Function environment, the function
  returns a structured "unavailable" response; the client renders a friendly
  message. The app never crashes and the rest of Grida is unaffected.

---

## 4. Data Model

### Database

**No new tables in Phase 1.** The only schema change is **one new Postgres RPC**
(AD-Copilot-01). The Copilot only *reads* existing tables (`orders`, `shipments`,
`placements`) through this RPC. Conversation state is in-memory on the client.

#### New RPC: `get_shipment_overview(p_shipment_id uuid) → jsonb`

- `SECURITY INVOKER` (default) → runs under the caller's RLS; no privilege
  escalation. A worker calling it sees only what RLS allows.
- Single round-trip: aggregates `orders` + `placements` for the shipment and
  returns the JSON shape in FR-CP-05.
- Status logic in SQL: `done` = `is_done`; `loaded` = not done AND
  `SUM(placements.box_count) >= orders.box_count`; else `pending`. This mirrors
  the client `getOrderStatus` — a parity test guards against drift (§6).
- Reused verbatim by GRD-105's MCP server — no second implementation.
- Migration lives in `supabase/migrations/` and is reversible (`DROP FUNCTION`).

> Deferred (later phases, listed here for architecture awareness, NOT built now):
> `chat_threads`, `chat_messages` (persistent history), `agent_actions` (write
> audit log).

### Existing tables the tool reads (for reference)

```typescript
// orders
{ id, order_number, client_name, box_count, item_count, priority /* "normal"|"urgent" */,
  is_done, done_at, pickup_time, shipment_id, ... }

// shipments
{ id, name, status /* "active"|"completed" */, trailer_walls, boxes_per_wall, ... }

// placements
{ id, order_id, shipment_id, wall_number, box_count, ... }
```

### Tool result type (shared module)

```typescript
// supabase/functions/_shared/copilot-tools/types.ts
export interface CopilotTool<Args = unknown, Result = unknown> {
  name: string;
  description: string;
  // JSON Schema object (NOT zod) → consumed by Vercel AI SDK via jsonSchema()
  // AND by MCP's tool definitions. Single description, two frameworks.
  parameters: Record<string, unknown>;
  allowedRoles: Array<"operator" | "worker">;
  execute(args: Args, ctx: ToolContext): Promise<Result>;
}

export interface ToolContext {
  supabase: SupabaseClient;          // created with the CALLER's JWT → RLS applies
  role: "operator" | "worker";
  userId: string;
  locale: "en" | "ru";
}
```

The registry is a plain array of `CopilotTool`. The Edge Function adapts it to
the Vercel AI SDK `tools` shape; GRD-105's MCP server will adapt the *same*
array to MCP tool definitions. No business logic is duplicated.

---

## 5. UI Layout

### Floating button (collapsed)

```
                                          ┌──────────────────────────┐
                                          │                          │
                                          │        page content      │
                                          │                          │
                                          │                       ╭───╮
                                          │                       │ ✦ │  ← floating button
                                          │                       ╰───╯
                                          └──────────────────────────┘
```

### Drawer (open)

```
                          ┌───────────────────────────────────┐
                          │  ✦  Grida Copilot              [×] │  ← SheetHeader
                          │  The grid, answered.                │
                          ├───────────────────────────────────┤
                          │                                     │
                          │   ┌───────────────────────────┐    │
                          │   │ Try asking:               │    │  ← empty-state hints
                          │   │  • How many open orders?  │    │     (tap to prefill)
                          │   │  • Any urgent unloaded?   │    │
                          │   │  • Fill rate of wall 2?   │    │
                          │   └───────────────────────────┘    │
                          │                                     │
                          │              ┌────────────────────┐│
                          │              │ сколько открытых на ││  ← user bubble (right)
                          │              │ стене 3?           ││
                          │              └────────────────────┘│
                          │   ┌────────────────────────┐       │
                          │   │ ✦ На стене 3 — 4 откры- │       │  ← assistant bubble (left)
                          │   │   тых заказа из 7.      │       │     streams in
                          │   └────────────────────────┘       │
                          │                                     │  ← ScrollArea
                          ├───────────────────────────────────┤
                          │ ┌─────────────────────────┐ ┌────┐ │
                          │ │ Ask about this shipment…│ │ →  │ │  ← Textarea + Send
                          │ └─────────────────────────┘ └────┘ │
                          └───────────────────────────────────┘
```

### shadcn/ui components (all already present)

| Component | Use |
|-----------|-----|
| `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` | drawer shell |
| `Button` | floating launcher + Send |
| `ScrollArea` | message list |
| `Textarea` | multi-line input |
| `Sonner` toast | error surfacing |

Icons (lucide): `Sparkles` (launcher/assistant), `SendHorizontal` (send),
`Loader2` (thinking).

---

## 6. Implementation Notes

### Stack

- **Client**: Vercel AI SDK React bindings — `@ai-sdk/react` (`useChat`). Point
  it at the Edge Function URL; inject the Supabase access token via the `headers`
  option.
- **Edge Function** (`supabase/functions/copilot/index.ts`, Deno): import the
  Vercel AI SDK core (`ai`) and the Google provider (`@ai-sdk/google`) via Deno
  `npm:` specifiers. Use `streamText({ model, tools, messages })` and return
  `result.toDataStreamResponse()`.
- **Model**: `google("gemini-2.5-flash")` (or current Flash id) — cheap, fast,
  solid tool-calling. Key from `Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")`
  (the SDK's expected name — no manual wiring).
- **Abuse guard (Phase 1, AD-Copilot req #4)**: cap each request with `maxSteps`
  (e.g. 5 — bounds tool-call loops) and `maxOutputTokens` in the `streamText`
  call. This bounds the cost of any single request cheaply. A real per-user rate
  limiter is tracked debt for the Hardening phase (see §7).
- **Tool params**: describe `parameters` as a plain JSON Schema object and pass
  it through the AI SDK `jsonSchema()` helper when building the `tools` map. Do
  NOT use zod in tool files — that would block MCP reuse (AD-Copilot-03).

### Auth & RLS (important)

- Deploy the function **with JWT verification** (do NOT use `--no-verify-jwt` —
  unlike the public Telegram/suggestion functions, this is per-user).
- Inside the function, build a Supabase client using the caller's
  `Authorization` header (anon key + `global.headers`). This makes every tool
  query run under the user's RLS policies — no service-role read bypass.
- Derive `role` from the verified user's `user_metadata.role` (default
  `"operator"`), then filter the tool list by `allowedRoles` before handing it
  to Gemini. (Phase 1 has only a read tool allowed for both, but the filtering
  scaffold must exist now.)

### CORS

Mirror `create-suggestion/index.ts`: `ALLOWED_ORIGINS` =
`["https://app.grida.space", "http://localhost:5173"]`, handle `OPTIONS`
preflight, echo allowed origin.

### Framework-agnostic tool registry

- Put tools in `supabase/functions/_shared/copilot-tools/`. Each tool exports the
  `CopilotTool` shape (§4). The Edge Function maps them into the AI SDK `tools`
  object at request time. Keep ZERO Vercel-AI-SDK or MCP imports inside tool
  files — they receive a `ToolContext` and return plain JSON.
- This is the single most important architectural constraint: it's what lets
  GRD-105 reuse the work.

### Mounting

- Add a `<Copilot />` component mounted once in `App.tsx` (inside the
  authenticated tree, after `session` check), NOT per-page, so it persists across
  navigation. Consider `React.lazy` so it doesn't weigh on first paint.
- **Reading the active shipment**: `<Copilot/>` sits ABOVE `<Routes>`, so
  `useParams()` is empty there. Parse the id from `useLocation().pathname`
  (regex/match on `/shipments/:id`) instead. No context/store needed; it updates
  on navigation automatically (AD-Copilot-02).

### Status-logic parity test

- The RPC's status rule must stay in lockstep with the client `getOrderStatus`
  (`src/types/index.ts`). Add a test asserting the same inputs yield the same
  status across both. Since the existing `get-order-status.test.ts` already
  covers the TS side, the new test seeds a few orders/placements and asserts the
  RPC returns matching `open_orders`/`done_orders` counts.

### Gotchas

- React 19 rule (from project memory): no `setState` in `useEffect` — `useChat`
  manages its own state, so this should be fine, but any glue effects must follow
  the rule.
- Streaming responses + Edge Function: confirm the Supabase Edge runtime streams
  `toDataStreamResponse()` correctly (it supports `ReadableStream`).
- Brand: the assistant bubbles/border must follow Tier-1 2px border, radius 0,
  no shadow. Consult `docs/brand/visual-identity.md` before styling.

### i18n keys to add (both `en.json` and `ru.json`)

```
copilot.title              "Grida Copilot"
copilot.subtitle           "The grid, answered." / "Сетка отвечает."
copilot.launcher.aria      "Open Grida Copilot" / "Открыть Grida Copilot"
copilot.placeholder        "Ask about this shipment…" / "Спросите про этот рейс…"
copilot.send               "Send" / "Отправить"
copilot.thinking           "Thinking…" / "Думаю…"
copilot.empty.title        "Try asking:" / "Попробуйте спросить:"
copilot.empty.q1 / q2 / q3 example questions
copilot.error.generic      "Something went wrong. Try again." / "Что-то пошло не так. Повторите."
copilot.error.unavailable  "Copilot is not available right now." / "Copilot сейчас недоступен."
```

---

## 7. Out of Scope (Phase 1)

| Feature | Reason / where it lands |
|---------|-------------------------|
| Write actions (mark done, create/edit/delete orders) | Phase 3–4 (Write safe / destructive) |
| Confirmation UX before actions | Phase 3 (needed only once writes exist) |
| Persistent chat history (`chat_threads`/`chat_messages`) | Later phase; Phase 1 is in-memory |
| Audit log (`agent_actions`) | Later phase, ships with writes |
| Per-user rate limiting | Hardening phase — **tracked debt**. Phase 1 ships a `maxSteps`/`maxOutputTokens` cap as a minimal per-request guard; a real throttle comes later. |
| LLM observability (Langfuse) | GRD-121, Hardening phase |
| MCP server / external clients | GRD-105 (separate epic) |
| Multiple tools / cross-shipment analytics | Phase 2 (Read tools) |
| Provider switching UI / multi-provider | Not planned; Gemini is the chosen default |

---

## 8. Open Questions

| # | Question | Proposed Answer |
|---|----------|-----------------|
| 1 | Circular FAB violates the radius-0 brand rule. | **RESOLVED (owner):** square 2px-border launcher to stay brand-consistent. |
| 2 | Exact Gemini model id? | Start with `gemini-2.5-flash`; cheapest capable Flash with tool-calling. Confirm current id at implementation time. |
| 3 | What if the user isn't on a shipment page (no `shipment_id` in context)? | **RESOLVED (owner):** launcher stays available, but the assistant asks the user to open a shipment first. Cross-shipment tools come in Phase 2. |
| 4 | One combined `get_shipment_overview` tool vs several tiny tools? | One overview tool for Phase 1 — fewer round-trips, simpler, still answers the demo questions. Split later if needed. |
| 5 | Add the AI SDK to the **app** `package.json`, or only as Deno `npm:` imports? | Client needs `@ai-sdk/react` (app dep). Server uses Deno `npm:` specifiers (no app dep). Two separate dependency surfaces. |
| 6 | Secret name. | **RESOLVED:** `GOOGLE_GENERATIVE_AI_API_KEY` (SDK default); document in `.env.example`. |

---

## 9. Architecture Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-Copilot-01 | Overview counts computed by a Postgres RPC (`SECURITY INVOKER`), not in TS/Deno | Single source of truth, RLS-safe, one round-trip, reused verbatim by GRD-105 MCP server. Avoids duplicating `getOrderStatus` in Deno. |
| AD-Copilot-02 | Agent runtime in a Supabase Edge Function with JWT verification; reads run under the caller's JWT, never service-role. `<Copilot/>` mounts at App level and parses `shipment_id` from `useLocation()` | Model key off the client; authorization stays in RLS; App-level mount can't use `useParams`. |
| AD-Copilot-03 | Tool registry describes params as JSON Schema (`jsonSchema()`), not zod | Cross-framework portability — the same tool array feeds both the Vercel AI SDK (Copilot) and MCP (GRD-105). |
| AD-Copilot-04 | Phase 1 abuse guard = `maxSteps`/`maxOutputTokens` cap; full rate limiting is tracked debt | Cheap per-request bound now; real throttle deferred to Hardening without blocking the demo. |

---

## Next step

Architect review **done** (v1.1 folds in all 4 required changes + flags). Next:
the phased implementation plan — see `docs/impl-copilot.md`.
