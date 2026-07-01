---
name: review-pr
description: Reviews a PR (or uncommitted changes) against ALL framework conventions. Runs automated checks, inspects every changed file with a full per-type checklist, assesses test quality, checks PR hygiene, and presents a structured severity-tiered report. Never skips a check. Never auto-fixes. Invoked with /review-pr.
allowed-tools: Bash, Read, Edit
---

# Review PR

Performs a complete, accuracy-first code review against this framework's conventions.
Every rule is checked for every file of the relevant type — no shortcuts, no omissions.

## When to Use

Invoke with `/review-pr` or when user says: "review my PR", "check my code", "review these changes", "is this ready to merge", "review before I push".

---

## Workflow

### Step 1 — Collect PR Context

```bash
gh pr view --json number,title,headRefName,baseRefName,body 2>/dev/null
gh pr diff 2>/dev/null
git branch --show-current
git diff main --name-status 2>/dev/null || git diff origin/main --name-status 2>/dev/null
```

**Case A — PR exists:**
- Use `gh pr diff` as the full diff
- Capture title, branch name, and body for PR hygiene checks in Step 6

**Case B — No PR yet:**
- Use `git diff main` as the diff
- Report: "No open PR found — reviewing uncommitted/unpushed changes on branch `<branch>`"
- Skip Step 6 (PR hygiene) entirely; note this explicitly in the report

Present review scope:

```
Review scope:
  Branch:   test/make-appointment
  PR:       #12 — "test(make-appointment): add smoke test for booking flow"
  Base:     main

Changed files (6):
  M  page-objects/AppointmentPage.ts                   [Page Object]
  A  page-objects/components/DatepickerComponent.ts    [Component]
  A  tests/e2e/makeAppointment.spec.ts                 [Test file]
  M  fixtures/index.ts                                 [Fixture]
  M  page-manager/PageManager.ts                       [Other]
  M  page-objects/NavigationPage.ts                    [Page Object]
```

---

### Step 2 — Run Automated Checks

```bash
npx tsc --noEmit 2>&1
npm run lint 2>&1
```

Surface all errors immediately. Flag every error as 🔴 Blocking in the final report.
Do NOT stop here — continue the full review regardless of results.

---

### Step 3 — Read All Changed Files

Use the `Read` tool to read every changed file **in full** — not just the diff lines.
Violations can exist in unchanged lines (e.g., a constructor that was not modified still has a wrong pattern).

Also read any files the changed code imports (e.g., if a Page Object imports a new Component, read that Component too).

---

### Step 4 — Apply Per-Type Checklists

Run **every check** in the relevant checklist for each changed file.
Mark each item: ✅ (pass) / 🔴 Blocking / 🟡 Suggestion / N/A (with explicit reason).
Never silently omit a check item.

---

#### 4A — Page Object Checklist (`page-objects/*.ts`, excluding `components/`)

| # | Rule | Severity |
|---|------|----------|
| PO-1 | Class `extends BasePage` | 🔴 |
| PO-2 | `BasePage` imported from `@base/BasePage` (alias, not relative) | 🔴 |
| PO-3 | All imports use path aliases — zero relative imports | 🔴 |
| PO-4 | All internal locators declared `private readonly` as class fields before constructor | 🔴 |
| PO-5 | All assertion/confirmation locators declared `readonly` (public) as class fields before constructor | 🔴 |
| PO-6 | Constructor param is `page: Page` | 🔴 |
| PO-7 | Locators initialized in constructor body using `page` param directly — not `this.page` | 🔴 |
| PO-8 | `page` is NOT stored as a second class field — only `super(page)` stores it via `BasePage` | 🔴 |
| PO-9 | All public async methods have explicit `Promise<void>` return type | 🔴 |
| PO-10 | Every method that causes navigation calls `await this.page.waitForURL(...)` | 🔴 |
| PO-11 | Zero `expect()` calls in this file | 🔴 |
| PO-12 | Zero `verifyXxx()` method names | 🔴 |
| PO-13 | Zero standalone `locator.waitFor()` calls (not `waitForURL`) | 🔴 |
| PO-14 | Method names describe business actions (`fillForm`, `bookAppointment`) — not UI steps (`clickButton`, `typeText`) | 🔴 |
| PO-15 | Page Object has a `navigate()` method using `page.goto('/path')` | 🟡 |
| PO-16 | Class name: PascalCase + `Page` suffix | 🟡 |
| PO-17 | File name matches class name exactly (e.g., `AppointmentPage.ts`) | 🟡 |
| PO-18 | Shared UI widget used on 2+ pages is extracted to `components/` — not inlined | 🟡 |
| PO-19 | No hardcoded test data strings inside the page object | 🟡 |

---

#### 4B — Component Checklist (`page-objects/components/*.ts`)

| # | Rule | Severity |
|---|------|----------|
| CO-1 | Class does NOT extend `BasePage` — plain class only | 🔴 |
| CO-2 | Constructor first param: `page: Page` | 🔴 |
| CO-3 | Constructor second param: trigger `Locator`, stored as `private readonly` via shorthand | 🔴 |
| CO-4 | `page` param is used in constructor body to init internal locators — NOT stored as a class field | 🔴 |
| CO-5 | All internal locators declared `private readonly` as class fields | 🔴 |
| CO-6 | Zero `expect()` calls in this file | 🔴 |
| CO-7 | Zero `waitForURL()` calls in this file | 🔴 |
| CO-8 | All imports use path aliases — zero relative imports | 🔴 |
| CO-9 | Class name: PascalCase + `Component` suffix | 🟡 |
| CO-10 | Component is genuinely reusable — used on 2+ pages or clearly designed for it | 🟡 |

---

#### 4C — Test File Checklist (`tests/e2e/*.spec.ts`)

| # | Rule | Severity |
|---|------|----------|
| TF-1 | `import { test, expect } from '@fixtures'` present | 🔴 |
| TF-2 | Zero imports from `@playwright/test` anywhere in the file | 🔴 |
| TF-3 | All other imports use path aliases — zero relative imports | 🔴 |
| TF-4 | `test.describe('Name', { tag: ['@priority', '@feature-tag'] }, ...)` — tags array present | 🔴 |
| TF-5 | Priority tag is one of: `@smoke`, `@regression` | 🔴 |
| TF-6 | Feature tag is `@kebab-case` format | 🔴 |
| TF-7 | Every logical action group wrapped in numbered `test.step('N. Description', async () => {...})` | 🔴 |
| TF-8 | All `expect()` calls are inside a `test.step` — never bare in the test body | 🔴 |
| TF-9 | Verify steps are named `test.step('N. Verify ...', ...)` | 🟡 |
| TF-10 | File contains at least one `expect()` call | 🔴 |
| TF-11 | Zero `new XxxPage(page)` — always use injected fixtures from `@fixtures` | 🔴 |
| TF-12 | Test data from factory functions (`generateXxxData()`) or `loadTestData()` — zero hardcoded domain values as assertion targets or form inputs | 🔴 |
| TF-13 | File name: camelCase + `.spec.ts` | 🟡 |
| TF-14 | Steps numbered sequentially without gaps | 🟡 |
| TF-15 | Step descriptions are intent-level (what the user does), not implementation-level (what the code does) | 🟡 |
| TF-16 | Test covers a real end-to-end scenario with at least one meaningful assertion — not just navigation | 🔴 |
| TF-17 | Zero inline locators (CSS selectors, `getByRole(...)` calls) in the test file — all locators live in Page Objects | 🔴 |

---

#### 4D — Fixture Checklist (`fixtures/index.ts`)

| # | Rule | Severity |
|---|------|----------|
| FX-1 | All fixture names declared in the `TestFixtures` type | 🔴 |
| FX-2 | Every fixture implementation contains `await use(data)` | 🔴 |
| FX-3 | Fixtures that need browser state use injected page object fixtures — not raw `page` directly | 🔴 |
| FX-4 | `export { expect } from '@playwright/test'` present at the bottom | 🔴 |
| FX-5 | Zero test assertions (`expect()`) inside fixture implementations | 🔴 |
| FX-6 | Fixture serves a genuine shared precondition reused across multiple tests — not a one-off | 🟡 |

---

#### 4E — Other Files

**`fixtures/index.ts`:**
- Every new Page Object has an entry in `TestFixtures` type AND a fixture implementation
- Page Object fixtures: `async ({ page }, use) => { await use(new XxxPage(page)); }`
- Precondition fixtures declare their page object dependencies (e.g. `{ appointmentPage }`) — NOT raw `page`
- Imports use `@page-objects/*` aliases

**`test-data/*.ts`:**
- Interface exported alongside factory function
- Factory function named `generateXxxData` with `overrides?: Partial<XxxData>` param
- Dynamic values use faker or date computation

**Other files (`helpers/`, `api/`, config files):**
- Note structural deviations from existing patterns
- Flag any relative imports

---

### Step 5 — Assess Test Quality

Evaluate across all changed test files:

**Coverage:**
- Does the test cover the described feature end-to-end?
- Are assertions verifying meaningful outcomes — not just "page loaded"?

**Data patterns:**
- Is `generateXxxData()` the entry point with `overrides?: Partial<T>`?
- Are hardcoded values present where dynamic data is more appropriate?

**Step clarity:**
- Are step descriptions readable by a non-technical person?
- Does step numbering tell a coherent user story?

**Fixture usage:**
- If multiple tests share a precondition, is a fixture used instead of duplicating setup?
- Is the right fixture chosen (e.g., `bookedAppointment` when starting from "already booked")?

---

### Step 6 — Check PR Hygiene *(Case A only — skip and note in Case B)*

**Branch name:**
- Must match `test/<feature-tag>` or `test/<parent>-<feature-tag>`
- No uppercase, no spaces — 🔴 Blocking if violated

**PR title:**
- Format: `type(scope): description` (Conventional Commits)
- Valid types: `test`, `feat`, `fix`, `refactor`
- `scope` = feature tag in kebab-case
- Description: imperative mood, no capital, no period, max 72 chars total — 🔴 Blocking if violated

**PR description — all 4 sections required (🔴 Blocking if any missing):**
- `## Summary` — at least one bullet point
- `## Test Coverage` — table with File / Type / Description columns
- `## Test Results` — must document 2 consecutive passing runs
- `## Dependencies` — may be `_None_` but must exist

---

### Step 7 — Present Structured Review

Show the complete review in this format. Never abbreviate.

```
════════════════════════════════════════════════════════════
CODE REVIEW — PR #12: test(make-appointment): add smoke test
════════════════════════════════════════════════════════════

AUTOMATED CHECKS
────────────────
  TypeScript (tsc --noEmit):  ✅ No errors
  ESLint (npm run lint):      ✅ No errors

────────────────────────────────────────────────────────────
FILE: page-objects/AppointmentPage.ts  [Page Object]
────────────────────────────────────────────────────────────
  ✅ PO-1   extends BasePage
  ✅ PO-2   @base/BasePage alias used
  ✅ PO-3   All imports use aliases
  ✅ PO-4   Internal locators private readonly
  ✅ PO-5   Assertion locators readonly public
  ✅ PO-6   Constructor param: page: Page
  🔴 PO-7   Locators initialized with this.page instead of page param
              Line 22: this.facilitySelect = this.page.getByRole(...)
              Fix: this.facilitySelect = page.getByRole(...)
  ✅ PO-8   page not stored as extra field
  ✅ PO-9   Async methods return Promise<void>
  ✅ PO-10  waitForURL() in bookAppointment()
  ✅ PO-11  No expect() in file
  ✅ PO-12  No verifyXxx() methods
  ✅ PO-13  No standalone locator.waitFor()
  ✅ PO-14  Method names are business actions
  ✅ PO-15  PascalCase + Page suffix
  ✅ PO-16  File name matches class name
  N/A PO-17 Datepicker already extracted to DatepickerComponent — no inlining
  ✅ PO-18  No hardcoded test data

────────────────────────────────────────────────────────────
FILE: tests/e2e/makeAppointment.spec.ts  [Test file]
────────────────────────────────────────────────────────────
  ✅ TF-1   import { test, expect } from '@fixtures'
  ✅ TF-2   No @playwright/test import
  ✅ TF-3   All imports use aliases
  🔴 TF-4   Tags missing on test.describe
              Line 4: test.describe('Make Appointment', () => {
              Fix: test.describe('Make Appointment', { tag: ['@smoke', '@make-appointment'] }, () => {
  N/A TF-5  Cannot validate — no tags (see TF-4)
  N/A TF-6  Cannot validate — no tags (see TF-4)
  ✅ TF-7   All action groups in test.step
  ✅ TF-8   All expect() inside test.step
  🟡 TF-9   Step 4 label "Verify confirmation details" could be more specific
  ✅ TF-10  File has expect() calls
  ✅ TF-11  pageManager.onAppointmentPage() — no new XxxPage()
  🔴 TF-12  Hardcoded value in assertion
              Line 23: toHaveText('Yes')
              Fix: toHaveText(data.readmission ? 'Yes' : 'No')
  ✅ TF-13  camelCase + .spec.ts
  ✅ TF-14  Steps numbered 1–4, sequential
  ✅ TF-15  Step descriptions are intent-level
  ✅ TF-16  Full end-to-end — 5 fields asserted on confirmation
  ✅ TF-17  No inline locators in test file

────────────────────────────────────────────────────────────
TEST QUALITY
────────────────────────────────────────────────────────────
  Coverage:      ✅ Booking flow fully covered
  Data patterns: ✅ generateAppointmentData() used
  Step clarity:  ✅ Steps tell a coherent story
  Fixtures:      ✅ Self-contained — no shared precondition, no fixture needed

────────────────────────────────────────────────────────────
PR HYGIENE
────────────────────────────────────────────────────────────
  Branch name:         ✅ test/make-appointment
  PR title format:     ✅ test(make-appointment): add smoke test for booking flow
  PR title length:     ✅ 51 chars
  Summary section:     ✅ Present
  Test Coverage table: ✅ Present
  Test Results:        🔴 Only 1 run documented — 2 consecutive passes required
  Dependencies:        ✅ _None_ declared

════════════════════════════════════════════════════════════
SUMMARY
════════════════════════════════════════════════════════════
🔴 Blocking — must fix before merge (3):
  1. [PO-7]  AppointmentPage.ts:22 — use page param, not this.page, in constructor
  2. [TF-4]  makeAppointment.spec.ts:4 — add { tag: ['@smoke', '@make-appointment'] }
  3. [TF-12] makeAppointment.spec.ts:23 — data.readmission ? 'Yes' : 'No'
  4. [PR]    Test Results documents only 1 run — need 2 consecutive passes

🟡 Suggestions (1):
  1. [TF-9]  Step 4 description could be more specific about what fields are verified

✅ All other checks passed.
════════════════════════════════════════════════════════════
```

---

### Step 8 — Wait for User Decision ← ONLY CONFIRMATION GATE

```
────────────────────────────────────────
Review complete. What would you like to do?

  1. Approve          → post approval on the PR
  2. Request changes  → post blocking items as review comment
  3. Comment only     → post full summary as neutral comment
  4. Fix issues now   → walk through each blocking item together
  5. Done             → no action needed
────────────────────────────────────────
```

**WAIT for user input. Take no action until a choice is made.**

If user selects **1 (Approve)** and blocking items exist:
```
⚠️  There are N blocking items outstanding. Approve anyway? Type "yes" to confirm.
```
Wait for explicit "yes" before posting.

If user selects **2 (Request changes):**
```bash
gh pr review <number> --request-changes --body "<blocking items as markdown list>"
```

If user selects **1 (Approve)** with no blocking items:
```bash
gh pr review <number> --approve --body "LGTM — all framework conventions satisfied."
```

If user selects **3 (Comment):**
```bash
gh pr review <number> --comment --body "<full summary>"
```

If user selects **4 (Fix issues now):**
For each blocking item in order:
1. Show exact before/after diff
2. WAIT for user approval on this specific item
3. Apply with Edit tool only after approval
4. After all fixes: re-run `npx tsc --noEmit && npm run lint`

---

## Golden Rules

1. **NEVER skip a checklist item** — if not applicable, write N/A + reason; never silently omit
2. **NEVER auto-proceed past Step 7** — always present the full report and wait for the user's decision in Step 8
3. **NEVER auto-fix** — each fix requires explicit per-item approval from the user
4. **Blocking means blocking** — never soften a 🔴 to 🟡 to make the report friendlier
5. **Read full files, not just the diff** — use the Read tool for every changed file in its entirety; violations exist in unchanged lines too
6. **Automated check failures are always 🔴** — TypeScript errors and ESLint errors are never suggestions
7. **PR hygiene checks only in Case A** — explicitly note the skip when reviewing uncommitted changes (Case B)
8. **Test Results require 2 consecutive passes** — documenting one run is always 🔴 Blocking
9. **`this.page` in constructor body = PO-7 violation** — using `this.page` inside method bodies is correct; using it in the constructor to initialize locators is the violation
10. **If `gh` is not authenticated** — tell the user to run `gh auth login`, proceed with file-only review, and skip Step 6 entirely
