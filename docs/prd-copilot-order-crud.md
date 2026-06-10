# PRD — Mira Order CRUD (Full Assistant)

**Version**: 1.1
**Date**: 2026-06-10
**Status**: Reviewed (architect approved, 3 pushbacks addressed — see §6a)
**Parent**: GRD-131 · builds on PRD v2 (`docs/prd-copilot.md`) Stage C foundation
**Discovery**: PM + BA + SME interviews, 2026-06-10 (all defaults owner-confirmed)

---

## 1. Overview

### Problem

Mira can answer questions and mark orders done/undone — but the moment a user
asks her to *create*, *edit*, or *delete* an order, she replies "I cannot
create new orders. Please use the Grida app UI." (verbatim from owner
testing). The assistant promise breaks exactly where it matters most: the
"довоз" scenario — a truck is being loaded, a client calls with "add 5 more
boxes", and the dispatcher has a phone in one hand and packing lists in the
other. Voice input (GRD-127) made *asking* effortless; the actions behind the
ask don't exist.

There is also no single source of truth for **what Mira can do**: which
actions exist, who can use them, and how dangerous each one is. The owner
explicitly asked for this catalog as a reviewable artifact.

### Solution

Three new write tools in the existing CopilotTool registry — `create_order`,
`edit_order`, `delete_order` — operator-only, behind the GRD-125 HITL
approval mechanism. Creation supports **interview mode**: when required
fields are missing, Mira asks for all of them in one message; when the user
provides complete details upfront, she proposes the approval card
immediately. Deletion introduces a **destructive approval tier**: a stricter
card with no "always allow" option, ever. An **Action Catalog** section in
this PRD becomes the canonical registry documentation.

### Success Criteria

| Metric | Target |
|--------|--------|
| Create with full details | One user message + one Allow click — faster than opening and filling the 7-field form |
| Accidental deletions | Zero: destructive tier requires explicit per-action confirmation showing client name + placements impact |
| Validation parity | Mira enforces exactly the form's rules (duplicate number, boxes ≥ 1, boxes ≥ placed, completed-shipment read-only) — no new ways to corrupt data |
| Role parity | Worker cannot see or invoke CRUD tools (registry filter), matching UI rights |

---

## 2. User Flow

### Flow A — create with complete details (happy path)

```
User: "создай заказ HAM-031, Эдека Кройцберг, 20 коробок, срочный"
  → Mira parses all required fields (number, client, boxes) + optional (priority)
  → [Approval card: "Create order #HAM-031 · Edeka Kreuzberg · 20 boxes · URGENT"]
  → User: Allow once
  → Edge Function validates (duplicate? boxes ≥ 1? shipment active?) → INSERT under RLS
  → audit row → card collapses to ✓ → Mira: "Заказ HAM-031 создан"
  → [TTS if voice on] → order appears in the table via Realtime
```

### Flow B — create with interview

```
User: "создай новый заказ"
  → Mira: "Для нового заказа мне нужны: номер заказа, имя клиента,
           количество коробок. Назовите их — а если хотите, добавьте
           описание, время забора или приоритет."
  → User: "HAM-032, Блюменгроссхандель Шмидт, 12 коробок"
  → [Approval card] → Allow → created
```

### Flow C — edit

```
User: "поменяй у HAM-014 количество коробок на 8"
  → [Approval card: "Edit order #HAM-014 · Blankeneser Markt
                     box count: 6 → 8"]
  → Allow → validated (≥ placed boxes) → UPDATE → ✓
```

### Flow D — delete (destructive tier)

```
User: "удали HAM-005"
  → [DESTRUCTIVE card (red): "Delete order #HAM-005 · Hotel Vier Jahreszeiten
      ⚠ This will also remove 12 placed boxes from the load map
      [Delete] [Cancel]"]      ← no "Always allow" — it does not exist here
  → Delete → DELETE under RLS → audit → ✕ collapsed "Deleted"
```

### Flow E — abandoned interview

```
User: "создай заказ" → Mira asks for required fields
User: "сколько срочных на стене 5?" → Mira answers the new question
(no interview state machine — chat history IS the memory; if the user
returns with "так вот: HAM-033, Эдека, 10 коробок", the model picks the
creation back up; Mira never nags about the unfinished interview)
```

---

## 3. Functional Requirements

### FR-OC-01: Action Catalog (canonical)

The single source of truth for Mira's abilities. Lives in this PRD; the
registry must stay in sync (a tool not listed here doesn't ship).

| Action | Tool | Roles | Approval tier | Status |
|--------|------|-------|---------------|--------|
| Shipment overview (counts, walls, urgency) | `get_shipment_overview` | operator, worker | none (read) | ✅ live (Stage A) |
| Mark order done | `mark_order_done` | operator, worker | standard | ✅ live (Stage C) |
| Undo done | `undo_done` | operator, worker | standard | ✅ live (Stage C) |
| **Create order** | `create_order` | **operator** | **standard** | this PRD |
| **Edit order** | `edit_order` | **operator** | **standard** | this PRD |
| **Delete order** | `delete_order` | **operator** | **destructive** | this PRD |
| Place boxes on a wall | — | operator | standard | future (catalog only) |
| Create / complete / reopen shipment | — | operator | standard–destructive | future (catalog only) |
| Cancel order (soft, keeps history) | — | operator | standard | future — SME recommendation, system-wide change first |

**Approval tiers**:
- **read** — executes server-side immediately, renders as a chain item.
- **standard** — HITL card: Allow once / Always allow in this session / Reject.
- **destructive** — HITL card, red accent: **Delete / Cancel only**. Never
  auto-allowed: excluded from the per-thread allow-list UI *and* hard-blocked
  from auto-approval in code (defense in depth).

### FR-OC-02: `create_order` tool

- Args: `shipment_id` (uuid), `order_number` (string), `client_name`
  (string), `box_count` (int) — required; `description`, `item_count`,
  `pickup_time`, `priority` (`"normal" | "urgent"`) — optional.
- Server-side validation (authoritative, mirrors the form):
  - **Given** an order number that already exists in the shipment (normalized
    comparison, same fuzzy rule as done/undo) **then** the tool errors with
    "order number already exists" — Mira relays it and asks for another.
  - **Given** `box_count < 1` **then** error.
  - **Given** a completed shipment **then** error ("shipment is read-only").
- Insert under the caller's RLS; `is_done: false`, `done_at: null`,
  `priority` defaults to `"normal"`.

### FR-OC-03: Interview mode (prompt-driven, no state machine)

- **Given** a create request missing one or more required fields **then**
  Mira asks for ALL missing required fields **in a single message** (list,
  not one-by-one ping-pong), and mentions optional fields once without
  insisting.
- **Given** a create request with all required fields **then** Mira proposes
  the approval card immediately — no confirmation chit-chat (the card IS the
  confirmation; existing Stage C rule).
- Optional fields are captured only when the user volunteers them
  («срочный» → `priority: "urgent"`; «заберут в 6 утра» → `pickup_time`).
- Abandoned interview: no special handling (Flow E). No reminders.
- Implementation: system-prompt rules only. The chat history is the state.

### FR-OC-04: `edit_order` tool

- Args: `shipment_id`, `order_number` (fuzzy-matched, ambiguity → error —
  reuses the GRD-127 normalizer), plus a `changes` object with any subset of:
  `order_number`, `client_name`, `box_count`, `description`, `item_count`,
  `pickup_time`, `priority`.
- Validation: new number must not collide (normalized, excluding self);
  `box_count` ≥ 1 **and** ≥ already-placed boxes for this order (form rule);
  completed shipment → read-only error.
- **No-op filtering (architect)**: models routinely echo unchanged fields
  into `changes`. After fetching the current row, the server drops every
  field whose new value equals the current one; if the effective diff is
  empty the tool errors with "nothing would change". The card mirrors this:
  it renders only fields that actually differ from the fetched current
  values — no "boxes: 6 → 6" noise, no phantom edits in the audit log.
- The approval card shows **old → new** for every changed field plus the
  client name (SME requirement: the human cross-check against editing the
  wrong order).

### FR-OC-05: `delete_order` tool (destructive)

- Args: `shipment_id`, `order_number` (fuzzy-matched).
- The destructive card MUST show: order number, **client name**, and — when
  placements exist — "⚠ this also removes N placed boxes from the load map"
  (the UI dialog's warning, same i18n source).
- Buttons: **Delete** (destructive variant) and **Cancel**. No split button.
  No allow-list participation (FR-OC-01 tiers).
- Hard delete, cascading placements — exactly what the UI does today. A soft
  "cancelled" status is explicitly out of scope (§7).

### FR-OC-06: Card data enrichment (client-side)

The model's tool-call args carry only identifiers — the card needs live facts
(current values for edit's old→new, placements count for delete's warning).
The card fetches them **client-side via supabase-js under the viewer's RLS**
(React Query), so the warning reflects the database, not the model's claims.
While loading: skeleton line; on fetch error: card still renders with number
+ args only (decision stays possible).

**Validation timing (architect)**: card data is *informational* and can
drift in a realtime app (boxes placed between render and click). The
contract is therefore: **every validation runs server-side at execute time**
— card-time facts never substitute for execute-time checks. A drifted
placements count on the delete card is acceptable for a single-tenant tool;
the authoritative state is whatever the DB says when Allow is clicked.

### FR-OC-07: Roles

- All three tools: `allowedRoles: ["operator"]`. A worker's model never sees
  them (registry filter); if a worker asks, Mira explains that creating/
  editing/deleting requires an operator (system prompt already covers
  honesty about missing tools).

### FR-OC-08: Audit

- No changes needed: `processApprovals` writes `agent_actions` for every
  decision on any approval tool, including the new three. Args jsonb captures
  the full payload (create fields / changes diff).

---

## 4. Data Model

**No schema changes.** All three tools operate on the existing `orders` table
under the caller's RLS, exactly like the UI:

```typescript
// create_order → INSERT
{ shipment_id, order_number, client_name, box_count,
  description: string | null, item_count: number | null,
  pickup_time: string | null, priority: "normal" | "urgent",
  is_done: false, done_at: null }

// edit_order → UPDATE (subset of)
{ order_number?, client_name?, box_count?, description?,
  item_count?, pickup_time?, priority? }

// delete_order → DELETE (placements cascade per existing FK)
```

Registry type gains one field (AD-Copilot-08 proposed):

```typescript
// supabase/functions/_shared/copilot-tools/types.ts
export interface CopilotTool<Args, Result> {
  // ...existing...
  requiresApproval?: boolean;
  /** "destructive" excludes the tool from any auto-allow path. */
  approvalTier?: "standard" | "destructive";
}
```

---

## 5. UI Layout

### Standard card (create/edit) — existing Stage C pattern + detail block

```
┌──────────────────────────────────────────────┐ ← border-2 warning (amber)
│ ⛨ REQUIRES YOUR APPROVAL                     │
│ Create order #HAM-031 — Edeka Kreuzberg      │
│ ┌──────────────────────────────────────────┐ │
│ │ boxes: 20      priority: URGENT          │ │ ← muted detail block
│ │ pickup: 06:00                            │ │   (edit shows old → new)
│ └──────────────────────────────────────────┘ │
│ [ Allow once |⌄]  Reject                     │
└──────────────────────────────────────────────┘
```

### Destructive card (delete)

```
┌──────────────────────────────────────────────┐ ← border-2 destructive (red)
│ ⚠ DESTRUCTIVE ACTION                         │
│ Delete order #HAM-005 — Hotel Vier           │
│ Jahreszeiten                                 │
│ ⚠ This also removes 12 placed boxes from     │
│   the load map                               │
│ [ Delete ]  Cancel                           │ ← no split button
└──────────────────────────────────────────────┘
```

Components: existing `ApprovalCard` extended (tier prop), `Button`
variant="destructive", React Query for enrichment. No new shadcn primitives.

UI strings (i18n, EN/RU): `copilot.approval.destructive`,
`copilot.approval.delete`, `copilot.approval.cancel`,
`copilot.approval.placementsWarning` («Также уберёт {{count}} размещённых
коробок с карты»), `copilot.approval.summary.create_order/edit_order/
delete_order`, field labels for the detail block.

---

## 6. Implementation Notes

- **Registry**: three new files in `supabase/functions/_shared/copilot-tools/`
  following `mark-order-done.ts` (framework-agnostic, JSON Schema params,
  `requiresApproval: true`; `delete_order` adds `approvalTier: "destructive"`).
  Reuse `normalizeOrderNumber` — export it from a shared module instead of
  copying.
- **Edge Function**: zero structural change — `processApprovals` already
  executes any approval tool. Add system-prompt rules: interview protocol
  (FR-OC-03), "the card is the confirmation", operator-only honesty.
- **Client**: `approval-utils.ts` gets the tool list + tier map (sync with
  registry — same duplication note as Stage C constants); `autoApprovable()`
  must filter destructive tools (hard rule, not just hidden UI); approval
  card branches on tier; permission dropdown never lists destructive tools.
- **Validation duplication**: the form validates client-side; the tools
  validate server-side. Server is authoritative for Mira; do NOT try to
  share code with the form (different runtimes), but keep messages aligned
  with `orders.form.error.*` semantics.
- **Tests**: tier logic (destructive never auto-approvable) is the critical
  client unit test; normalizer reuse; changes-diff rendering helper.

---

## 6a. Architect Review (2026-06-10)

**Approved with three pushbacks, all addressed in v1.1:**

1. **Edit diff noise** — LLMs echo unchanged fields into `changes`,
   producing "6 → 6" cards and phantom audit entries. → Server-side no-op
   filtering + "nothing would change" error (FR-OC-04).
2. **Card-time vs execute-time truth** — client-side enrichment can drift in
   a realtime app. → Explicit contract: cards are informational, ALL
   validations run at execute time (FR-OC-06).
3. **Authorization layer honesty** (technical debt register, not a blocker):
   `allowedRoles` is app-layer enforcement; at the DB level any
   authenticated user can write `orders` — the worker restriction lives in
   the UI and the registry filter, both client/app-side. This predates this
   feature (the UI works the same way) and is acceptable single-tenant, but
   it violates "auth in RLS, not app code". **Debt entry**: move the role
   claim into the JWT (custom access token hook) and add role-aware RLS
   write policies — file as a separate hardening ticket; this PRD must not
   widen the gap (it doesn't: same enforcement point as existing tools).

**Noted, no change required**: Mira's normalized duplicate check is
*stricter* than the form's exact-match check (the form would happily create
"ham-031" next to "HAM-031"). Correct behavior on Mira's side; aligning the
form is a small separate UI fix.

---

## 7. Out of Scope

| Feature | Reason |
|---------|--------|
| Placements via Mira ("поставь 5 коробок на стену 3") | Separate spatial validation domain; catalog-listed as future |
| Shipment lifecycle via Mira (create/complete/reopen) | Lower frequency; needs its own destructive-tier review |
| Soft "cancelled" order status | SME recommendation, but it's a system-wide data-model change (UI, statuses, billing trail) — not a Mira feature |
| Bulk operations ("удали все выполненные") | Multiplies blast radius; revisit after single-order CRUD proves safe |
| Worker access to CRUD | Mirrors UI rights; revisit only if UI rights change |
| Interview state machine / reminders | Chat history is the state (owner-confirmed) |

---

## 8. Open Questions

| # | Question | Proposed Answer |
|---|----------|----------------|
| 1 | Should `create_order` require the user to be ON the shipment page (shipmentId context), like other tools? | Yes — same rule as Stage A: no shipment context → Mira asks to open a shipment first. Keeps "which shipment?" ambiguity impossible. |
| 2 | Does the destructive card need a typed confirmation ("type DELETE")? | No — overkill for a single-tenant tool with audit + client-name display; revisit if accidental deletions ever occur. |
| 3 | What if the model proposes `delete_order` for an order with a typo'd number? | Fuzzy match + ambiguity error already cover it; the card's client-name line is the human backstop. |
| 4 | Speak destructive cards aloud when TTS is on? | The card itself is never voiced (Stage C rule); Mira's accompanying text natural-language-describes the proposal — that IS spoken. No special casing. |
