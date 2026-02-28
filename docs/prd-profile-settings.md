# PRD — Profile Settings Page

**Version**: 1.0
**Date**: 2026-02-28
**Status**: Approved (architect review applied)
**Parent feature**: Task 10.4 in `docs/TODO.md`

---

## 1. Overview

### Problem

Users currently have no self-service way to manage their profile. Name and surname aren't stored anywhere. Password can only be changed via raw SQL in Supabase. Role switching (operator ↔ worker) requires an admin running SQL queries. This creates friction and dependency on technical knowledge for basic account management.

### Solution

A dedicated Profile Settings page accessible from the main dropdown menu. The page allows users to view and edit their personal info (name, surname), see their email (read-only), switch their role, and change their password.

### Success Criteria

| Metric | Target |
|--------|--------|
| User can update name/surname | Save persists across sessions |
| User can switch role | UI reflects new role immediately after navigation |
| User can change password | New password works on next login |
| Page accessible from any screen | Via dropdown menu in header |

---

## 2. User Flow

```
Any page → Dropdown menu → "Профиль" → /profile page
  → Edit name/surname → Save → toast "Профиль сохранён"
  → Switch role → Save → role takes effect on next navigation
  → Expand password section → Enter current + new + confirm → Save → toast "Пароль изменён"
  → X button → return to previous page
```

---

## 3. Functional Requirements

### FR-PS-01: Navigation

**Given** the user is logged in and on any page (shipments list or shipment detail)
**When** the user opens the dropdown menu in the header
**Then** a "Профиль" menu item is visible (with a User icon)

**Given** the user taps "Профиль"
**When** the navigation completes
**Then** a full-width page opens at `/profile` with a header containing an X (close) button and the title "Профиль"

**Given** the user taps the X button
**When** there is navigation history
**Then** the user returns to the previous page (could be shipments list or shipment detail)

**Given** the user navigates directly to `/profile` (no history)
**When** they tap the X button
**Then** they are redirected to `/` (shipments list)

### FR-PS-02: Personal Info Section

**Given** the profile page is open
**When** the page renders
**Then** a "Личные данные" card is shown with:
- **Имя** — text input, optional, pre-filled from `user_metadata.first_name` (empty if not set)
- **Фамилия** — text input, optional, pre-filled from `user_metadata.last_name` (empty if not set)
- **Email** — displayed as read-only text (not an editable input), shows the user's email address
- **Роль** — dropdown select with two options: "Оператор" and "Работник", pre-selected from current role
- Help text below role selector: "Оператор — полный доступ: создание и редактирование рейсов, заказов, размещений. Работник — просмотр и отметка «Готово»."
- **Сохранить** button at the bottom of the card

### FR-PS-03: Save Profile

**Given** the user modifies name, surname, or role
**When** the user taps "Сохранить"
**Then** `first_name`, `last_name`, and `role` are saved to Supabase `user_metadata`, a success toast "Профиль сохранён" appears, the save button shows a loading state and is disabled during the operation, and the session refreshes so the new role takes effect **immediately** across the app (via `onAuthStateChange` → `USER_UPDATED`)

**Given** the save fails (network error, etc.)
**When** the error is caught
**Then** an error message appears inline below the save button

### FR-PS-04: Password Change Section

**Given** the profile page is open
**When** the page renders
**Then** a "Смена пароля" card is shown, collapsed by default (only the title and an expand/collapse chevron are visible)

**Given** the user taps the "Смена пароля" header
**When** the section expands
**Then** three fields appear:
- **Текущий пароль** — password input, required
- **Новый пароль** — password input, required, minimum 6 characters
- **Подтверждение** — password input, required, must match new password
- **Сменить пароль** button

### FR-PS-05: Password Validation

**Given** the user enters a new password shorter than 6 characters
**When** they tap "Сменить пароль"
**Then** inline error: "Минимум 6 символов"

**Given** the new password and confirmation don't match
**When** they tap "Сменить пароль"
**Then** inline error: "Пароли не совпадают"

**Given** the user enters an incorrect current password
**When** the verification call fails
**Then** inline error: "Неверный текущий пароль"

### FR-PS-06: Password Save

**Given** valid current password, new password (≥6 chars), and matching confirmation
**When** the user taps "Сменить пароль"
**Then** the password is updated, a success toast "Пароль изменён" appears, all three password fields are cleared, the section collapses, and the button shows a loading state during the operation

---

## 4. Data Model

No new database tables. All profile data is stored in Supabase Auth `user_metadata`:

```json
{
  "role": "operator",
  "first_name": "Артём",
  "last_name": "Кравченко"
}
```

**Type interface** (add to `src/types/index.ts`):
```ts
export interface UserMetadata {
  role?: UserRole;
  first_name?: string;
  last_name?: string;
}
```

**API calls:**
- Read: `session.user.user_metadata` (already available via `useAuth()`)
- Update profile: `supabase.auth.updateUser({ data: { first_name, last_name, role } })`
- Verify password: `supabase.auth.signInWithPassword({ email, password })` — note: this replaces the current session as a side effect. The implementation must chain verification and password update in a single async handler without intermediate state updates.
- Change password: `supabase.auth.updateUser({ password: newPassword })`

**Page props interface:**
```ts
interface ProfilePageProps {
  session: Session;
  logout: () => Promise<void>;
}
```

---

## 5. UI Layout

```
┌──────────────────────────────────────────┐
│ [X]  Профиль                             │  ← sticky header
├──────────────────────────────────────────┤
│          max-w-lg, centered              │
│                                          │
│  ┌─ Card ────────────────────────────┐   │
│  │  Личные данные                    │   │
│  │                                   │   │
│  │  Имя          [_______________]   │   │
│  │  Фамилия      [_______________]   │   │
│  │  Email        user@email.com      │   │
│  │  Роль         [Оператор      ▾]  │   │
│  │               (help text)         │   │
│  │                                   │   │
│  │               [  Сохранить  ]     │   │
│  └───────────────────────────────────┘   │
│                                          │
│  ┌─ Card ────────────────────────────┐   │
│  │  Смена пароля            [▾]      │   │  ← collapsed
│  └───────────────────────────────────┘   │
│                                          │
│  ┌─ Card (expanded) ─────────────────┐   │
│  │  Смена пароля            [▴]      │   │  ← expanded
│  │                                   │   │
│  │  Текущий пароль [_____________]   │   │
│  │  Новый пароль   [_____________]   │   │
│  │  Подтверждение  [_____________]   │   │
│  │                                   │   │
│  │            [  Сменить пароль  ]   │   │
│  └───────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**Components used** (all existing in the project):
- `Card`, `CardHeader`, `CardTitle`, `CardContent` — section containers
- `Input`, `Label` — form fields
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` — role dropdown
- `Button` — save actions
- `Separator` — optional visual divider
- Icons: `X`, `User`, `ChevronDown`, `ChevronUp` from lucide-react

---

## 6. Implementation Notes

- **Collapsible password section**: Use a simple `useState` boolean toggle with `ChevronDown`/`ChevronUp` icons. Do NOT add the shadcn Collapsible component — conditional rendering is sufficient.
- **Role is a UI preference, not a security boundary**: Currently no RLS policies reference `role`. If role ever becomes server-enforced, self-service switching must be removed. Add this to the tech debt register.
- **Save buttons**: Must show loading state and be disabled during async operations to prevent double-submit.
- **Password validation**: Extract into a pure function `validatePasswordChange()` in `src/lib/validate-password.ts` for testability.

---

## 7. Out of Scope

| Feature | Reason |
|---------|--------|
| Email change | Requires email verification flow — separate task |
| Avatar / profile photo | Not needed for MVP |
| Language selector | Task 10.1 (i18n) |
| Delete account | Not needed |
| Two-factor auth | Not needed for MVP |
| "Unsaved changes" warning on X | Nice-to-have, not required |

---

## 8. Open Questions

| # | Question | Proposed Answer |
|---|----------|----------------|
| 1 | Should role change require re-login? | **No** — Supabase `updateUser` triggers `USER_UPDATED` event, session refreshes automatically. New role takes effect on next navigation. |
| 2 | Should we add password strength indicator? | **No** — minimum 6 chars is enough for MVP. Matches Supabase default `minimum_password_length = 6`. |
| 3 | Should profile be accessible to both operators and workers? | **Yes** — both roles can edit their own profile. |
