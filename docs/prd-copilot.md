# PRD — Mira, Grida's in-app AI assistant (GRD-104)

**Version**: 2.0
**Date**: 2026-06-09
**Status**: Phase 1 (Foundation) SHIPPED on `feature/copilot-foundation`; v2 scope approved by owner
**Linear**: GRD-104 · **Related**: GRD-105 (MCP server), GRD-121 (Langfuse observability)

> **v2.0 changelog** (owner design review, 2026-06-09): the chat experience is
> reimagined based on the owner's own AI-assistant design system (the "Wally"
> Figma file — see §1a). Two UX changes already shipped during Phase 1 review:
> the launcher moved from a floating FAB to the **global header** (FR-CP-01),
> and the overlay drawer became a **push panel** (FR-CP-02). v2 adds four
> delivery stages: **A** — chat face-lift (markdown, greeting, pills, activity
> chain, disclaimer); **B** — persistent threads & history; **C** — write tools
> with approval cards; **D** — polish (thinking block, feedback, metrics).
> Everything stays on the Vercel AI SDK (owner-confirmed) — every v2 pattern
> maps to a native SDK capability (message parts, HITL tool approval,
> reasoning parts).

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

**Mira** (display name; technical slug stays `copilot` — see
`docs/mira-naming-handoff.md`) is Grida's in-app chat assistant. A header button
opens a right-side push panel where the user types a question in plain language
(RU or EN) and gets an answer grounded in real data — because the assistant
calls **tools** that query the database, rather than guessing. The assistant
runs on Google Gemini via the Vercel AI SDK, executed inside a Supabase Edge
Function so the model key never reaches the browser and every database read
respects the user's permissions.

**Phase 1 (Foundation) is shipped**: one read-only tool, in-memory chat, full
vertical slice UI → Edge Function → LLM → tool → answer. The tool layer is
framework-agnostic so the MCP server (GRD-105) can reuse it without a rewrite.

**v2 of this PRD** layers the owner's chat design system on top (§1a) and
specifies the next delivery stages A–D (§3a).

---

## 1a. Design source & adaptation rules (v2)

The v2 experience adapts the owner's own AI-assistant design system — the
**"Wally — AI Assistant"** Figma file
(`figma.com/design/bsqgrzkpIB2yPVlNpgU8jN`, page "Chat 2"). Wally was designed
for a different product; we adopt its **structure and interaction patterns**,
not its visual skin.

**Adaptation rules (owner-approved 2026-06-09):**

| Wally | Mira | Rule |
|-------|------|------|
| Rounded cards, pills, soft shadows | radius 0, Tier-1 2px borders, no shadows | Grida brand always wins on skin |
| Orange accent | Grida emerald (`--primary`) | brand tokens |
| Animated liquid-gradient chat background | **NOT adopted** — flat background | conflicts with brand DNA ("flat + bold border"); at most a faint green-whisper tint |
| Wally robot mascot | `Rabbit` icon (owner-picked Mira mark, 2026-06-09) | don't block on mascot |
| Token-override auth (HttpOnly cookie exchange) | **NOT adopted** | Grida already has Supabase JWT per user |
| Everything else (header, history, chain, approvals, pills, input) | adopted, restyled | structure yes, skin no |

**Why this is cheap**: every Wally pattern maps 1:1 to a Vercel AI SDK
capability we already stream — assistant markdown = `text` parts; activity
chain = `tool-*` parts (currently filtered out by the renderer); thinking
block = `reasoning` parts; approval cards = the SDK's human-in-the-loop tool
pattern (`tool-*` part in state `input-available` rendered as a card,
answered via `addToolResult`). Only chat history requires new backend
(tables), which was already planned for the Hardening phase.

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

### FR-CP-01: Header launcher button *(v2 — replaces the floating FAB)*

- An outline icon button (`Rabbit`) sits at the **far right of the global
  header**, after the avatar button, on the shipments list and shipment detail
  pages.
- When the panel is open the icon is highlighted (`text-primary`) and
  `aria-pressed` is set; clicking again closes the panel (toggle).
- Hidden on the login page (only mounts when `session` exists).
- Available to **both roles** (operator and worker).
- *History*: v1 specified a floating FAB; the owner moved it to the header
  during Phase 1 review (2026-06-09).

### FR-CP-02: Push panel *(v2 — replaces the overlay drawer)*

**Given** the user clicks the header launcher
**When** the panel opens
**Then** a right-side **push panel** (a flex sibling of the routed page, NOT a
modal overlay) animates in, shrinking the page content to the left. The page
stays fully interactive — no dimming, no focus trap.

- Panel width: 384px (`w-96`) on ≥sm, full-width on mobile. Stage A may widen
  to ~480px to match the Wally reference (Open Question v2-1).
- Panel shell: panel header (FR-CP-14 adds thread controls), scrollable message
  list, fixed input area at the bottom.
- The panel component stays mounted while the app is authenticated, so closing
  it (X / header toggle) **does not** clear the in-memory conversation, and the
  conversation survives route changes (see FR-CP-06).

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

## 3a. v2 Functional Requirements — stages A–D

Stages ship in order. Each stage is independently releasable.

### Stage A — chat face-lift (frontend only, no schema changes)

#### FR-CP-09: Message presentation v2

- **Assistant messages lose the bubble**: rendered as plain text on the panel
  background (Wally pattern) with markdown support — headings, paragraphs,
  bullet lists, inline code (chip-styled: `bg-muted`, monospace, 1px border).
- **User messages keep a bubble**: `bg-secondary`, Tier-1 2px border, radius 0,
  right-aligned, max-width ~85%.
- Markdown renderer: `react-markdown` (or equivalent), styled with brand
  typography (Zalando Sans body; headings use the heading font).
- No raw-HTML rendering (sanitised by default — model output is untrusted).

#### FR-CP-10: Greeting & suggestion pills

- Empty conversation shows: Mira mark, a personalized greeting
  ("Hi {firstName}! How can I assist you?" / «Привет, {firstName}! Чем
  помочь?» — falls back to a non-personalized form when no first name), and a
  "Suggestions" label with up to 3 tappable **pills** (square, 1px border,
  monospace-ish small text) that send the question immediately.
- Suggestions are context-aware: shipment-detail pills reference the current
  shipment; the list page offers cross-shipment questions only when Phase-2
  read tools exist (until then, list-page pills prompt to open a shipment).

#### FR-CP-11: Message actions

- Under each completed assistant message: icon-row **Copy** (copies the
  message's plain text; confirmation via tooltip/toast). Thumbs up/down ship in
  Stage D (FR-CP-17); the row is built to accommodate them.

#### FR-CP-12: Disclaimer

- A fixed caption under the input: "Mira can make mistakes; always verify." /
  «Мира может ошибаться — проверяйте важное.» (`muted-foreground`, xs).

#### FR-CP-13: Activity chain (tool-call visibility)

- Tool-call parts in the assistant stream render as **chain items** above the
  answer text: icon + short past-tense label per tool (e.g. "Looked at the
  shipment overview" / «Посмотрела сводку рейса»), with state transitions:
  `input-streaming/available` → working (animated label), `output-available` →
  done (static), `output-error` → error styling.
- Phase 1 has one tool → flat chain, no nesting. The component API must allow
  the Wally nested/metric variants later without rework (children + right-slot).
- Tool names map to labels via an i18n key per tool (`copilot.chain.<toolName>`).

### Stage B — threads & history (new schema)

#### FR-CP-14: Persistent threads

- Conversations persist across reloads. New tables `chat_threads` and
  `chat_messages` (see §4a) with owner-only RLS.
- Panel header becomes: Mira mark + breadcrumb "**/ {thread title} ⌄**" opening
  a thread switcher (search field; threads grouped Today / Last week / Older;
  current thread checked; delete on hover with confirm) + right cluster:
  **new chat** (+), **close** (×).
- A thread is created lazily on the first user message. Title = first user
  message truncated (~40 chars) for v1 of Stage B; model-generated titles are a
  later nicety (Open Question v2-3).
- Messages are saved server-side by the Edge Function (`onFinish` → insert
  user + assistant messages with full `parts` JSON); the client never writes
  these tables directly.
- Selecting a thread loads its messages (UIMessage[] reconstructed from stored
  parts — chain items and approval cards re-render from history "for free").
- Delete thread = hard delete (cascades to messages). No archive in Stage B.

### Stage C — write tools & approvals

#### FR-CP-15: Write tools with approval cards

- First write tool: `mark_order_done` (+ `undo_done`) — idempotent, low-risk,
  operator + worker (matches existing role rights).
- Write tools ship **without server-side `execute`**: the tool call streams to
  the client and renders as an **approval card** (Wally pattern): caption
  "Requires your approval", human-readable action summary (and a code-style
  detail block when applicable), buttons **Approve** (split-button: "Always
  allow in this session" ⌄ "Allow once") and **Reject**.
- The decision returns via `addToolResult`; the loop continues server-side.
  Approved → the Edge Function executes the action under the caller's RLS and
  records it in `agent_actions` (see §4a). Rejected → the model is told and
  answers accordingly. Card collapses to "✓ Approved" / "✕ Rejected".
- **Per-session auto-allow**: "Always allow in this session" adds the tool to a
  per-thread allow-list (client state). Auto-allowed calls show a collapsed
  pre-approved card. A "Permission settings" icon in the input row opens the
  allow-list (switches to revoke, Wally pattern). The list resets with a new
  thread; nothing is persisted in Stage C.
- Worker role: `mark_order_done`/`undo_done` only; destructive/creative tools
  (later) are operator-only via the existing `allowedRoles` filter.

### Stage D — polish

#### FR-CP-16: Thinking block

- When the model emits reasoning, render a collapsible "Thought for Ns" block
  above the answer (collapsed by default; chevron expands a quoted timeline).
  Gated on Gemini reasoning parts being available via the SDK; degrade to
  nothing when absent.

#### FR-CP-17: Feedback

- Thumbs up/down activate in the FR-CP-11 action row. Votes are analytics
  events (PostHog `copilot_feedback` with thread/message ids + vote) — no DB
  table unless Langfuse (GRD-121) wants them paired with traces.

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

> v2 update: the deferred tables are now specified in §4a (Stage B and C).

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

## 4a. v2 Data Model (Stages B–C)

### Stage B tables

```sql
-- chat_threads: one row per conversation
CREATE TABLE chat_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  shipment_id uuid REFERENCES shipments(id) ON DELETE SET NULL, -- context hint
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- chat_messages: UIMessage parts stored verbatim
CREATE TABLE chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user','assistant')),
  parts      jsonb NOT NULL,          -- AI SDK UIMessage.parts, as-is
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- **RLS**: owner-only on both tables (`user_id = auth.uid()` on threads;
  messages via `EXISTS` against the parent thread). The Edge Function inserts
  with the caller's JWT, so RLS applies to writes too — no service role.
- **Why `parts jsonb` instead of flat text** (AD-Copilot-05): the AI SDK
  UIMessage `parts` array is the lossless representation — text, tool calls
  with inputs/outputs, reasoning, approval states. Storing it verbatim means
  history replay re-renders chain items and approval cards with zero mapping
  code, and new part types need no migration.
- Indexes: `chat_threads (user_id, updated_at DESC)`,
  `chat_messages (thread_id, created_at)`.

### Stage C table

```sql
-- agent_actions: audit log of every write performed by Mira
CREATE TABLE agent_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id   uuid REFERENCES chat_threads(id) ON DELETE SET NULL,
  tool_name   text NOT NULL,
  args        jsonb NOT NULL,
  result      text NOT NULL CHECK (result IN ('approved','rejected','error')),
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

- Insert-only from the Edge Function; readable by the acting user (RLS).
  Every approval decision is recorded, including rejections.
- Per-session tool allow-lists are **client state only** (reset per thread);
  no table.

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
                          │  ✦  Mira                       [×] │  ← SheetHeader
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

Icons (lucide): `Rabbit` (launcher/assistant — Mira mark), `SendHorizontal` (send),
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
copilot.title              "Mira"
copilot.subtitle           "The grid, answered." / "Сетка отвечает."
copilot.launcher.aria      "Open Mira" / "Открыть Миру"
copilot.placeholder        "Ask about this shipment…" / "Спросите про этот рейс…"
copilot.send               "Send" / "Отправить"
copilot.thinking           "Mira is thinking…" / "Мира думает…"
copilot.empty.title        "Try asking:" / "Попробуйте спросить:"
copilot.empty.q1 / q2 / q3 example questions
copilot.error.generic      "Something went wrong. Try again." / "Что-то пошло не так. Повторите."
copilot.error.unavailable  "Mira is not available right now." / "Мира сейчас недоступна."

RU copy rule: Mira is FEMININE in Russian («Мира нашла», «Мира думает»),
never masculine forms. See docs/mira-naming-handoff.md.
```

---

## 7. Out of Scope (v2)

| Feature | Reason / where it lands |
|---------|-------------------------|
| Write actions (mark done) + approval UX | **Stage C** (FR-CP-15) |
| Create/edit/delete orders via Mira | after Stage C, separate review (destructive tier) |
| Persistent chat history | **Stage B** (FR-CP-14) |
| Audit log (`agent_actions`) | **Stage C** (§4a) |
| Animated chat background (Wally liquid gradient) | NOT adopted — brand conflict (§1a) |
| Mira mascot/avatar mark | RESOLVED: `Rabbit` icon picked by owner (2026-06-09) |
| Per-user rate limiting | Hardening — **tracked debt**; `stepCountIs`/`maxOutputTokens` cap holds until then |
| LLM observability (Langfuse) | GRD-121 — natural fit right after Stage C |
| MCP server / external clients | GRD-105 (separate epic) |
| Multiple read tools / cross-shipment analytics | Phase 2 (Read tools) — can land between stages |
| Provider switching UI / multi-provider | Not planned; Gemini is the chosen default |
| Model-generated thread titles | Open Question v2-3; Stage B uses truncated first message |

---

## 8. Open Questions

| # | Question | Proposed Answer |
|---|----------|-----------------|
| 1 | Circular FAB violates the radius-0 brand rule. | **RESOLVED (owner):** square 2px-border launcher to stay brand-consistent. |
| 2 | Exact Gemini model id? | Start with `gemini-2.5-flash`; cheapest capable Flash with tool-calling. Confirm current id at implementation time. |
| 3 | What if the user isn't on a shipment page (no `shipment_id` in context)? | **RESOLVED (owner):** launcher stays available, but the assistant asks the user to open a shipment first. Cross-shipment tools come in Phase 2. |
| 4 | One combined `get_shipment_overview` tool vs several tiny tools? | One overview tool for Phase 1 — fewer round-trips, simpler, still answers the demo questions. Split later if needed. |
| 5 | Add the AI SDK to the **app** `package.json`, or only as Deno `npm:` imports? | Client needs `@ai-sdk/react` (app dep). Server uses Deno `npm:` specifiers (no app dep). Two separate dependency surfaces. **RESOLVED:** both pinned to the same major (v5). |
| 6 | Secret name. | **RESOLVED:** `GOOGLE_GENERATIVE_AI_API_KEY` (SDK default); document in `.env.example`. |

### v2 Open Questions

| # | Question | Proposed Answer |
|---|----------|-----------------|
| v2-1 | Panel width: keep 384px (`w-96`) or widen to ~480px like the Wally reference? | Try 480px in Stage A; owner judges in the browser. |
| v2-2 | Stage A in the current Phase-1 PR or separate? | Same branch/PR — Phase 1 hasn't deployed yet, one review beats two. |
| v2-3 | Thread titles: truncated first message vs model-generated? | Truncate for Stage B (zero cost/latency); revisit with a cheap title prompt later. |
| v2-4 | Greeting personalization source? | `first_name` from `user_metadata` (already used for initials); fallback to plain greeting. |

---

## 9. Architecture Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-Copilot-01 | Overview counts computed by a Postgres RPC (`SECURITY INVOKER`), not in TS/Deno | Single source of truth, RLS-safe, one round-trip, reused verbatim by GRD-105 MCP server. Avoids duplicating `getOrderStatus` in Deno. |
| AD-Copilot-02 | Agent runtime in a Supabase Edge Function with JWT verification; reads run under the caller's JWT, never service-role. `<Copilot/>` mounts at App level and parses `shipment_id` from `useLocation()` | Model key off the client; authorization stays in RLS; App-level mount can't use `useParams`. |
| AD-Copilot-03 | Tool registry describes params as JSON Schema (`jsonSchema()`), not zod | Cross-framework portability — the same tool array feeds both the Vercel AI SDK (Copilot) and MCP (GRD-105). |
| AD-Copilot-04 | Phase 1 abuse guard = `maxSteps`/`maxOutputTokens` cap; full rate limiting is tracked debt | Cheap per-request bound now; real throttle deferred to Hardening without blocking the demo. |
| AD-Copilot-05 | `chat_messages` stores AI SDK `UIMessage.parts` as verbatim `jsonb` | Lossless replay: chain items, approval cards, reasoning re-render from history with no mapping layer; new part types need no migration. |
| AD-Copilot-06 | Write tools use the AI SDK human-in-the-loop pattern (no server `execute`; client renders approval card; decision returns via `addToolResult`) | Native SDK mechanism — no custom protocol; approval state lives in the message parts, so it persists with the thread (AD-Copilot-05). |
| AD-Copilot-07 | Wally design adopted for structure/interaction only; visual skin always follows the Grida brand book; animated background NOT adopted | Brand governance — patterns transfer, skins don't (§1a). |

---

## Next step

v2 approved by owner (2026-06-09). Delivery: Stage A on the current
`feature/copilot-foundation` branch (with prod deploy of Phase 1 + Stage A
together), then B → C → D as separate branches/PRs. Stage breakdown lives in
`docs/impl-copilot.md`.
