# PRD — In-App Idea Suggestions

**Version**: 1.0
**Date**: 2026-03-28
**Status**: Reviewed (architect approved)
**Linear issue**: GRD-71

---

## 1. Overview

### Problem

Grida users (operators and workers) have no structured channel to suggest ideas or report problems from within the app. When someone thinks of an improvement — a better workflow, a missing feature, a confusing screen — the idea gets lost because there's no easy way to capture it in the moment.

### Solution

Add a lightweight, always-visible suggestion button to the app header. One click opens a dialog with a single free-form text field. The user types their idea, hits submit, and gets a confirmation toast. Behind the scenes, the suggestion is created as an issue in a dedicated Linear project ("User Suggestions") — separate from the development backlog. No tracking, no voting, no status updates for the user. Fire and forget.

### Success Criteria

| Metric | Target |
|--------|--------|
| Suggestion button visible on every page | Present in both ShipmentsPage and AppLayout headers |
| Submit creates a Linear issue | Issue appears in "User Suggestions" project with full text + metadata |
| Both roles can submit | Operators and workers see and use the button |
| Bilingual UI | All strings in en.json + ru.json |
| Form validation | 10–1000 characters, clear error feedback |
| Zero disruption | Submit closes dialog + shows toast, user returns to their work |

---

## 2. User Flow

```
User sees 💡 icon button in header (left of avatar button)
  → clicks it
  → Dialog opens:
      - Title: "Suggest an Idea" / "Предложить идею"
      - Reassurance text: "Your suggestion will be reviewed by the team. Only your role is attached for context."
      - Textarea (placeholder: "Describe your idea or problem..." / "Опишите вашу идею или проблему...")
      - Character counter (shows current / 1000)
      - [Cancel] [Submit] buttons
  → types 10–1000 characters
  → clicks Submit
  → Dialog closes immediately
  → Toast: "Suggestion sent! Thank you." / "Предложение отправлено! Спасибо."
  → Linear issue created in background (User Suggestions project)
```

### Error flow

```
User types < 10 characters → Submit button disabled, hint: "Minimum 10 characters"
User types > 1000 characters → Textarea stops accepting input, counter turns red
API call fails → Toast: "Failed to send suggestion. Please try again." (dialog stays open)
```

---

## 3. Functional Requirements

### FR-IS-01: Suggestion Button in Header

The header displays an icon-only button to the left of the avatar/user dropdown button.

- Icon: `Lightbulb` from lucide-react (represents ideas)
- Variant: `outline` (matches avatar button style)
- Size: same as avatar button
- Visible to all authenticated users (operator + worker)
- Present in both headers: `ShipmentsPage` and `AppLayout`

### FR-IS-02: Suggestion Dialog

**Given** the user clicks the suggestion button
**When** the dialog opens
**Then** it displays:
- Title: `t("suggestion.title")` — "Got an idea? We're all ears!" / "Есть идея? Мы слушаем!"
- Reassurance text: `t("suggestion.reassurance")` — "Big or small, we'd love to hear it. No names attached — just your role for context." / "Большая или маленькая — расскажите. Без имён, только роль для контекста."
- Textarea with placeholder: `t("suggestion.placeholder")` — "What would make your day easier?" / "Что бы упростило вам работу?"
- Character counter: `{current} / 1000`
- Cancel button: closes dialog, clears text
- Submit button: disabled when text < 10 chars

### FR-IS-03: Form Validation

| Rule | Behavior |
|------|----------|
| Min length: 10 chars | Submit button disabled, helper text shown |
| Max length: 1000 chars | `maxLength` attribute on textarea |
| Empty submit | Impossible (button disabled) |

### FR-IS-04: Submit to Linear

**Given** the user clicks Submit with valid text (10–1000 chars)
**When** the API call is made
**Then**:
1. Dialog closes immediately (optimistic)
2. A Linear issue is created via Supabase Edge Function:
   - **Project**: "User Suggestions" (dedicated Linear project)
   - **Team**: Grida (GRD)
   - **Title**: First sentence of the text (truncated to 80 chars if needed)
   - **Description**: Full user text + metadata block:
     ```
     ---
     Role: {role}
     Page: {current_route}
     Date: {ISO timestamp}
     ```
   - **State**: Backlog
   - **No assignee, no labels**
3. Toast shown: `t("suggestion.success")`

### FR-IS-05: Error Handling

**Given** the Linear API call fails
**When** the error is caught
**Then**:
- Dialog stays open (so user doesn't lose their text)
- Toast: `t("suggestion.error")`
- User can retry

### FR-IS-06: Cooldown

After a successful submission, the suggestion button shows a brief visual indicator (e.g., checkmark icon for 3 seconds) and returns to normal. No hard cooldown — closing the dialog after submit is sufficient to prevent spam.

---

## 4. Data Model

### No database changes

Suggestions are stored in Linear, not in Supabase. No new tables or columns needed.

### API Integration

The app needs to communicate with Linear's API to create issues. This requires a server-side component because the Linear API key must not be exposed to the browser.

**Approach**: Supabase Edge Function (`create-suggestion`) that:
1. Receives: `{ text: string, userRole: string, page: string }`
2. Extracts title from text (first sentence, max 80 chars)
3. Calls Linear GraphQL API to create an issue
4. Returns: `{ success: boolean, error?: string }`

**Environment variable**: `LINEAR_API_KEY` (stored in Supabase Edge Function secrets, never exposed to client)

### Linear Project Setup (one-time, manual or via MCP)

- **Project name**: "User Suggestions"
- **Team**: Grida (GRD)
- **States**: Backlog → Triage → (transfer to Learning Roadmap if accepted)

---

## 5. UI Layout

### Header (both ShipmentsPage and AppLayout)

```
┌─────────────────────────────────────────────────────┐
│ [Logo]  ...existing content...    [💡] [👤 AB]      │
│                                    ↑      ↑         │
│                              suggestion  avatar     │
│                               button    dropdown    │
└─────────────────────────────────────────────────────┘
```

### Suggestion Dialog

```
┌──────────────────────────────────────┐
│  Suggest an Idea                  ✕  │
│                                      │
│  We only care about your idea —      │
│  no personal data is collected.      │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Describe your idea or        │    │
│  │ problem...                   │    │
│  │                              │    │
│  │                              │    │
│  │                              │    │
│  └──────────────────────────────┘    │
│                          42 / 1000   │
│                                      │
│              [Cancel]  [Submit]       │
└──────────────────────────────────────┘
```

### Components used (shadcn/ui)

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
- `Button` (outline for trigger, default for Submit, secondary for Cancel)
- `Textarea`
- Existing `Toaster` (sonner)

---

## 6. Implementation Notes

### Linear API Integration

The Linear MCP is available in the dev environment (Claude Code), but **not at runtime** in the deployed app. The deployed app needs its own way to create Linear issues. Two options:

**Option A — Supabase Edge Function** (recommended):
- Create `supabase/functions/create-suggestion/index.ts`
- Uses Linear's GraphQL API directly (`https://api.linear.app/graphql`)
- Requires `LINEAR_API_KEY` in Edge Function secrets
- Client calls via `supabase.functions.invoke("create-suggestion", { body: payload })`

**Option B — Direct API call from client** (not recommended):
- Would expose the Linear API key to the browser
- Security risk — rejected

### Key implementation details

1. **Shared component**: Create `src/components/suggestion-dialog.tsx` — used in both headers
2. **Trigger button**: `src/components/suggestion-button.tsx` — icon button with Lightbulb icon
3. **i18n keys**: Add `suggestion.*` namespace to both locale files
4. **No new hooks needed**: Simple `useState` for dialog open/text + direct `supabase.functions.invoke()` call
5. **Title extraction**: `text.split(/[.!?\n]/)[0].slice(0, 80)` — first sentence, max 80 chars
6. **Metadata**: Gather from existing app state — user metadata is already available in App.tsx, current route from `useLocation()`

### PostHog tracking

Add one event: `suggestion_submitted` with properties:
- `role`: operator / worker
- `page`: current route
- `text_length`: character count

---

## 7. Out of Scope

| Feature | Reason |
|---------|--------|
| Suggestion status tracking in-app | MVP is fire-and-forget; adds significant UI complexity |
| Upvoting / voting on ideas | Requires listing suggestions, auth per vote — too complex for MVP |
| Fully anonymous submissions | Role is attached for triage context; no personally identifiable data |
| Categories / tags in the form | Keep form minimal — one field only. Owner triages manually |
| File / screenshot attachments | Adds upload complexity; text is enough for MVP |
| In-app suggestion history | No "my suggestions" page — owner reviews in Linear |

---

## 8. Open Questions

| # | Question | Proposed Answer |
|---|----------|----------------|
| 1 | Which Lightbulb icon variant? | `Lightbulb` from lucide-react — universally understood as "idea" |
| 2 | Edge Function cold start latency? | First call may take 1-2s. Dialog closes immediately (optimistic), so user doesn't feel it |
| 3 | Linear API rate limits? | 1,500 requests/hour — far above any realistic suggestion volume |
| 4 | Should we log failed submissions? | Yes, log to console + PostHog `suggestion_failed` event |
| 5 | Create the Linear project via MCP now or manually? | Via MCP during implementation — we have the tools |
