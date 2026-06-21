---
name: test-generator-e2e
description: Generates Playwright E2E tests for this hybrid framework. Use when user wants to create new tests or automate a new feature. Invoked with /test-generator-e2e.
allowed-tools: Read, Write, Edit, Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_fill_form, mcp__playwright__browser_type, mcp__playwright__browser_press_key, mcp__playwright__browser_evaluate, mcp__playwright__browser_take_screenshot
---

# Test Generator

Generates Playwright E2E tests following this project's hybrid framework conventions.

## When to Use

Invoke with `/test-generator-e2e` or when user says: "generate test", "create test", "write test for [feature]", "new test"

## Welcome Message

ALWAYS show this when the skill starts:

```
Welcome to Test Generator!

Provide your test spec:

Feature: [feature name]
URL: [page path, e.g. /appointment]
Priority: [smoke / regression]
Feature tag: [kebab-case, e.g. make-appointment]

Scenarios:
- name: [test name]
  steps:
    1. [step description]
    2. [step description]

See references/examples.md for a full worked example.
```

## Workflow

### Step 1 — Parse & Plan

Parse the input. Ask ONLY what's missing:

| Question | Default |
|----------|---------|
| Priority? (smoke / regression) | regression |
| Feature tag? (kebab-case) | derived from feature name |
| Does the main action navigate to a new page/URL? | ask if unclear |

Present a plan before doing anything:

```
Feature: Make Appointment
Priority: smoke
Feature tag: make-appointment

Files to create:
  page-objects/AppointmentPage.ts        NEW
  test-data/AppointmentData.ts           NEW
  tests/e2e/makeAppointment.spec.ts      NEW

Files to update:
  page-objects/NavigationPage.ts         add navigateToMakeAppointment()
  page-manager/PageManager.ts            add onAppointmentPage()

Scenarios: 1 test, 4 steps
```

**WAIT for user confirmation before proceeding.**

---

### Step 2 — Explore UI

Use Playwright MCP to explore. Always capture BOTH:

1. **Form / action page** — all interactive elements (inputs, buttons, selects, checkboxes, radios)
2. **Result / confirmation page** — all assertion targets (navigate through the full user flow to get there)

Locator priority — always use the highest available tier:

| Tier | Locator | When |
|------|---------|------|
| 1 | `getByRole` | buttons, inputs, comboboxes, checkboxes, radios, headings, links |
| 2 | `getByLabel` | labeled form fields |
| 3 | `getByPlaceholder` | inputs with placeholder text |
| 4 | `getByText` | static text / labels |
| 5 | `locator(css)` | last resort — only when no semantic locator works |

Present all discovered locators grouped by page:

```
Form page (/#appointment):
  facilitySelect       → getByRole('combobox', { name: 'Facility' })
  readmissionCheckbox  → getByRole('checkbox', { name: 'Apply for hospital readmission' })
  visitDateInput       → getByPlaceholder('dd/mm/yyyy')
  commentInput         → getByRole('textbox', { name: 'Comment' })
  bookButton           → getByRole('button', { name: 'Book Appointment' })

Confirmation page (/appointment.php#summary):
  confirmFacility      → locator('#facility')
  confirmReadmission   → locator('#hospital_readmission')
  confirmProgram       → locator('#program')
  confirmVisitDate     → locator('#visit_date')
  confirmComment       → locator('#comment')
```

**WAIT for user confirmation before proceeding.**

---

### Step 3 — Generate Page Object

Follow `references/templates.md` Page Object template exactly.

Rules:
- All locators declared as `private readonly` fields above the constructor
- Confirmation / assertion locators declared as `readonly` (public)
- Constructor initializes every locator using the `page` parameter (NOT `this.page`)
- Methods named after business actions (e.g. `fillForm`, `bookAppointment`) — not UI steps
- `waitForURL(...)` inside any method that causes page navigation
- NO `expect()`, NO `verifyXxx()`, NO `waitFor()` in page objects

Present the full code → **WAIT for user confirmation before writing any file.**

After confirmed, in order:
1. Write `page-objects/XxxPage.ts`
2. Update `page-objects/NavigationPage.ts` — add `navigateToXxx()` method + locator in constructor
3. Update `page-manager/PageManager.ts` — add `private readonly xxxPage` field + `onXxxPage()` getter
4. Run `npx tsc --noEmit` then `npm run lint`
5. Report results. If errors → show full output, NEVER auto-fix, ask user how to proceed.

---

### Step 4 — Generate Test Data

Identify all data values from the scenarios. Classify each as:

- **Dynamic** → faker factory function in `test-data/XxxData.ts`
  Use when: values need to be unique per run (form inputs, names, dates, generated content)
- **Static** → JSON file in `test-data/common/xxx.json`
  Use when: values must be fixed and reproducible (known IDs, expected labels, error messages)

Present the classification:

```
Dynamic (factory in test-data/AppointmentData.ts):
  facility, readmission, healthcareProgram, visitDate, comment
  → generateAppointmentData(overrides?: Partial<AppointmentData>)

Static JSON (test-data/common/appointment.json):
  (none identified for this feature)
```

**WAIT for user confirmation before writing any file.**

---

### Step 4.5 — Fixture Analysis

Read `fixtures/index.ts` to understand what fixtures already exist, then analyze the test's preconditions.

**Decision logic:**

| Situation | Action |
|-----------|--------|
| Test needs setup steps that already exist as a fixture | Reuse existing fixture — do NOT duplicate steps in the test |
| Multiple tests share the same precondition (e.g. "already booked", "user created") | Propose a new fixture in `fixtures/index.ts` |
| Test is self-contained with no reusable precondition | No fixture needed |

Present the analysis and recommendation:

```
Fixture analysis:
  Existing fixtures: pageManager, apiManager, loggedInPage

  This test requires "an appointment already booked" as precondition.
  Same precondition may be needed by other history/verification tests.

  Recommendation: create bookedAppointment fixture in fixtures/index.ts
    → navigates to Make Appointment, fills form, books, returns AppointmentData
    → test only needs to handle post-booking steps

  Alternative: inline setup steps in the test (simpler, but duplicates code if reused)
```

**WAIT for user confirmation before proceeding.**

If user confirms fixture creation:
1. Update `fixtures/index.ts` — add type + fixture implementation
2. Run `npx tsc --noEmit` then `npm run lint`
3. Report results. If errors → show full output, NEVER auto-fix.

---

### Step 5 — Generate Test File

Follow `references/templates.md` Test File template exactly.

Rules:
- `import { test, expect } from '@fixtures'` — NEVER from `@playwright/test`
- `test.describe('Feature Name', { tag: ['@priority', '@feature-tag'] }, () => { ... })`
- Each logical group of actions wrapped in a numbered `test.step()`
- All assertions inside `test.step('N. Verify ...')`
- Use `pageManager.onXxxPage()` — NEVER `new XxxPage(page)` in test files
- Dynamic data via factory function, static data via `loadTestData()` if JSON file exists

Present the full code → **WAIT for user confirmation before writing any file.**

After confirmed:
1. Write `tests/e2e/xxx.spec.ts`
2. Run `npx tsc --noEmit` then `npm run lint`
3. Report results. If errors → show full output, NEVER auto-fix.

---

### Step 6 — Run & Validate

```bash
npx playwright test tests/e2e/xxx.spec.ts --project=chromium
```

- ✅ All passed → show prompt chaining menu
- ❌ Failures → show full error output + screenshot path if available, suggest a fix, **NEVER auto-fix**

Must pass **2 consecutive runs** before marking as done.

---

### Prompt Chaining Menu

Show after every test run (pass or fail):

```
────────────────────────────────────────
What next?
  1. Run again              → verify stability
  2. Fix a failing step     → describe what failed
  3. Add more scenarios     → to this feature
  4. New feature test       → /test-generator
  5. Done
────────────────────────────────────────
```

Wait for user input before taking any action.

---

## Golden Rules

1. **NEVER auto-proceed** — stop and wait at every step gate
2. **One approval per step** — "proceed" on Step 3 does NOT unlock Step 4 or 5
3. **NEVER auto-fix** — show errors, present options, let user decide
4. **NEVER inline locators in test files** — all locators live in Page Objects only
5. **NEVER import from `@playwright/test`** — always use `@fixtures`
6. **NEVER use `new XxxPage(page)` in tests** — always use `pageManager.onXxxPage()`
7. **NEVER skip confirmation page exploration** — need locators for assertions
8. **ALWAYS run `tsc + lint` after writing files** — catch errors before test run
9. **ALWAYS confirm stability with 2 consecutive passes**
10. **ALWAYS update NavigationPage + PageManager** when adding a new page
11. **ALWAYS run Step 4.5 fixture analysis** — never skip it, even if no fixture is needed; always show the recommendation and wait for confirmation before writing the test file
12. **NEVER create a fixture** without explicit user confirmation — present the recommendation, explain the tradeoff, let user decide
