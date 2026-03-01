# PRD — Dark Theme

**Version**: 1.0
**Date**: 2026-03-01
**Status**: Draft (pending architect review)
**Parent feature**: Task 4.1 in `docs/TODO.md`

---

## 1. Overview

### Problem

Users work in dark environments (warehouses) on iPads. The current light-only UI causes eye strain and drains battery faster on OLED displays. There is no way to switch to a dark interface.

### Solution

Add a dark theme with three modes (Light / Dark / System). The toggle is accessible from the header dropdown menu (nested submenu) and the Profile settings page. Theme preference syncs across devices via Supabase user metadata.

### Success Criteria

| Metric | Target |
|--------|--------|
| User can switch theme | All 3 modes (Light, Dark, System) work correctly |
| Theme persists | Survives page refresh and re-login |
| Theme syncs | Same preference appears on different devices for same account |
| No flash | Page loads with correct theme, no white flash in dark mode |
| Login page | Respects theme setting |
| Toast notifications | Match active theme |

---

## 2. User Flow

### Theme switching via dropdown menu

```
Any page -> Burger menu -> "Тема" (with submenu arrow) -> hover/tap
  -> Submenu opens with 3 radio options:
    * Светлая (Sun icon)
    * Тёмная (Moon icon)  <- active, shown with radio indicator
    * Системная (Monitor icon)
  -> Select option -> theme applies instantly
  -> Menu closes
```

### Theme switching via Profile page

```
/profile -> "Оформление" card -> 3 buttons (Light / Dark / System)
  -> Tap button -> theme applies instantly
  -> No save button needed (immediate effect)
```

### Cross-device sync

```
Device A: user sets Dark theme -> saved to Supabase metadata
Device B: user logs in -> theme loaded from Supabase -> applied
```

---

## 3. Functional Requirements

### FR-DT-01: Theme Provider

**Given** the app loads for the first time (no saved preference)
**When** the page renders
**Then** the theme follows the OS system preference (prefers-color-scheme)

**Given** the user has a saved theme preference in localStorage
**When** the page loads
**Then** the correct theme is applied before React hydrates (no flash of wrong theme)

### FR-DT-02: Dropdown Submenu

**Given** the user is on any page with the burger dropdown menu
**When** the user opens the dropdown
**Then** a "Тема" item with a submenu arrow is visible (between the last action item and "Профиль")

**Given** the user hovers/taps "Тема"
**When** the submenu opens
**Then** 3 radio options are shown: Светлая, Тёмная, Системная — with the current theme indicated by a radio dot

**Given** the user selects a theme option
**When** the selection is made
**Then** the theme applies instantly, the preference is saved to localStorage and Supabase

### FR-DT-03: Profile Page Section

**Given** the user opens /profile
**When** the page renders
**Then** an "Оформление" card is shown (between personal data and password cards) with 3 toggle buttons: Светлая / Тёмная / Системная

**Given** the user taps a theme button
**When** the button is pressed
**Then** the theme applies instantly, the active button is visually highlighted, no separate save action needed

### FR-DT-04: Cross-Device Sync

**Given** the user logs in and has a theme preference in Supabase `raw_user_meta_data.theme`
**When** the session loads
**Then** the Supabase theme overrides any localStorage value

**Given** the user changes theme
**When** the change is applied locally
**Then** it is also saved to Supabase `raw_user_meta_data.theme` in the background

### FR-DT-05: Login Page

**Given** the user is not logged in
**When** the login page loads
**Then** the login page respects the theme from localStorage / system preference (Supabase sync is not available before login)

### FR-DT-06: Toast Notifications

**Given** the app has an active theme (light or dark)
**When** a toast notification appears
**Then** the toast follows the active theme colors

---

## 4. Data Model

No new database tables. Theme preference is added to Supabase Auth `user_metadata`:

```json
{
  "role": "operator",
  "first_name": "Артём",
  "last_name": "Кравченко",
  "theme": "dark"
}
```

Valid values for `theme`: `"light"` | `"dark"` | `"system"`

If `theme` is not set in metadata -> fallback to localStorage -> fallback to `"system"`.

**Type update** (in `src/types/index.ts`):

```ts
export type Theme = "light" | "dark" | "system";
```

---

## 5. UI Layout

### Dropdown submenu

```
+------------------------+
|  Все рейсы             |
|  Переименовать         |
|  Завершить рейс        |
|  ----------------------|
|  Тема              >   |---> +-----------------+
|  ----------------------|     | * Светлая       |
|  Профиль               |     | * Тёмная        |
|  Выйти                 |     | * Системная     |
+------------------------+     +-----------------+
```

### Profile page — Appearance card

```
+-- Card ------------------------------------+
|  Оформление                                |
|                                            |
|  [ Светлая ] [ Тёмная ] [ Системная ]      |
|       ^ group of 3 buttons, active = filled|
+--------------------------------------------+
```

### Components used

- Existing: `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`
- Existing: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`
- Icons: `Sun`, `Moon`, `Monitor` from lucide-react
- Library: `next-themes` (already installed, `^0.4.6`)

---

## 6. Implementation Notes

- **`next-themes`** handles `.dark` class toggle on `<html>`, localStorage persistence, system preference detection, and flash prevention — all out of the box.
- **CSS is already ready**: `src/index.css` has full `:root` (light) and `.dark` (dark) token sets. Tailwind 4 has `@custom-variant dark`. No CSS changes needed.
- **Two dropdown menus** exist: `app-layout.tsx` (shipment detail) and `ShipmentsPage.tsx` (shipments list). Both need the theme submenu.
- **Supabase sync is secondary**: localStorage is primary (instant, no flash). Supabase sync is background — only applies on login to a new device. Don't block rendering on Supabase read.

---

## 7. Out of Scope

| Feature | Reason |
|---------|--------|
| High-contrast mode | Standard contrast is sufficient per user feedback |
| Per-page theme | Overkill, global theme is enough |
| Scheduled theme (day/night) | System preference handles this already |
| Custom accent colors | Future task 10.2 (visual redesign) |

---

## 8. Open Questions

| # | Question | Proposed Answer |
|---|----------|----------------|
| 1 | What happens if Supabase metadata and localStorage disagree? | Supabase wins on login. After that, every change writes to both. |
| 2 | Should theme change trigger a toast? | **No** — the visual change is immediate and self-evident. |
| 3 | What icon shows on the submenu trigger? | Dynamic: Sun for light, Moon for dark, Monitor for system. |
