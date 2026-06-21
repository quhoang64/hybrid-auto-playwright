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
npx playwright test tests/e2e/usePageObjects.spec.ts

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
  BasePage.ts             (reserved — do not put page classes here)
  DataLoader.ts           loadTestData<T>() — reads JSON from test-data/common/
  EnvValidator.ts         validates required env vars before tests run
tests/
  e2e/                    UI/browser tests
  api/                    pure API tests (no browser)
  auth.setup.ts           runs before all browser projects — login once, save session
global-setup.ts           runs first — validates .env before anything else
```

## Layer responsibilities

- **BasePage** — holds `page: Page` and shared helpers. Never instantiated directly.
- **Page Objects** — encapsulate locators and user actions for one page. Methods named after business actions, not UI steps (e.g. `submitInlineFormWithNameAndEmail`, not `clickSubmitButton`).
- **PageManager** — owns one instance of every Page Object. Methods prefixed `on`. Tests never instantiate Page Objects directly.
- **BaseApi** — holds `request: APIRequestContext`. All API classes extend this.
- **ApiManager** — owns one instance of every API class. Methods prefixed `on`.
- **Fixtures** (`fixtures/index.ts`) — extends Playwright's `test` with `pageManager`, `apiManager`, `loggedInPage`. Always import `test`/`expect` from `@fixtures`, never from `@playwright/test` directly.

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
| Thêm page mới | Tạo `page-objects/MyPage.ts`, thêm vào `PageManager` |
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
import { generateUser } from '@test-data/UserData';       // dynamic (faker)
import { getStaticUsers } from '@test-data/UserData';     // static (JSON)

// Dynamic — random data mỗi lần chạy
test('happy path', async ({ pageManager }) => {
  const user = generateUser();
  await pageManager.onNavigationPage().navigateToFormLayouts();
  await pageManager.onFormLayoutsPage().submitInlineFormWithNameAndEmail(user.name, user.email);
});

// Static — fixed data để reproduce bug
test('reproduce bug #123', async ({ pageManager }) => {
  const { standardUser } = getStaticUsers();
  await pageManager.onFormLayoutsPage().submitBasicFormWithEmailAndPassword(
    standardUser.email,
    standardUser.password,
  );
});
```

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

## Adding a new page

1. Create `page-objects/MyNewPage.ts` extending `BasePage` from `@base/BasePage`
2. Add private field + `onMyNewPage()` getter in `page-manager/PageManager.ts`

## Adding a new API class

1. Create `api/MyNewApi.ts` extending `BaseApi` from `@api/BaseApi`
2. Add private field + `onMyNewApi()` getter in `api/ApiManager.ts`

## Environment

- Copy `.env.example` to `.env` and fill in values before running tests
- Required vars: `BASE_URL`, `USER_EMAIL`, `USER_PASSWORD`
- Tests use `page.goto('/')` — Playwright auto-prepends `baseURL` from `.env`
- Adding a new required var: update `helpers/EnvValidator.ts` + `.env.example`

## Code quality

- ESLint 9 flat config (`eslint.config.mjs`) — runs automatically on `git commit` via Husky
- Prettier (`.prettierrc`) — auto-formats on commit
- `npm run lint:fix` to fix ESLint errors manually
- Tests without assertions trigger `playwright/expect-expect` warning — always add `expect()`
