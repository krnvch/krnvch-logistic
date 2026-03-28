# Implementation Plan — In-App Idea Suggestions

**Date**: 2026-03-28
**PRD**: `docs/prd-in-app-suggestions.md`
**Branch**: `feature/in-app-suggestions`
**Estimated phases**: 3

---

## Overview

A lightweight in-app feedback channel: icon button in the header → dialog with one text field → submit → Supabase Edge Function → Linear API. No database changes, no new dependencies. Three phases: backend (Edge Function), frontend (components + i18n), integration (wiring + analytics).

---

## Phase 1: Backend — Supabase Edge Function

**Goal**: A working Edge Function that creates Linear issues from a JSON payload.

### Tasks

- **1.1** Create Linear project "User Suggestions" via MCP
  - Team: Grida (GRD)
  - Verify project ID for use in the Edge Function
- **1.2** Create Supabase Edge Function `create-suggestion`
  - File: `supabase/functions/create-suggestion/index.ts`
  - Accepts POST with JSON body: `{ text: string, userRole: string, page: string }`
  - Validates: `text` length 10–1000, `userRole` is "operator" | "worker"
  - Extracts title: first sentence (split on `.!?\n`), max 80 chars
  - Builds description: full text + metadata block (role, page, ISO date)
  - Calls Linear GraphQL API (`https://api.linear.app/graphql`) with mutation `issueCreate`
  - Uses `LINEAR_API_KEY` from env secrets + hardcoded project/team IDs
  - Returns `{ success: true }` or `{ success: false, error: string }`
  - CORS headers for `app.grida.space` origin
- **1.3** Add `LINEAR_API_KEY` to Supabase Edge Function secrets
  - Manual step: `supabase secrets set LINEAR_API_KEY=lin_api_...`
  - Document in `.env.example` as a reference

### Deliverable

Edge Function deployed and testable via `curl` or Supabase dashboard.

### Acceptance Test

- POST to Edge Function with valid payload → Linear issue created in "User Suggestions" project
- POST with text < 10 chars → returns validation error
- POST without `LINEAR_API_KEY` configured → returns clear error

---

## Phase 2: Frontend — Components + i18n

**Goal**: Suggestion button and dialog visible in the app, with all strings translated.

### Tasks

- **2.1** Add i18n keys to both locale files
  - File: `src/locales/en.json`
  - File: `src/locales/ru.json`
  - Keys:
    - `suggestion.title` — "Suggest an Idea" / "Предложить идею"
    - `suggestion.reassurance` — "Your suggestion will be reviewed by the team. Only your role is attached for context." / "Ваше предложение будет рассмотрено командой. Для контекста прикрепляется только ваша роль."
    - `suggestion.placeholder` — "Describe your idea or problem..." / "Опишите вашу идею или проблему..."
    - `suggestion.submit` — "Submit" / "Отправить"
    - `suggestion.success` — "Suggestion sent! Thank you." / "Предложение отправлено! Спасибо."
    - `suggestion.error` — "Failed to send suggestion. Please try again." / "Не удалось отправить предложение. Попробуйте ещё раз."
    - `suggestion.minLength` — "Minimum 10 characters" / "Минимум 10 символов"
    - `suggestion.ariaLabel` — "Suggest an idea" / "Предложить идею"
- **2.2** Create `SuggestionDialog` component
  - File: `src/components/suggestion-dialog.tsx`
  - Props: `userRole: string`, `currentPage: string`
  - Internal state: `open` (boolean), `text` (string), `submitting` (boolean)
  - Uses shadcn `Dialog`, `Textarea`, `Button`
  - Character counter: `{text.length} / 1000`
  - Submit button disabled when `text.length < 10` or `submitting`
  - On submit: calls `supabase.functions.invoke("create-suggestion", { body })`, closes dialog on success, shows toast, keeps dialog open on error
  - Trigger: `Button variant="outline"` with `Lightbulb` icon (no label)
  - Aria label: `t("suggestion.ariaLabel")`
- **2.3** Add suggestion button to ShipmentsPage header
  - File: `src/pages/ShipmentsPage.tsx`
  - Place `<SuggestionDialog>` in the `ml-auto flex items-center gap-2` div, before the avatar dropdown
  - Pass `userRole` and `currentPage` props
- **2.4** Add suggestion button to AppLayout header
  - File: `src/components/app-layout.tsx`
  - Same placement: in the right-aligned section, before the avatar dropdown
  - Pass `userRole` and `currentPage` props

### Deliverable

Suggestion button visible in both headers. Dialog opens, validates text, shows character counter. Submit is wired but may not work yet if Edge Function isn't deployed.

### Acceptance Test

- Lightbulb button visible in header on both pages
- Dialog opens with correct title, reassurance text, and placeholder (in current language)
- Submit disabled when text < 10 chars
- Character counter shows correct count
- Cancel closes dialog and clears text
- Switching language updates all dialog strings

---

## Phase 3: Integration + Analytics

**Goal**: End-to-end flow working. PostHog tracking. Linear comment update.

### Tasks

- **3.1** Wire frontend to Edge Function
  - Verify `supabase.functions.invoke()` call works end-to-end
  - Test success path: dialog closes, toast shown, issue appears in Linear
  - Test error path: dialog stays open, error toast shown
- **3.2** Add PostHog tracking
  - File: `src/components/suggestion-dialog.tsx`
  - On successful submit: `track("suggestion_submitted", { role, page, text_length })`
  - On failed submit: `track("suggestion_failed", { role, page, error })`
  - Import `track` from `@/lib/analytics`
- **3.3** Post completion update to Linear issue GRD-71
  - Comment with final summary: what was built, what files were created/modified
  - Move to Done if all acceptance tests pass
- **3.4** Update CHANGELOG
  - Add entry to `docs/CHANGELOG.md` for this feature

### Deliverable

Complete feature working end-to-end. Analytics tracking. Changelog updated.

### Acceptance Test

- Submit a suggestion → issue appears in Linear "User Suggestions" project within 5 seconds
- Issue title is first sentence of text (max 80 chars)
- Issue description contains full text + metadata (role, page, date)
- PostHog shows `suggestion_submitted` event with correct properties
- Both operator and worker roles can submit successfully
- Works in both English and Russian UI

---

## Files to Create / Modify


| File                                            | Action | Purpose                                         |
| ----------------------------------------------- | ------ | ----------------------------------------------- |
| `supabase/functions/create-suggestion/index.ts` | Create | Edge Function: validate + forward to Linear API |
| `src/components/suggestion-dialog.tsx`          | Create | Dialog component with form + submit logic       |
| `src/locales/en.json`                           | Modify | Add `suggestion.`* keys                         |
| `src/locales/ru.json`                           | Modify | Add `suggestion.*` keys                         |
| `src/pages/ShipmentsPage.tsx`                   | Modify | Add suggestion button to header                 |
| `src/components/app-layout.tsx`                 | Modify | Add suggestion button to header                 |
| `docs/CHANGELOG.md`                             | Modify | Add release entry                               |
| `.env.example`                                  | Modify | Add `LINEAR_API_KEY` reference                  |


---

## Dependencies

No new packages. Everything needed is already in the project:

- `lucide-react` (Lightbulb icon)
- `@supabase/supabase-js` (Edge Function invocation)
- shadcn/ui components (Dialog, Textarea, Button)
- `sonner` (toast)
- `react-i18next` (translations)
- `@/lib/analytics` (PostHog tracking)

---

## Risks & Mitigations


| Risk                                                   | Mitigation                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Supabase Edge Functions not set up yet in this project | May need `supabase init` + `supabase functions deploy`. Document the steps.  |
| LINEAR_API_KEY generation                              | Owner needs to create a Linear API key at linear.app/settings/api. Document. |
| Edge Function cold start (1-2s)                        | Dialog closes optimistically — user doesn't wait for the response            |
| Linear API schema changes                              | Pin the GraphQL mutation. Linear's API is stable and versioned.              |


