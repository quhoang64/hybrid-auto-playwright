# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm ci

# Install Playwright browsers (required on a fresh environment)
npx playwright install --with-deps

# Run all tests
npm test

# Run only E2E tests
npm run test:e2e

# Run only API tests
npm run test:api

# Run in interactive UI mode
npm run test:ui

# Run headed (visible browser window)
npm run test:headed

# View the HTML report from the last run
npm run report

# Run a single test file
npx playwright test tests/e2e/makeAppointment.spec.ts

# Run tests for a specific browser only
npx playwright test --project=chromium

# Debug a test step-by-step
npx playwright test --debug

# Lint — check code errors và convention
npm run lint

# Lint với auto-fix
npm run lint:fix

# Format toàn bộ code với Prettier
npm run format
```

## Architecture

Hybrid framework (UI + API): Tests → Fixtures → Managers → Objects → Base

```
base/
  BasePage.ts             foundation for all Page Objects
page-objects/
  components/
    *Component.ts         reusable UI components (datepicker, modal…) — used by Page Objects
  *Page.ts                one file per page, extends BasePage
page-manager/
  PageManager.ts          single entry point to all page objects
api/
  BaseApi.ts              foundation for all API classes
  *Api.ts                 one file per API domain, extends BaseApi
  ApiManager.ts           single entry point to all API classes
fixtures/
  index.ts                injects pageManager + apiManager + loggedInPage into tests
test-data/
  common/
    *.json                static test data — reproducible, use when need fixed data
  *Data.ts                interfaces + faker factory functions (dynamic data)
helpers/
  DataLoader.ts           loadTestData<T>() — reads JSON from test-data/common/
  EnvValidator.ts         validates required env vars before tests run
tests/
  e2e/                    UI/browser tests
  api/                    pure API tests (no browser)
  auth.setup.ts           runs before all browser projects — login once, save session
global-setup.ts           runs first — validates .env before anything else
.claude/
  skills/
    test-generator-e2e/   skill to generate tests — invoke with /test-generator-e2e
```

## Layer responsibilities

- **BasePage** — holds `page: Page` and shared helpers. Never instantiated directly.
- **Components** (`page-objects/components/`) — reusable UI widgets shared across multiple pages (e.g. `DatepickerComponent`). Not a BasePage subclass — instantiated directly inside Page Object constructors. Extract to a component when the same UI element appears on 2+ pages.
- **Page Objects** — encapsulate locators and user actions for one page. All locators declared as `private readonly` fields in the constructor. Methods named after business actions (e.g. `fillForm`, `bookAppointment`), not UI steps.
- **PageManager** — owns one instance of every Page Object. Methods prefixed `on`. Tests never instantiate Page Objects directly.
- **BaseApi** — holds `request: APIRequestContext`. All API classes extend this.
- **ApiManager** — owns one instance of every API class. Methods prefixed `on`.
- **Fixtures** (`fixtures/index.ts`) — extends Playwright's `test` with `pageManager`, `apiManager`, `loggedInPage`. Always import `test`/`expect` from `@fixtures`, never from `@playwright/test` directly.

## Page Object — locator pattern

All locators are declared in the constructor. Methods only reference `this.locatorName`:

```typescript
export class AppointmentPage extends BasePage {
  // private: form locators (only used inside this class)
  private readonly facilitySelect: Locator;
  private readonly bookButton: Locator;

  // readonly (public): confirmation locators (accessed in test assertions)
  readonly confirmFacility: Locator;

  constructor(page: Page) {
    super(page);
    this.facilitySelect = page.getByRole('combobox', { name: 'Facility' });
    this.bookButton = page.getByRole('button', { name: 'Book Appointment' });
    this.confirmFacility = page.locator('#facility');
  }

  async fillForm(data: AppointmentData) {
    await this.facilitySelect.selectOption(data.facility); // uses this.xxx
  }
}
```

## Page Object — component pattern

When a UI widget (datepicker, modal, toast…) appears on 2+ pages, extract it to `page-objects/components/`. The component receives `page` and a trigger `Locator` in its constructor — making it reusable across any page with that widget.

```typescript
// page-objects/components/DatepickerComponent.ts
export class DatepickerComponent {
  constructor(page: Page, private readonly input: Locator) {
    // locators scoped to the datepicker DOM
  }
  async selectDate(date: string): Promise<void> { ... }
}

// page-objects/AppointmentPage.ts — consumes the component
export class AppointmentPage extends BasePage {
  private readonly datepicker: DatepickerComponent;

  constructor(page: Page) {
    super(page);
    this.datepicker = new DatepickerComponent(page, page.getByPlaceholder('dd/mm/yyyy'));
  }

  async fillForm(data: AppointmentData) {
    await this.datepicker.selectDate(data.visitDate); // no duplication
  }
}

// page-objects/ReschedulePage.ts — reuses the same component, different input
export class ReschedulePage extends BasePage {
  private readonly datepicker: DatepickerComponent;

  constructor(page: Page) {
    super(page);
    this.datepicker = new DatepickerComponent(page, page.getByPlaceholder('Reschedule date'));
  }
}
```

**Rules:**
- Components are NOT BasePage subclasses — they are plain classes instantiated inside Page Object constructors
- Check `page-objects/components/` before inlining shared UI logic into a Page Object
- Components never call `expect()` or `waitForURL()`

## Adding a new component

1. Create `page-objects/components/MyComponent.ts`
2. Instantiate it inside the relevant Page Object constructor(s) — pass `page` + the trigger locator specific to that page

## Path aliases

| Alias | Resolves to |
|---|---|
| `@fixtures` | `fixtures/index.ts` |
| `@base/*` | `base/*` |
| `@page-objects/*` | `page-objects/*` |
| `@page-manager/*` | `page-manager/*` |
| `@api/*` | `api/*` |
| `@test-data/*` | `test-data/*` |
| `@helpers/*` | `helpers/*` |

## When to update what

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Thêm page mới | Tạo `page-objects/MyPage.ts`, thêm vào `PageManager` + `NavigationPage` |
| Thêm UI component dùng chung (2+ pages) | Tạo `page-objects/components/MyComponent.ts`, dùng trong Page Object constructor |
| Thêm API endpoint mới | Tạo `api/MyApi.ts`, thêm vào `ApiManager` |
| Thêm precondition / teardown | Thêm fixture mới vào `fixtures/index.ts` |
| Thêm test data model (dynamic) | Tạo `test-data/MyData.ts` với interface + faker factory |
| Thêm test data (static/fixed) | Thêm vào `test-data/common/*.json` |
| Thêm shared utility | Tạo file trong `helpers/` |
| Thêm required env var | Cập nhật `helpers/EnvValidator.ts` + `.env.example` |

`PageManager` và `ApiManager` là công cụ trung lập — không chứa logic setup/teardown, không biết test cần login hay không. Fixture mới chỉ tạo khi có precondition/teardown cần tái sử dụng ở nhiều tests. Test tự khai báo fixture nào nó cần.

## Writing a new test

```typescript
import { test, expect } from '@fixtures';
import { generateAppointmentData } from '@test-data/AppointmentData'; // dynamic (faker)

test.describe('Feature Name', { tag: ['@smoke', '@feature-tag'] }, () => {
  test('scenario name', async ({ pageManager }) => {
    const data = generateAppointmentData();
    const appointmentPage = pageManager.onAppointmentPage();

    await test.step('1. Navigate to page', async () => {
      await pageManager.onNavigationPage().navigateToMakeAppointment();
    });

    await test.step('2. Fill form', async () => {
      await appointmentPage.fillForm(data);
    });

    await test.step('3. Submit', async () => {
      await appointmentPage.bookAppointment();
    });

    await test.step('4. Verify confirmation', async () => {
      await expect(appointmentPage.confirmFacility).toHaveText(data.facility);
    });
  });
});
```

**Rules:**
- Wrap every logical group in `test.step('N. Description', ...)`
- All assertions go inside `test.step('N. Verify ...')`
- Use `pageManager.onXxxPage()` — never `new XxxPage(page)`

## Hybrid pattern (API setup → UI verify → API teardown)

```typescript
test('hybrid test', async ({ pageManager, apiManager }) => {
  const user = generateUser();
  const created = await apiManager.onUserApi().createUser(user);  // fast, no UI
  // ... verify on UI via pageManager ...
  await apiManager.onUserApi().deleteUser(created.id);            // clean teardown
});
```

## Auth

**Luồng chạy:**
```
global-setup.ts   → EnvValidator: kiểm tra .env có đủ biến không (không mở browser)
auth.setup.ts     → mở browser, login thật, lưu session → playwright/.auth/user.json
tests             → load session từ file, bắt đầu test (đã logged in)
```

- `playwright/.auth/` is git-ignored
- Nếu app không hỗ trợ storageState: dùng `loggedInPage` fixture thay vì `page` — login qua UI mỗi test nhưng không duplicate code

## Skills

### `/test-generator-e2e`

Auto-generate a full test from a natural language spec.

Handles: UI exploration → Page Object → Test Data → fixture analysis → Test File → run & validate → Create PR.

**Input format:**
```
Feature: [feature name]
URL: [page path]
Priority: [smoke / regression]
Feature tag: [kebab-case]

Scenarios:
- name: [test name]
  steps:
    1. [step]
    2. [step]
```

See `.claude/skills/test-generator-e2e/SKILL.md` for full workflow and golden rules.

### `/e2e-test-debugger`

Analyze test failures after a test suite run — classify root causes and suggest targeted fixes.

**When to use:** run `npm test` → some tests fail → invoke this skill to understand why.

Handles: collect results → batch classify → deep investigate → suggest fix → verify.

| Category | Action |
|----------|--------|
| Locator changed | update `page-objects/*.ts` |
| Assertion mismatch | update `test-data/` |
| Auth expired | re-run `npx playwright test --project=setup` |
| Flaky | add explicit waits |
| **App regression** | **report only — never change tests to match broken behavior** |

See `.claude/skills/e2e-test-debugger/SKILL.md` for full workflow and golden rules.

### `/create-pr`

Create branch → commit → push → open PR with auto-generated description.

Handles sub-branch strategy when a parent branch has an open unmerged PR.

**When to use:** after tests pass 2 consecutive times, before merging to `main`.

See `.claude/skills/create-pr/SKILL.md` for branch naming conventions and PR title format.

### `/review-pr`

Review a PR (or uncommitted changes) against ALL framework conventions before merging.

**When to use:** before merging a feature branch — run this to catch convention violations, missing checks, or test quality issues.

Handles: automated checks (tsc + lint) → read all changed files → per-type checklists → test quality → PR hygiene → structured severity report → user decides action.

| Checklist | Items |
|-----------|-------|
| Page Object | PO-1 to PO-18 (locator pattern, naming, BasePage, no expect, etc.) |
| Component | CO-1 to CO-10 (no BasePage, constructor pattern, no expect, etc.) |
| Test File | TF-1 to TF-17 (imports, tags, test.step, assertions, no inline locators, etc.) |
| Fixture | FX-1 to FX-6 (type registration, await use, no assertions, etc.) |

**Never auto-fixes** — presents findings and waits for user decision (Approve / Request Changes / Fix / Done).

See `.claude/skills/review-pr/SKILL.md` for full checklist and golden rules.

## Adding a new page

1. Create `page-objects/MyNewPage.ts` extending `BasePage` from `@base/BasePage`
2. Add `navigateToMyNew()` in `page-objects/NavigationPage.ts` (locator in constructor)
3. Add private field + `onMyNewPage()` getter in `page-manager/PageManager.ts`

## Adding a new API class

1. Create `api/MyNewApi.ts` extending `BaseApi` from `@api/BaseApi`
2. Add private field + `onMyNewApi()` getter in `api/ApiManager.ts`

## Environment

- Copy `.env.example` to `.env` and fill in values before running tests
- Required vars: `BASE_URL`, `USER_NAME`, `USER_PASSWORD`
- Tests use `page.goto('/')` — Playwright auto-prepends `baseURL` from `.env`
- Adding a new required var: update `helpers/EnvValidator.ts` + `.env.example`

## Code quality

- ESLint 9 flat config (`eslint.config.mjs`) — runs automatically on `git commit` via Husky
- Prettier (`.prettierrc`) — auto-formats on commit
- `npm run lint:fix` to fix ESLint errors manually
- Tests without assertions trigger `playwright/expect-expect` warning — always add `expect()`
