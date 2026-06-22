---
name: e2e-test-debugger
description: Analyzes E2E test failures, classifies root causes, and suggests targeted fixes. Use when tests fail and user wants to understand why and how to fix them. Never auto-fixes.
allowed-tools: Bash, Read, Edit
---

# E2E Test Debugger

Analyzes test failures, classifies root causes, and suggests targeted fixes.

## When to Use

Invoke with `/e2e-test-debugger` or when user says: "debug test", "why did tests fail", "analyze failures", "fix failing test", "what went wrong"

---

## Data Sources (priority order)

1. **`test-results/`** — trace files, screenshots, videos from last run (on-first-retry)
2. **JSON run** — `npx playwright test --reporter=json` on demand
3. **Terminal output** — captured stdout from test run

---

## Workflow

### Step 1 — Collect Failure Data

1. Check for existing results:
   ```bash
   ls test-results/ 2>/dev/null && echo "found" || echo "empty"
   ```
2. If `test-results/` has content → proceed to Step 2
3. If empty → ask user:
   ```
   No test results found. How would you like to proceed?
   1. Run all tests
   2. Run by tag    → npx playwright test --grep @tag
   3. Run specific file
   ```
4. Run tests if needed (capture JSON output for analysis):
   ```bash
   npx playwright test {filter} --reporter=json 2>&1 | tee /tmp/pw-results.json
   ```

---

### Step 2 — Parse & Classify Failures

Parse the JSON output or read `test-results/` directory.

For each failed test, extract:
- Test title and tags (`@smoke`, `@regression`, etc.)
- File path + line number
- Error message + stack trace
- Which `test.step()` failed
- Retry count
- Attached screenshots / traces

Classify each failure:

| Category | Detection Signal | Typical Fix |
|----------|-----------------|-------------|
| **Locator changed** | `locator.click: Error`, `strict mode violation`, `waiting for locator` | Update locator in Page Object |
| **Timeout** | `Timeout NNNms exceeded`, `waiting for` + timeout | Add `waitFor` or increase timeout |
| **Assertion mismatch** | `expect(received).toBe(expected)`, `toHaveText`, `toContain` | Update test data or assertion value |
| **Navigation error** | `ERR_NAME_NOT_RESOLVED`, `net::ERR_`, `page.goto` failed | Check `BASE_URL` in `.env` |
| **Auth expired** | Redirect to login, 401/403, `storageState` error | Re-run auth setup |
| **Flaky** | `retry > 0` and final status `passed` | Add explicit waits, stabilize selector |
| **App regression** | Element found but behavior wrong — none of the above match | Report only — do NOT change tests |

---

### Step 3 — Present Batch Summary

Show ALL failures in one table before deep-diving:

```
# Failure Summary — 3 failed, 1 flaky, 12 passed

| # | Test | File | Category | Confidence |
|---|------|------|----------|------------|
| 1 | book appointment | makeAppointment.spec.ts:9 | Locator changed | HIGH |
| 2 | verify history  | historyAppointment.spec.ts:14 | Assertion mismatch | HIGH |
| 3 | auth setup      | auth.setup.ts:6 | Auth expired | MEDIUM |

Flaky (passed on retry): makeAppointment.spec.ts:9
```

**ASK user:** "Which failures to investigate? (e.g., 1,2 or 'all')"

---

### Step 4 — Deep Investigation

For each selected failure, investigate by category:

**Locator changed:**
1. Read the Page Object file (`page-objects/*.ts`) — identify broken locator
2. Use MCP `browser_snapshot` to get current accessibility tree
3. Compare current page state vs expected locator → identify what changed
4. Propose updated locator following tier priority (getByRole > getByLabel > getByPlaceholder > locator(css))

**Assertion mismatch:**
1. Read the test file → understand what's being asserted
2. Read test data (`test-data/*.ts` or `test-data/common/*.json`) — check expected values
3. If data drift → suggest test data update
4. If logic error → suggest assertion fix

**Auth expired:**
1. Check `playwright/.auth/user.json` — does it exist? Is it valid JSON?
2. Suggest: `npx playwright test --project=setup` to refresh session
3. No code change needed

**Timeout:**
1. Read the test file → identify which step is slow
2. Check if a navigation or API call is involved
3. Distinguish: true slow app vs locator-as-timeout (selector never found)
4. Suggest: add `waitForURL`, increase `timeout`, or fix the underlying selector

**Navigation error:**
1. Check `BASE_URL` in `.env`
2. Check `helpers/EnvValidator.ts` — is the var validated?
3. Verify the URL path exists in the app

**Flaky:**
1. Read retry count — which attempts failed, which passed?
2. Look for race conditions: animations, async data, dynamic content
3. Suggest: `waitForLoadState`, explicit `waitFor`, or locator refinement

Present findings → **WAIT for user approval before suggesting any fix**

---

### Step 5 — Suggest Fixes

| Category | Fix Target | Where |
|----------|-----------|-------|
| Locator changed | Page Object | `page-objects/*.ts` or `page-objects/components/*.ts` |
| Timeout | Test file or Page Object | add `waitForURL` / increase timeout |
| Assertion mismatch | Test data | `test-data/*.ts` factory or `test-data/common/*.json` |
| Auth expired | No code change | re-run `npx playwright test --project=setup` |
| Flaky | Page Object or test file | add explicit waits |
| App regression | **No fix** | report as potential app bug — do NOT update tests to match broken behavior |

- Show proposed change as before/after diff
- **NEVER auto-fix** — wait for user approval, then apply with Edit tool

---

### Step 6 — Verify Fix

Re-run the previously failed tests:
```bash
npx playwright test {file} --project=chromium
```

Report results. Then show:

```
────────────────────────────────────────
What next?
  1. Run again       → verify stability
  2. Run full suite  → npx playwright test
  3. Investigate another failure
  4. Done
────────────────────────────────────────
```

---

## Golden Rules

1. **NEVER auto-fix** — always present diagnosis and wait for approval
2. **Classify before investigating** — show batch summary first, never deep-dive every failure at once
3. **Locator fixes → Page Object only** — update `page-objects/*.ts`, NEVER the test file
4. **Data fixes → test-data only** — update `test-data/` files, NEVER the test file
5. **Auth expired → re-run setup** — never modify tests to work around expired auth
6. **App regression → report only** — never suggest changing tests to match broken app behavior
7. **Read source files first** — always read the test file + Page Object before suggesting any fix
8. **Flaky ≠ broken** — a test that passes on retry is flaky, not a locator/data bug; treat separately
