# Implementation Plan — Internationalization (i18n)

**Date**: 2026-03-22
**PRD**: `docs/prd-i18n.md`
**Branch**: `feature/i18n`
**Estimated phases**: 4

---

## Overview

Add i18n support using `i18next` + `react-i18next`. Extract all ~110 hardcoded Russian strings into translation JSON files (en + ru), add a language toggle to the user menu / profile / login, and sync the preference to Supabase user metadata. Default language: English.

---

## Phase 1: Infrastructure — i18next Setup + Translation Files

**Goal**: i18next configured, both JSON files created, `useTranslation()` works. No components changed yet.

### Tasks

- [ ] **1.1** Install dependencies
  - `pnpm add i18next react-i18next`
  - Files: `package.json`

- [ ] **1.2** Create translation files
  - `src/locales/en.json` — all ~110 keys in English
  - `src/locales/ru.json` — all ~110 keys in Russian
  - Key naming: `{namespace}.{element}.{variant}` (flat, dot-separated)
  - Use the glossary from PRD Section 7 for correct terminology

- [ ] **1.3** Configure i18next
  - Create `src/lib/i18n.ts` — init i18next with:
    - `fallbackLng: "en"`
    - `defaultNS: "translation"`
    - `interpolation: { escapeValue: false }` (React handles escaping)
    - Both locale JSONs imported statically (no lazy loading for 2 small files)
  - Import `src/lib/i18n.ts` in `src/main.tsx` (side-effect import, before app renders)

- [ ] **1.4** Add `Locale` type
  - `src/types/index.ts` — `export type Locale = "en" | "ru";`

### Deliverable
`useTranslation()` returns `t` function that resolves keys. Not yet wired to any component.

### Acceptance Test
- [ ] `pnpm build` passes with i18next installed
- [ ] Calling `t("login.submit")` in a test component returns "Sign In"

---

## Phase 2: Locale Sync + Language Toggle UI

**Goal**: Users can switch language. Choice persists in Supabase + localStorage.

### Tasks

- [ ] **2.1** Create `useLocaleSync` hook
  - `src/hooks/use-locale-sync.ts`
  - Same pattern as `useThemeSync`:
    - On login: read `session.user.user_metadata.locale` → set i18next language + localStorage
    - On language change: save to Supabase metadata (fire-and-forget) + localStorage
  - localStorage key: `"grida-locale"`
  - Default: `"en"`

- [ ] **2.2** Wire `useLocaleSync` into App
  - `src/App.tsx` — call `useLocaleSync(session)` alongside `useThemeSync(session)`

- [ ] **2.3** Create `LanguageSubmenu` component
  - `src/components/language-submenu.tsx`
  - Same visual pattern as `ThemeSubmenu` (DropdownMenuSub with radio items)
  - Options: "English" (en), "Русский" (ru)
  - Icon: `Languages` from lucide-react

- [ ] **2.4** Add `LanguageSubmenu` to dropdown menus
  - `src/components/app-layout.tsx` — after ThemeSubmenu
  - `src/pages/ShipmentsPage.tsx` — after ThemeSubmenu

- [ ] **2.5** Add language buttons to Profile page
  - `src/pages/ProfilePage.tsx` — new "Language" card below "Appearance"
  - Same button style as theme buttons

- [ ] **2.6** Add language toggle to Login page
  - `src/components/login-form.tsx` — small "EN | RU" toggle at bottom-right
  - Reads/writes localStorage only (no session yet)

- [ ] **2.7** Update `<html lang>` attribute
  - In `useLocaleSync` or i18n config: `i18next.on('languageChanged', (lng) => document.documentElement.lang = lng)`

### Deliverable
Language can be switched from menu, profile, and login. Choice persists across page reloads and sessions.

### Acceptance Test
- [ ] Switch to Russian in dropdown → all UI stays Russian after page refresh
- [ ] Switch to English on login page → login form shows English
- [ ] Log in → language from Supabase metadata applies
- [ ] `<html lang>` attribute matches current language

---

## Phase 3: Extract All Strings from Components

**Goal**: Every hardcoded Russian string replaced with `t()` calls. This is the bulk of the work.

### Tasks

- [ ] **3.1** Login page
  - `src/components/login-form.tsx`
  - Keys: `login.email`, `login.password`, `login.submit`, `login.loading`, `login.error`

- [ ] **3.2** Shipments page
  - `src/pages/ShipmentsPage.tsx`
  - Keys: filter tabs, table headers, empty states, actions, search placeholder, dialogs
  - Also: `toLocaleDateString("ru")` → `toLocaleDateString(i18n.language)`

- [ ] **3.3** App layout (shipment detail header)
  - `src/components/app-layout.tsx`
  - Keys: dropdown menu items, confirmation dialogs, badge text

- [ ] **3.4** Order sidebar + order card
  - `src/components/order-sidebar.tsx` — header, empty state, dialogs
  - `src/components/order-card.tsx` — status badges, action buttons

- [ ] **3.5** Order form
  - `src/components/order-form.tsx`
  - Keys: labels, priority options, submit buttons, toast messages

- [ ] **3.6** Wall popover
  - `src/components/wall-popover.tsx`
  - Keys: title, box count labels, actions, toasts, empty states

- [ ] **3.7** Shipment form + rename dialogs
  - `src/components/shipment-form-dialog.tsx`
  - `src/components/rename-shipment-dialog.tsx`

- [ ] **3.8** Search input
  - `src/components/search-input.tsx` — placeholder, "no results"

- [ ] **3.9** Theme submenu
  - `src/components/theme-submenu.tsx` — "Theme", "Light", "Dark", "System"

- [ ] **3.10** Profile page
  - `src/pages/ProfilePage.tsx` — all labels, buttons, toasts, password rules

- [ ] **3.11** Password validation
  - `src/lib/validate-password.ts` — replace `label` with `labelKey`
  - Update `src/pages/ProfilePage.tsx` to render via `t(rule.labelKey)`
  - Update `src/__tests__/validate-password.test.ts` to check `labelKey` instead of `label`

- [ ] **3.12** Shipment detail page (toasts)
  - `src/pages/ShipmentDetailPage.tsx` — toast messages

- [ ] **3.13** Hook toast messages
  - `src/hooks/use-orders.ts` — error toasts
  - `src/hooks/use-placements.ts` — error toasts (if any)

### Deliverable
Zero hardcoded Russian strings in any component or hook. Full app works in both English and Russian.

### Acceptance Test
- [ ] Set language to English → navigate every page → no Russian text visible (except user data)
- [ ] Set language to Russian → navigate every page → all UI in Russian
- [ ] All existing tests pass
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes

---

## Phase 4: Polish + Docs

**Goal**: Final QA, documentation, changelog.

### Tasks

- [ ] **4.1** Visual QA pass
  - Check every screen in both languages for:
    - Text overflow / truncation (English strings are often longer)
    - Consistent capitalization
    - Missing translations (raw keys visible)

- [ ] **4.2** Update documentation
  - `docs/architecture.md` — add i18n section (library, file structure, locale sync)
  - `docs/CHANGELOG.md` — new version entry
  - `docs/TODO.md` — mark 10.1 as completed

- [ ] **4.3** Run full CI checks
  - `pnpm lint && pnpm test && pnpm build`

### Deliverable
Feature complete, documented, CI green.

### Acceptance Test
- [ ] CI pipeline passes (lint → test → build)
- [ ] No visual regressions in either language
- [ ] Changelog updated

---

## Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/locales/en.json` | Create | English translations (~110 keys) |
| `src/locales/ru.json` | Create | Russian translations (~110 keys) |
| `src/lib/i18n.ts` | Create | i18next configuration |
| `src/hooks/use-locale-sync.ts` | Create | Locale persistence (Supabase + localStorage) |
| `src/components/language-submenu.tsx` | Create | Language switcher in dropdown menu |
| `src/types/index.ts` | Modify | Add `Locale` type |
| `src/main.tsx` | Modify | Import i18n config |
| `src/App.tsx` | Modify | Wire useLocaleSync |
| `src/components/login-form.tsx` | Modify | Extract strings + add language toggle |
| `src/components/app-layout.tsx` | Modify | Extract strings + add LanguageSubmenu |
| `src/components/order-card.tsx` | Modify | Extract strings |
| `src/components/order-form.tsx` | Modify | Extract strings |
| `src/components/order-sidebar.tsx` | Modify | Extract strings |
| `src/components/wall-popover.tsx` | Modify | Extract strings |
| `src/components/theme-submenu.tsx` | Modify | Extract strings |
| `src/components/search-input.tsx` | Modify | Extract strings |
| `src/components/shipment-form-dialog.tsx` | Modify | Extract strings |
| `src/components/rename-shipment-dialog.tsx` | Modify | Extract strings |
| `src/components/summary-bar.tsx` | Modify | No strings (icons only), skip |
| `src/pages/ShipmentsPage.tsx` | Modify | Extract strings + date locale |
| `src/pages/ShipmentDetailPage.tsx` | Modify | Extract toast strings |
| `src/pages/ProfilePage.tsx` | Modify | Extract strings + add language card |
| `src/lib/validate-password.ts` | Modify | Replace `label` with `labelKey` |
| `src/__tests__/validate-password.test.ts` | Modify | Update to check `labelKey` |
| `docs/architecture.md` | Modify | Add i18n section |
| `docs/CHANGELOG.md` | Modify | New version entry |
| `docs/TODO.md` | Modify | Mark 10.1 complete |

---

## Dependencies

| Package | Version | Size (gzipped) | Justification |
|---------|---------|----------------|---------------|
| `i18next` | ^24.x | ~3 KB | Core i18n runtime (industry standard, 36M weekly downloads) |
| `react-i18next` | ^15.x | ~2 KB | React bindings (hooks, provider, suspense support) |

No other dependencies needed. Total bundle impact: ~5 KB gzipped.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| English strings longer than Russian → UI overflow | Phase 4 visual QA pass; test critical layouts (buttons, table headers, badges) |
| Missing translation key → raw key shown to user | Fallback to English; grep for all `t()` calls to verify keys exist in both files |
| `validate-password.ts` refactor breaks tests | Explicit task 3.11 to update tests alongside the refactor |
| i18next SSR/hydration warnings | Not applicable — Grida is a pure SPA, no SSR |
| Translation drift (en.json and ru.json get out of sync) | Future: add a CI check that both files have identical key sets. Not in v1. |
