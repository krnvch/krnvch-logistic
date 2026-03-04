---
name: preflight
description: Run the full CI check locally (lint, test, build) before pushing or creating a PR. Use when the user says "check before push", "run checks", "preflight", or before any git push.
user-invocable: true
disable-model-invocation: true
---

# Preflight Check — CI Pipeline Locally

Run the same checks that GitHub Actions CI runs, but locally — so you catch issues before pushing.

## Steps (run sequentially, stop on first failure)

1. **Lint** — `pnpm lint`
   - If lint fails: show the errors, offer to auto-fix with `pnpm lint --fix`
   - Common issues: unused imports, missing semicolons, formatting

2. **Test** — `pnpm test`
   - If tests fail: show which tests failed, read the test file, and diagnose the issue
   - Show test count: "15 tests passed in 2 files"

3. **Type-check & Build** — `pnpm build`
   - This runs `tsc -b && vite build` (TypeScript check + production build)
   - If build fails: likely a type error — show the error and suggest a fix

4. **Report results** in this format:

```
Preflight Check Results
═══════════════════════
  Lint:  ✓ passed
  Test:  ✓ 15 tests passed (2 files)
  Build: ✓ built in 3.2s

All checks passed — safe to push!
```

Or if something failed:

```
Preflight Check Results
═══════════════════════
  Lint:  ✓ passed
  Test:  ✗ 1 test failed (see above)
  Build: ⊘ skipped (blocked by test failure)

Fix the failing test before pushing.
```

## Rules

- Stop at the first failure — don't run build if tests fail
- Show timing for each step
- If all pass, suggest: `git push -u origin <current-branch>`
- Never auto-push — just report and suggest
