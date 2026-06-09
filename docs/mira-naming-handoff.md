# Handoff — AI Assistant Renamed to "Mira"

**Date**: 2026-06-04 · **Linear**: GRD-104 · **Status of decision**: FINAL (owner-approved)
**Purpose of this doc**: catch-up brief for a separate agent/chat to apply the rename
across the in-progress Copilot implementation. Read this first, then update the
places listed below.

---

## The decision

The in-app AI assistant (working title "Grida Copilot") is named **Mira**.

- **Etymology**: *mirar* (Spanish/Latin root) = "to see" → direct tie to the brand
  tagline "The grid sees everything." Also the name of a variable star (a watcher
  in the sky).
- **Russian**: «Мира» — a real, warm Russian name; flawless pronunciation.
- **Gender (RU copy)**: feminine — «Мира нашла…», «Мира думает…», «Мира готова».
  Never «нашёл». This is locked.
- **Known trade-off (accepted with eyes open)**: the name is crowded in the AI
  space (eXp Realty Mira, Meltwater Mira, Smartsupp Mira, and notably **PTV Mira**,
  a logistics AI agent launched Jan 2026). Accepted because Mira is an *in-app
  feature*, not a standalone marketed product — users never encounter it via
  search. The name is not ownable/trademarkable; we are fine with that.
- **Process**: 3 naming rounds, ~60 web collision checks. Full story in
  `docs/brand/naming-decision-log.md` (Assistant Naming section) and
  `docs/brand/brand-journey.md` (Phase 9).

## Naming convention (important)

- **"Mira" = user-facing display name only** — UI strings, i18n values, docs
  headlines, the assistant's self-identity in the system prompt.
- **`copilot` stays as the technical slug** — folder names, Edge Function name/URL
  (`supabase/functions/copilot`), the `copilot.*` i18n key namespace, RPC names,
  FR-CP requirement IDs. Renaming infra slugs adds churn with zero user value.
- Optional pairing in headers/marketing-ish copy: "Mira — Grida's assistant".

## Places to update

Implementation status at handoff: PRD v1.1 + impl plan written; Step 1 (RPC
migration) drafted; Steps 2–6 not started. So most updates are doc/spec edits,
not code edits — do them BEFORE Steps 4–5 land.

- [ ] `docs/prd-copilot.md`
  - Title/overview: "Grida Copilot" → "Mira (Grida's in-app AI assistant)";
    keep "(GRD-104)" and FR-CP IDs unchanged.
  - §6 i18n key table — update **values** (keys stay `copilot.*`):
    - `copilot.title` → `"Mira"`
    - `copilot.subtitle` → keep `"The grid, answered."` / `"Сетка отвечает."` (still fits)
    - `copilot.launcher.aria` → `"Open Mira"` / `"Открыть Миру"`
    - `copilot.thinking` → `"Mira is thinking…"` / `"Мира думает…"`
    - `copilot.error.unavailable` → `"Mira is not available right now."` /
      `"Мира сейчас недоступна."`
  - §5 UI mockup: drawer header "Grida Copilot" → "Mira".
- [ ] `docs/impl-copilot.md` — replace "Grida Copilot" mentions; add a note in
  Step 3 that the Edge Function **system prompt** must introduce the assistant as
  Mira ("You are Mira, Grida's assistant…") and use feminine forms in Russian.
- [ ] `src/locales/en.json` + `src/locales/ru.json` — when Step 4 adds the
  `copilot.*` keys, use the Mira values above. RU: feminine verb forms everywhere.
- [ ] `supabase/functions/copilot/index.ts` (Step 3, when built) — system prompt
  identity = Mira; reply locale instruction unchanged.
- [ ] Linear GRD-104 — comment posted with the decision (done 2026-06-04); keep
  referencing Mira in future progress comments.
- [ ] `docs/CHANGELOG.md` — when Phase 1 ships, the entry introduces the feature
  as **Mira** (e.g. "Added Mira — Grida's in-app AI assistant"), same commit as code.
- [ ] `docs/how-it-works.md` — when the feature ships, add Mira to the platform
  overview.

## Out of scope / explicitly not doing

- No renaming of `supabase/functions/copilot/`, `src/components/copilot/`,
  `copilot.*` i18n keys, or `get_shipment_overview` RPC.
- No trademark filing / domain purchase (in-app feature; decision accepted as-is).
- Brand docs already updated — do NOT re-edit `naming-decision-log.md` /
  `brand-journey.md` for this decision.
