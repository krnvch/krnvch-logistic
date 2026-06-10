# Implementation Plan — Mira Order CRUD

**Date**: 2026-06-10
**PRD**: `docs/prd-copilot-order-crud.md` (v1.1, architect approved)
**Branch**: `feature/copilot-order-crud`
**Linear**: GRD-131
**Estimated phases**: 3

---

## Overview

Three new approval tools (`create_order`, `edit_order`, `delete_order`) in
the existing framework-agnostic registry, executed by the unchanged
`processApprovals` loop under the caller's RLS. A new `approvalTier` field
("standard" | "destructive") drives a stricter card for deletion. Interview
mode is pure system prompt. The client gains card data enrichment (React
Query under viewer RLS) and a destructive card variant. No schema changes,
no new dependencies.

---

## Phase 1: Registry tools + Edge Function prompt

**Goal**: all three tools callable and HITL-executable end-to-end via curl.

### Tasks

- [ ] **1.1** Extract `normalizeOrderNumber` into a shared module
  - Move from `mark-order-done.ts`; reuse in all order tools
  - Files: `supabase/functions/_shared/copilot-tools/order-utils.ts` (create),
    `mark-order-done.ts` (modify)
- [ ] **1.2** Add `approvalTier?: "standard" | "destructive"` to `CopilotTool`
  - Default (absent) = "standard" for `requiresApproval` tools
  - Files: `types.ts` (modify)
- [ ] **1.3** `create_order` tool
  - Args per FR-OC-02; validations: normalized duplicate, boxes ≥ 1,
    completed shipment refused; INSERT under caller RLS
  - Files: `create-order.ts` (create), `index.ts` (register)
- [ ] **1.4** `edit_order` tool
  - Fuzzy resolve + ambiguity error; no-op filtering against current row;
    "nothing would change" error; boxes ≥ placed validation (sum placements);
    duplicate check on renumber (excluding self)
  - Result returns `{ order_number, client_name, applied: {field: {from, to}} }`
  - Files: `edit-order.ts` (create), `index.ts`
- [ ] **1.5** `delete_order` tool (`approvalTier: "destructive"`)
  - Fuzzy resolve; DELETE under RLS (placements cascade);
    result `{ order_number, client_name, removed_placements_boxes }`
  - Files: `delete-order.ts` (create), `index.ts`
- [ ] **1.6** System prompt: interview protocol (ask ALL missing required
  fields in ONE message; optional fields only if volunteered; card is the
  confirmation; operator-only honesty)
  - Files: `supabase/functions/copilot/index.ts` (modify)

### Deliverable
Local `functions serve` + curl: create with full args → card → approve →
row inserted; edit no-op → "nothing would change"; delete → row + placements
gone; audit rows for all.

### Acceptance Test
- [ ] Duplicate number on create errors (normalized: "ham 031" vs "HAM-031")
- [ ] Edit `box_count` below placed boxes errors
- [ ] Completed shipment refuses all three
- [ ] Worker JWT never sees the tools (filterByRole)

---

## Phase 2: Client — tiers, cards, enrichment

**Goal**: destructive tier visually and mechanically distinct; cards show
live facts.

### Tasks

- [ ] **2.1** `approval-utils.ts`: add the three tools + tier map;
  `autoApprovable()` hard-excludes destructive tools; type the new summaries
  - Files: `src/components/copilot/approval-utils.ts` (modify)
- [ ] **2.2** Enrichment hook `use-order-brief`
  - `(shipmentId, orderNumber) → { client_name, fields, placedBoxes }` via
    supabase-js + React Query, normalized match client-side
  - Files: `src/hooks/use-order-brief.ts` (create)
- [ ] **2.3** `ApprovalCard`: tier-aware rendering
  - destructive: red border-2 + "DESTRUCTIVE ACTION" caption (`ShieldAlert`),
    Delete (destructive variant) + Cancel, NO split button
  - standard create/edit: muted detail block (create: fields list; edit:
    only real diffs `old → new` against enriched current values)
  - delete: placements warning line when `placedBoxes > 0`
  - Files: `approval-card.tsx` (modify)
- [ ] **2.4** Permission dropdown: never list destructive tools
  - Files: `composer.tsx` (modify — filter; likely no change needed since
    allow-list can never contain them, verify)
- [ ] **2.5** i18n: `copilot.approval.destructive`, `.delete`, `.cancel`,
  `.placementsWarning`, `.nothingToChange`, summaries + field labels (EN/RU)
  - Files: `src/locales/en.json`, `ru.json`

### Deliverable
Browser: flows A–E from the PRD work; delete card is red with live
placements count; "always allow" absent on delete.

### Acceptance Test
- [ ] "Always allow" on `mark_order_done` does NOT auto-approve `delete_order`
- [ ] Edit card shows only changed fields
- [ ] Card renders (degraded) when enrichment fetch fails

---

## Phase 3: Tests, docs, rollout

### Tasks

- [ ] **3.1** Unit tests: destructive-never-auto-approvable (the critical
  one), tier mapping, diff-rendering helper, summary extraction
  - Files: `src/__tests__/copilot-crud.test.ts` (create)
- [ ] **3.2** Changelog 4.13.0 + brand book (destructive card pattern) +
  action catalog cross-link in `docs/prd-copilot.md`
- [ ] **3.3** Local E2E (curl scenario file), deploy Edge Function, owner
  browser test (flows A–E, voice included), PR

### Deliverable
v4.13.0 PR with owner-tested flows.

---

## Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/_shared/copilot-tools/order-utils.ts` | Create | shared normalizer |
| `supabase/functions/_shared/copilot-tools/create-order.ts` | Create | create tool |
| `supabase/functions/_shared/copilot-tools/edit-order.ts` | Create | edit tool + no-op filter |
| `supabase/functions/_shared/copilot-tools/delete-order.ts` | Create | destructive tool |
| `supabase/functions/_shared/copilot-tools/types.ts` | Modify | `approvalTier` |
| `supabase/functions/_shared/copilot-tools/index.ts` | Modify | register tools |
| `supabase/functions/copilot/index.ts` | Modify | prompt rules |
| `src/components/copilot/approval-utils.ts` | Modify | tools + tiers + auto-allow guard |
| `src/components/copilot/approval-card.tsx` | Modify | tier variants + detail block |
| `src/hooks/use-order-brief.ts` | Create | card enrichment |
| `src/components/copilot/composer.tsx` | Modify | verify destructive filtering |
| `src/locales/en.json` / `ru.json` | Modify | ~14 keys |
| `src/__tests__/copilot-crud.test.ts` | Create | tier + diff tests |
| `docs/CHANGELOG.md` | Modify | 4.13.0 |
| `docs/brand/visual-identity.md` | Modify | destructive card pattern |

## Dependencies

None. Everything rides on ai@5 / supabase-js / TanStack Query already in place.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Model invents field values during interview (hallucinated client names) | Card displays everything before execution; prompt: "never invent values — ask" |
| flash-lite weaker at multi-field extraction | Acceptance flows tested on flash-lite specifically; prompt kept explicit; COPILOT_MODEL switch if needed |
| Voice numbers garbled → wrong order edited | Fuzzy match + ambiguity error + client name on card (SME backstop) |
| Drifted card facts | Execute-time validation contract (PRD §FR-OC-06) |
| Gemini daily quota during testing | Local stack first; prod testing batched |
