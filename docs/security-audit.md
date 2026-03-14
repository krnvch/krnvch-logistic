# Security Audit Report

**Date:** 2026-03-04
**Auditor:** Security Engineer (Agent #14)
**Scope:** Full audit — secrets, env vars, dependencies, auth/RLS, OWASP, CI/CD

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 2 |
| Medium   | 2 |
| Low      | 3 |
| Info     | 2 |

**Overall status:** PASS WITH WARNINGS

The app has a solid security foundation — no leaked secrets, RLS is active on all tables, no XSS vectors, and the auth flow is correctly implemented. However, two high-severity dependency vulnerabilities require patching before release, and two medium-severity design decisions carry real-world risk that should be consciously accepted or addressed.

---

## Findings

### [SEV-HIGH] Rollup Arbitrary File Write via Path Traversal

**Category:** Dependencies
**Package:** `rollup` < 4.59.0 (via `vite > rollup`)

**What:** The build tool Vite uses Rollup internally. The installed version of Rollup (4.x, before 4.59.0) has a vulnerability that allows an attacker to write arbitrary files to the server filesystem during a build, by crafting a malicious input filename containing path traversal sequences like `../`.

**Why it matters:** During CI builds or local `pnpm build`, if the build process ever processes external or untrusted input (e.g., a compromised dependency that embeds crafted filenames), an attacker could overwrite arbitrary files on the build machine. In a CI/CD environment, this could mean overwriting source code, configuration, or secrets.

**Fix:**
```bash
pnpm update vite
```
Vite 7.x should pull in a patched Rollup >= 4.59.0. After upgrading, run `pnpm audit` again to verify it is resolved.

---

### [SEV-HIGH] minimatch ReDoS (Regular Expression Denial of Service)

**Category:** Dependencies
**Packages:**
- `minimatch` < 3.1.4 (via `eslint > minimatch`)
- `minimatch` >= 9.0.0 < 9.0.7 (via `typescript-eslint > @typescript-eslint/typescript-estree > minimatch`)

**What:** Three separate ReDoS vulnerabilities in the `minimatch` glob-matching library. A crafted input string can make the regular expression engine take exponentially long to evaluate, hanging the process.

**Why it matters:** These are in devDependencies (ESLint, typescript-eslint) — they run during `pnpm lint` in CI. If an attacker can influence what files are linted (e.g., through a supply chain attack on a dependency that adds files), they could hang the CI runner. More practically: when you upgrade ESLint, these will be fixed automatically. The risk to production users is zero — these packages are never bundled into the client app.

**Fix:**
```bash
pnpm update eslint typescript-eslint
```
ESLint 10.x and typescript-eslint 8.57+ include patched `minimatch` versions.

---

### [SEV-MEDIUM] Role Self-Escalation: Any User Can Promote Themselves to Operator

**Category:** Auth & RLS
**File:** `src/hooks/use-profile.ts:18-28`, `src/pages/ProfilePage.tsx:46-48, 144-155`

**What:** The profile page allows any authenticated user to change their own role from `"worker"` to `"operator"` by selecting it in a dropdown and saving. The role is stored in `raw_user_meta_data` via `supabase.auth.updateUser()`. Crucially, **Supabase allows any authenticated user to update their own `raw_user_meta_data`** — there is no server-side restriction preventing a worker from writing `role: "operator"` to their own profile.

This means a worker can open their browser's DevTools, call:
```javascript
supabase.auth.updateUser({ data: { role: "operator" } })
```
...and immediately gain operator access, bypassing the UI restriction entirely.

**Why it matters:** The operator role grants full write access — creating, deleting, and reopening shipments. A worker gaining operator access could delete all shipment data. The current RLS policies grant `FOR ALL` to all authenticated users, so there is no database-layer enforcement preventing this.

**Fix (two options):**

*Option A — Accept the risk (appropriate if workers are trusted employees):*
Document explicitly that role switching is intentional and accessible to all users. The current design already allows operators to demote themselves to worker, so this is consistent. Add a note to `docs/architecture.md`.

*Option B — Enforce roles at the database level (proper fix for untrusted environments):*
1. Create a separate `user_roles` table with an `admin`-only RLS policy
2. Or use Supabase's `auth.users` admin API (server-side only) to restrict role updates
3. Update RLS policies to check `auth.jwt() -> 'user_metadata' -> 'role'` for write operations

For the current MVP with a small, trusted team, Option A is acceptable. Flag this as TD-07 in the Technical Debt Register.

---

### [SEV-MEDIUM] Weak Password Policy (6-character minimum, no complexity requirements)

**Category:** Auth & RLS
**File:** `src/lib/validate-password.ts:5`

**What:** The password change validation only requires a minimum of 6 characters. No uppercase, no digits, no special characters are required. The password `aaaaaa` would pass validation.

**Why it matters:** Weak passwords are vulnerable to brute-force attacks. Supabase's default rate limiting offers some protection, but a 6-character lowercase-only password can be cracked quickly with a dictionary attack. This is especially concerning because the app uses a **shared account** pattern (multiple workers sharing one login), meaning the password is likely shared over insecure channels (chat, email).

**Fix:**
Update `src/lib/validate-password.ts` to enforce minimum complexity:
```typescript
export function validatePasswordChange(
  newPassword: string,
  confirmPassword: string
): string | null {
  if (newPassword.length < 8) {
    return "Пароль должен содержать минимум 8 символов";
  }
  if (!/[A-Z]/.test(newPassword)) {
    return "Пароль должен содержать хотя бы одну заглавную букву";
  }
  if (!/[0-9]/.test(newPassword)) {
    return "Пароль должен содержать хотя бы одну цифру";
  }
  if (newPassword !== confirmPassword) {
    return "Пароли не совпадают";
  }
  return null;
}
```
Also consider enabling Supabase's built-in password strength policy in the Supabase dashboard (Authentication > Policies > Password strength).

---

### [SEV-LOW] GitHub Actions: Unpinned Action Versions (Floating Tags)

**Category:** CI/CD
**File:** `.github/workflows/ci.yml`

**What:** The CI workflow uses floating tags for third-party GitHub Actions:
```yaml
uses: actions/checkout@v4          # floating major version
uses: pnpm/action-setup@v4         # floating major version
uses: actions/setup-node@v4        # floating major version
```
A floating `@v4` tag can be updated by the action owner at any time to point to new code. If a popular action is compromised (supply chain attack), your CI would automatically run the malicious code on the next build.

**Why it matters:** CI runners have access to your build environment, secrets, and potentially deployment credentials. A compromised action could exfiltrate secrets or inject malicious code into your build artifacts. The risk is low for well-maintained official actions (`actions/checkout`, `actions/setup-node`), but higher for third-party ones.

**Fix:** Pin actions to specific commit SHAs:
```yaml
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
uses: pnpm/action-setup@a3252b78c470c02df07e9d59298aecedc3ccdd6  # v4.0.0
uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af  # v4.1.0
```
You can look up current SHA values on each action's GitHub releases page.

---

### [SEV-LOW] User Email Stored Plaintext in Database (`created_by` Column)

**Category:** Auth & RLS
**File:** `src/components/shipment-form-dialog.tsx:62`, `supabase/migrations/20260228120000_multi_shipment.sql:6`

**What:** When a shipment is created, the operator's email address is stored in the `created_by` column as plain text. This email is then displayed in the shipments table for all authenticated users to see.

**Why it matters:** Any authenticated user (including workers) can read the operator's email address via the Supabase API — it's a normal column with no access restriction. For a small internal team this is often acceptable, but it means user PII (email) is exposed to all app users and stored in a column that has no special protection.

**Fix:** Consider storing a display name or user ID instead of a raw email. If email must be stored, it's still acceptable for an internal tool — just be aware of it.

---

### [SEV-LOW] Supabase JWT Session Stored in localStorage

**Category:** Auth & RLS
**File:** `docs/architecture.md:367` (auth flow description)

**What:** The Supabase SDK stores the authentication session JWT (the token that proves you're logged in) in `localStorage` by default. This is Supabase's standard behavior and is used throughout the app.

**Why it matters:** Tokens in `localStorage` are accessible to JavaScript code — including third-party scripts. If an XSS vulnerability were ever introduced, an attacker could steal the session token. For this app, the XSS risk is currently very low (no `dangerouslySetInnerHTML`, all inputs go through the Supabase SDK, no user-generated HTML rendered). This is a theoretical risk, not an active one.

**Fix:** For MVP, accept this as a known trade-off (it's Supabase's default and documented behavior). If you move to a higher security posture, Supabase supports custom storage adapters — you could use an in-memory store or a httpOnly cookie proxy.

---

### [SEV-INFO] `supabase/config.toml` Contains AI Config Reference (Non-Secret)

**Category:** Secrets
**File:** `supabase/config.toml:91`

**What:** The committed `supabase/config.toml` contains a line:
```toml
openai_api_key = "env(OPENAI_API_KEY)"
```
This is a reference to a local Supabase Studio configuration for AI features. It uses `env()` syntax — the actual API key comes from a local environment variable, not the config file itself.

**Why it matters:** No actual key is committed. The `env(OPENAI_API_KEY)` syntax means "read from environment at runtime." This is not a leak. However, it reveals that the project uses (or considered using) Supabase AI Studio features, and it creates a pattern that a new contributor might misread as containing a key.

**Fix:** No action required. Optionally add a comment clarifying that `env(...)` means "read from local environment, never committed."

---

### [SEV-INFO] RLS Policies Grant Full Access to All Authenticated Users (Intentional Technical Debt)

**Category:** Auth & RLS
**File:** `supabase/migrations/20260222142625_initial_schema.sql:108-115`

**What:** All three tables (`shipments`, `orders`, `placements`) have a single policy: any authenticated user can read and write everything. The operator/worker role distinction is enforced only in the UI (React components), not at the database level.

**Why it matters:** A worker using the Supabase client directly (e.g., from the browser console) can create, update, or delete any data — bypassing the React UI restrictions. The `isOperator` flag in the React app is a UI convenience, not a security boundary.

**Why this is Info, not High:** This is a documented architectural decision (AD-04, TD-02 in `docs/architecture.md`). The current threat model is a small, trusted internal team. If the user base grows or includes adversarial users, this must be upgraded to per-role RLS policies.

**Fix:** When moving beyond MVP, split the `FOR ALL` policies into separate `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies per role, enforcing that workers can only flip `is_done` on orders and cannot modify shipment structure.

---

## Checks Passed

- **No secrets in git history.** All 20 commits were scanned for service role keys, JWT tokens, passwords, and API keys. Nothing sensitive was found. The `.env` file exists locally but was never committed — `.gitignore` correctly blocks it.

- **Environment variables are correctly classified.** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used client-side — both are public-safe by design. No service role key or admin secret is present anywhere in the codebase.

- **RLS is enabled on all tables.** All three tables (`shipments`, `orders`, `placements`) have `ENABLE ROW LEVEL SECURITY` in the migration files. Anonymous (unauthenticated) users cannot access any data.

- **No XSS vectors found.** No `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, or `eval()` usage anywhere in the codebase. React's default escaping protects all rendered data.

- **No SQL injection risk.** All database queries use the Supabase SDK (fully parameterized). No raw SQL string concatenation, no `.rpc()` calls with user input.

- **No sensitive data in console logs.** No `console.log/error/warn` calls anywhere in `src/`. No internal details leak to the browser console in production.

- **Login error messages are non-enumerable.** The login form shows a generic "Неверный email или пароль" message regardless of whether the email exists — no user enumeration possible.

- **Password inputs are correctly typed `type="password"`.** All password fields in login and profile pages use `type="password"` — they're masked and not stored in browser history.

- **Auth state is reactive and session refresh is handled.** `use-auth.ts` uses `supabase.auth.onAuthStateChange()` — the app correctly reacts to token refresh, logout, and session expiry.

- **Logout clears the Supabase session.** `supabase.auth.signOut()` is called correctly — the SDK clears the JWT from localStorage.

- **`.gitignore` covers all critical files.** `.env`, `.env.local`, `.env.*.local`, `*.local` are all blocked. `node_modules/`, `dist/` are excluded.

- **No service role key anywhere.** Grep across all source code, config files, and git history found zero references to `SUPABASE_SERVICE_ROLE` or any service-level credentials.

- **CI pipeline runs lint + tests + build on every PR.** The GitHub Actions workflow correctly gates merges on all three checks.

- **`localStorage` usage is minimal and non-sensitive.** Only `krnvch-last-shipment-id` (a UUID) is stored — no PII, no tokens, no sensitive data beyond Supabase's own session management.

---

## Recommendations

In priority order:

1. **[Do now] Update Vite to fix the Rollup path traversal vulnerability.** Run `pnpm update vite` and verify with `pnpm audit`. This is the only vulnerability that affects build infrastructure directly.

2. **[Do now] Update ESLint + typescript-eslint to fix minimatch ReDoS.** Run `pnpm update eslint typescript-eslint`. These are dev-only but should be clean before release.

3. **[Before next feature] Strengthen the password policy.** Update `validate-password.ts` to require at least 8 characters, one digit, and one uppercase letter. This is a 5-minute code change that significantly increases resistance to brute-force.

4. **[Document or fix] Clarify the role escalation design decision.** Either document explicitly in `docs/architecture.md` that all authenticated users can self-assign roles (acceptable for trusted teams), or add it to the Technical Debt Register as TD-07 with a planned fix when the app scales.

5. **[Consider] Enable Supabase's built-in HaveIBeenPwned password check.** In the Supabase dashboard under Authentication > Policies, you can enable a check against the HaveIBeenPwned database to block known-compromised passwords — zero code change required.

6. **[Future] Pin GitHub Actions to commit SHAs.** Low urgency for now, but part of a mature CI security posture.

7. **[Future] Implement per-role RLS policies.** When the app scales beyond a small trusted team, split the blanket `authenticated = full access` policy into operator-only write operations. This is already planned as TD-02.
