---
name: test-generator-e2e
description: Generates Playwright E2E tests for this hybrid framework. Use when user wants to create new tests or automate a new feature. Invoked with /test-generator-e2e.
allowed-tools: Read, Write, Edit, Bash
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

Components:
  page-objects/components/DatepickerComponent.ts   REUSE   ← datepicker already extracted
  (none needed)                                    ← if no shared UI element detected

Scenarios: 1 test, 4 steps
```

**WAIT for user confirmation before proceeding.**

---

### Step 2 — Explore UI

Use `playwright-cli` to explore the UI. Claude runs all commands — no user interaction needed.
Always capture BOTH pages: form page AND confirmation/result page.

#### Step 2a — Pre-flight check

```bash
bash .claude/skills/test-generator-e2e/scripts/pre-explore.sh
```

This checks auth freshness (`playwright/.auth/user.json`). If stale or missing, it re-runs `--project=setup` automatically.

#### Step 2b — Open session and navigate

```bash
npx playwright-cli open
npx playwright-cli state-load playwright/.auth/user.json
npx playwright-cli goto <BASE_URL><URL>
npx playwright-cli snapshot
```

Read the snapshot file to get element refs (e1, e2, e15...). Use refs in all subsequent commands.

#### Step 2c — Explore form page

Interact with every element on the form to discover its role and label:

```bash
npx playwright-cli snapshot                        # Get all element refs on form page
npx playwright-cli screenshot                      # Visual reference
npx playwright-cli hover {dropdownRef}             # Expand dropdowns/menus if needed
npx playwright-cli snapshot                        # Re-snapshot after hover
```

#### Step 2d — Navigate through full flow to confirmation page

Fill the form and submit to reach the confirmation/result page:

```bash
npx playwright-cli fill {inputRef} "test value"
npx playwright-cli select {dropdownRef} "option"
npx playwright-cli check {checkboxRef}
npx playwright-cli click {submitButtonRef}
npx playwright-cli snapshot                        # Snapshot confirmation page
npx playwright-cli screenshot                      # Visual reference
```

#### Step 2e — Command reference

| Category | Commands |
|----------|----------|
| Navigate | `goto <url>`, `go-back`, `reload` |
| Snapshot | `snapshot`, `snapshot --filename=name` |
| Screenshot | `screenshot`, `screenshot {ref}` |
| Click/Hover | `click {ref}`, `hover {ref}`, `dblclick {ref}` |
| Fill/Type | `fill {ref} <text>`, `type <text>` |
| Form | `select {ref} <value>`, `check {ref}`, `uncheck {ref}` |
| Keyboard | `press <key>` (Enter, Escape, Tab, ArrowDown) |
| Evaluate | `eval "() => document.title"`, `eval "(el) => el.textContent" {ref}` |
| Tabs | `tab-list`, `tab-new [url]`, `tab-select <index>` |
| Storage | `state-load <file>`, `state-save [file]` |
| Cleanup | `close` |

#### Step 2f — Rewrite locators to tier priority

After exploration, map every discovered element to the highest applicable locator tier:

| Tier | Method | When |
|------|--------|------|
| 1 | `getByRole` | buttons, inputs, comboboxes, checkboxes, radios, headings, links |
| 2 | `getByLabel` | form fields with a visible label |
| 3 | `getByPlaceholder` | inputs with placeholder text |
| 4 | `getByText` | static text / labels with no role |
| 5 | `locator(css)` | last resort — no semantic alternative exists |

Use `generate-locator {ref}` to get Playwright's suggested locator for any element:
```bash
npx playwright-cli generate-locator {ref}
```

Present all discovered locators grouped by page:

```
Form page (/<url>):
  facilitySelect       → getByRole('combobox', { name: 'Facility' })
  readmissionCheckbox  → getByRole('checkbox', { name: 'Apply for hospital readmission' })
  visitDateInput       → getByPlaceholder('dd/mm/yyyy')
  commentInput         → getByRole('textbox', { name: 'Comment' })
  bookButton           → getByRole('button', { name: 'Book Appointment' })

Confirmation page (/result-url):
  confirmFacility      → locator('#facility')
  confirmReadmission   → locator('#hospital_readmission')
  confirmProgram       → locator('#program')
  confirmVisitDate     → locator('#visit_date')
  confirmComment       → locator('#comment')
```

Close the session after exploration:
```bash
npx playwright-cli close
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
- If a UI element (datepicker, modal, toast, table) appears on 2+ pages → extract to `page-objects/components/XxxComponent.ts` and instantiate it in the Page Object constructor instead of inlining the logic. Check `page-objects/components/` for existing components before creating new ones.

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
  4. New feature test       → /test-generator-e2e
  5. Create PR              → /create-pr
  6. Done
────────────────────────────────────────
```

Option 5 is only shown after 2 consecutive passes. When selected, hand off to the create-pr skill with the feature tag already known from this session.

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
