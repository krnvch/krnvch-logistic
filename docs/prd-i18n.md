# PRD — Internationalization (i18n)

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Reviewed (architect approved)
**Parent feature**: Task 10.1 in `docs/TODO.md`

---

## 1. Overview

### Problem

The Grida app UI is 100% in Russian. This creates two problems:

1. **Real users**: Some warehouse workers are English-speaking. They currently navigate an interface they can't read, relying on icon recognition and muscle memory.
2. **Portfolio / demo**: When showcasing Grida to English-speaking audiences (potential clients, employers, collaborators), the Russian-only UI creates a barrier to understanding the product.

### Solution

Add internationalization (i18n) to the app: all UI strings extracted into translation files (JSON), with a language toggle accessible from the user menu, profile page, and login page. Ship with two languages: **English** (default) and **Russian**. Architecture supports adding more languages later (e.g., German) by simply adding a new JSON file.

### Success Criteria

| Metric | Target |
|--------|--------|
| All UI strings come from translation files | Zero hardcoded Russian strings in components |
| Language toggle works | User can switch en ↔ ru and see instant UI update |
| Choice persists across sessions | Saved in `raw_user_meta_data.locale` + localStorage |
| Login page supports language switch | Before auth, toggle is available |
| Default language | English |
| Fallback language | English (missing key → English string, never raw key) |
| Bundle size impact | < 5 KB gzipped for i18n library + both locale files |
| `<html lang>` attribute | Updates on language change |

---

## 2. User Flow

### Authenticated user changes language

```
User clicks avatar dropdown
  → sees "Language" submenu (same pattern as "Theme" submenu)
  → picks "English" or "Русский"
  → UI re-renders in chosen language instantly
  → choice saved to Supabase user_metadata.locale (background)
  → choice saved to localStorage (immediate)
```

### Unauthenticated user on login page

```
User sees login page (default: English)
  → small language toggle in bottom-right corner
  → clicks to switch → login page re-renders
  → choice saved to localStorage
  → after login → localStorage value syncs to Supabase metadata
```

### User logs in on a new device

```
User opens app on new device
  → localStorage is empty → default language (English)
  → user logs in
  → app reads user_metadata.locale from Supabase session
  → if locale exists → applies it, saves to localStorage
  → if not → keeps default (English)
```

---

## 3. Functional Requirements

### FR-I18N-01: Translation File Structure

All UI strings stored in JSON files under `src/locales/`:

```
src/locales/
  en.json    — English (default, source of truth)
  ru.json    — Russian
```

Each file is a flat key-value object with dot-separated namespaced keys:

```json
{
  "login.title": "Sign In",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign In",
  "login.loading": "Signing in...",
  "login.error": "Invalid email or password"
}
```

### FR-I18N-02: Translation Hook

Components access translations via a `useTranslation()` hook:

```typescript
const { t } = useTranslation();
return <Label>{t("login.password")}</Label>;
```

- `t(key)` returns the string for the current locale
- If key is missing in current locale → falls back to English
- If key is missing in English → returns the key itself (dev error, never shown in prod)

### FR-I18N-03: Language Toggle in User Menu

**Given** the user is on any authenticated page
**When** they open the avatar dropdown menu
**Then** they see a "Language" submenu (same visual pattern as "Theme" submenu)
**And** the submenu shows two options: "English" and "Русский"
**And** the current language has a radio indicator

### FR-I18N-04: Language Setting on Profile Page

**Given** the user is on the Profile page
**When** they see the "Appearance" card (or a new "Language" card)
**Then** there are language buttons (same pattern as theme buttons: English / Русский)
**And** clicking a button switches language immediately

### FR-I18N-05: Language Toggle on Login Page

**Given** the user is not authenticated (login page)
**When** they look at the bottom-right corner of the page
**Then** they see a small, subtle language toggle (e.g., "EN / RU" text buttons)
**And** clicking switches the login page language
**And** the choice is saved to localStorage

### FR-I18N-06: Language Persistence

| Context | Storage | Priority |
|---------|---------|----------|
| Authenticated user | `raw_user_meta_data.locale` in Supabase | Primary (source of truth) |
| Any user | `localStorage["grida-locale"]` | Secondary (fast read, offline) |
| First visit | — | Default: `"en"` |

On login: read `user_metadata.locale` → if exists, apply and save to localStorage.
On language change: save to both localStorage (immediate) and Supabase metadata (background, fire-and-forget).

### FR-I18N-07: HTML Lang Attribute

**When** language changes
**Then** `<html lang="en">` or `<html lang="ru">` is updated
**So that** screen readers and browser features (spell check, hyphenation) work correctly.

### FR-I18N-08: Password Validation Labels

The `getPasswordRules()` function in `src/lib/validate-password.ts` returns hardcoded Russian labels. These must also come from translations.

**Approach**: `getPasswordRules()` returns keys instead of labels. The component that renders the rules passes them through `t()`.

### FR-I18N-09: Date Locale in Shipments Table

The shipments table currently uses `toLocaleDateString("ru")`. This should switch to the active locale: `toLocaleDateString(locale)`.

---

## 4. Data Model

No database schema changes. Language preference is stored in the existing `raw_user_meta_data` JSON field on `auth.users`:

```typescript
// Reading
const locale = session.user.user_metadata?.locale; // "en" | "ru"

// Writing
await supabase.auth.updateUser({ data: { locale: "ru" } });
```

TypeScript type addition in `src/types/index.ts`:

```typescript
export type Locale = "en" | "ru";
```

---

## 5. UI Layout

### Language submenu in avatar dropdown (same as ThemeSubmenu)

```
┌─────────────────────┐
│ All shipments        │
│ Rename               │
│ Complete shipment    │
│ ─────────────────── │
│ Theme           ▸   │
│ Language        ▸   │  ← NEW (between Theme and separator)
│ ─────────────────── │
│ Profile              │
│ Sign out             │
└─────────────────────┘

Language submenu:
┌─────────────────────┐
│ ◉ English           │
│ ○ Русский           │
└─────────────────────┘
```

### Language buttons on Profile page (new card or inside Appearance)

```
┌─────────────────────────────────┐
│ Language                         │
│                                  │
│ [English]  [Русский]             │  ← same button style as theme
│                                  │
└─────────────────────────────────┘
```

### Login page toggle (bottom-right, subtle)

```
┌──────────────────────────────────────┐
│                                      │
│         [Grida logo]                 │
│     The grid sees everything.        │
│                                      │
│     ┌──────────────────┐             │
│     │ Email            │             │
│     │ Password         │             │
│     │ [Sign In]        │             │
│     └──────────────────┘             │
│                                      │
│                            EN | RU   │  ← small, muted text
│                                      │
└──────────────────────────────────────┘
```

---

## 6. Implementation Notes

### Library choice: `i18next` + `react-i18next`

- De facto standard for React i18n (36M weekly downloads)
- Lightweight: ~3 KB gzipped for core + react bindings
- Built-in fallback language support
- Supports namespaces, interpolation, pluralization
- No build-time compilation needed (unlike `react-intl` / FormatJS)
- Familiar API: `const { t } = useTranslation()`

### Locale sync hook: `useLocaleSync`

Follow the exact same pattern as `useThemeSync`:

```typescript
export function useLocaleSync(session: Session | null) {
  // On login: read locale from Supabase metadata → apply to i18next + localStorage
  // On change: save to Supabase metadata (background) + localStorage (immediate)
}
```

### Key naming convention

Flat keys with dot-separated namespaces:

```
{namespace}.{element}.{variant}
```

Examples:
- `shipments.filter.all` → "All"
- `shipments.filter.active` → "Active"
- `orders.status.pending` → "Pending"
- `orders.status.done` → "Done"
- `profile.title` → "Profile"
- `common.save` → "Save"
- `common.cancel` → "Cancel"

### Password validation: return keys, not labels

```typescript
// Before:
{ key: "length", label: "Минимум 8 символов", passed: true }

// After:
{ key: "length", labelKey: "password.rule.length", passed: true }

// Component renders:
t(rule.labelKey) → "At least 8 characters" or "Минимум 8 символов"
```

---

## 7. Translation Glossary

Correct logistics terminology for English translations:

| Russian | English | Notes |
|---------|---------|-------|
| Рейс | Shipment | NOT "trip" or "flight" |
| Стена | Wall | Trailer wall — domain-specific term |
| Размещение | Placement | NOT "location" or "position" |
| Заказ | Order | Standard |
| Коробка / Коробок | Box / Boxes | Standard |
| Готово (статус) | Done | NOT "Ready" — means finished |
| Ожидает | Pending | Standard |
| Загружен | Loaded | NOT "uploaded" — physically loaded into trailer |
| Завершён (рейс) | Completed | Standard |
| Активный | Active | Standard |
| Оператор | Operator | Standard |
| Работник | Worker | Standard |
| Стена заполнена | Wall full | Short form |
| Срочный | Urgent | Priority badge |
| Обычный | Normal | Priority default |
| Выйти | Sign out | NOT "Exit" — auth context |
| Войти | Sign in | NOT "Enter" — auth context |
| Профиль | Profile | Standard |
| Оформление | Appearance | Standard (theme section) |
| Смена пароля | Change Password | Standard |
| Все рейсы | All Shipments | Nav menu |
| Переименовать | Rename | Standard |
| Завершить рейс | Complete Shipment | Action |
| Возобновить рейс | Reopen Shipment | Action |
| Удалить | Delete | Standard |
| Отмена | Cancel | Standard |
| Сохранить | Save | Standard |
| Добавить | Add | Standard |
| Вернуть | Undo | In context of un-marking "Done" |
| Поиск заказа | Search orders | Placeholder |
| Поиск по названию | Search by name | Shipments search |
| Ничего не найдено | No results found | Empty state |
| Нет заказов | No orders | Empty state |
| Нет рейсов | No shipments | Empty state |
| Слабый | Weak | Password strength |
| Средний | Medium | Password strength |
| Надёжный | Strong | Password strength |
| Пароли не совпадают | Passwords don't match | Validation |
| Имя | First name | Profile |
| Фамилия | Last name | Profile |
| Название | Name | Shipment name |
| Создан | Created | Table column |
| Автор | Author | Table column |
| Прогресс | Progress | Table column |
| Статус | Status | Table column |
| ост. | rem. | Remaining boxes (abbreviated) |
| Личные данные | Personal Information | Profile card |
| Текущий пароль | Current password | Profile |
| Новый пароль | New password | Profile |
| Подтверждение пароля | Confirm password | Profile |
| Минимум 8 символов | At least 8 characters | Password rule |
| Заглавная буква (A-Z) | Uppercase letter (A-Z) | Password rule |
| Строчная буква (a-z) | Lowercase letter (a-z) | Password rule |
| Цифра (0-9) | Digit (0-9) | Password rule |
| Спецсимвол (!@#$%^&*…) | Special character (!@#$%^&*…) | Password rule |
| Профиль обновлён | Profile updated | Toast |
| Пароль изменён | Password changed | Toast |
| Заказ создан | Order created | Toast |
| Заказ обновлён | Order updated | Toast |
| Рейс создан! | Shipment created! | Toast |
| Рейс не найден | Shipment not found | Toast |
| Заказ отмечен как готово | Order marked as done | Toast |
| Заказ возвращён в работу | Order returned to work | Toast |
| Размещено N коробок на стене N | Placed N boxes on wall N | Toast (interpolation) |
| Размещение обновлено | Placement updated | Toast |
| Размещение удалено | Placement deleted | Toast |
| Тема | Theme | Menu |
| Светлая | Light | Theme option |
| Тёмная | Dark | Theme option |
| Системная | System | Theme option |
| Язык | Language | Menu (NEW) |
| Например: Рейс на Москву | e.g., Shipment to Berlin | Placeholder |

---

## 8. Out of Scope

| Feature | Reason |
|---------|--------|
| Date/number formatting (`Intl.DateTimeFormat`) | Separate task — will add to profile settings later |
| Pluralization rules | Not needed — we use numbers with fixed nouns ("24 boxes", not "1 box / 24 boxes") |
| RTL layout support | No RTL languages planned |
| Auto-detect browser language | PM decision: explicit default (English), manual toggle |
| Translation management UI | Overkill — JSON files edited by developers |
| Third language (German, etc.) | Architecture supports it, but only en + ru ship now |

---

## 9. Open Questions

| # | Question | Proposed Answer |
|---|----------|----------------|
| 1 | Should the language setting be per-device or per-user? | Per-user (Supabase metadata), with localStorage cache for speed. Same user = same language on all devices. |
| 2 | Should we use namespaced JSON files (one per page) or a single flat file? | Single flat file per language. ~110 keys is small enough. Split later if needed. |
| 3 | Where to put the language card on profile page — inside "Appearance" or separate? | Separate card "Language" below "Appearance". They are different concerns (visual vs. content). |
