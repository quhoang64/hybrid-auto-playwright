# Playwright Hybrid Automation Framework

A production-ready E2E automation framework built with Playwright and TypeScript, supporting both UI and API testing in a clean layered architecture.

---

## Tech Stack

- [Playwright](https://playwright.dev/) v1.61+
- TypeScript (strict mode)
- Faker.js — dynamic test data generation
- dotenv — environment configuration
- ESLint + Prettier + Husky — code quality

---

## Architecture

```
Tests → Fixtures → PageObjects / ApiClasses → BasePage / BaseApi
```

```
base/               BasePage.ts — foundation for all Page Objects
page-objects/       *Page.ts — one file per page, extends BasePage
api/                BaseApi.ts, *Api.ts, ApiManager.ts — API request layer
fixtures/           index.ts — registers all Page Objects + apiManager as Playwright fixtures
test-data/
  common/           *.json — static test data (reproducible)
  *Data.ts          faker factories — dynamic test data
helpers/            DataLoader.ts, EnvValidator.ts
tests/
  e2e/              UI/browser tests
  api/              pure API tests
  auth.setup.ts     login once, save session
global-setup.ts     validates .env before tests run
```

---

## Getting Started

### 1. Install dependencies

```bash
npm ci
npx playwright install --with-deps
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```
BASE_URL=https://your-app.com
USER_EMAIL=your@email.com
USER_PASSWORD=yourpassword
```

### 3. Run tests

```bash
npm test              # all tests
npm run test:e2e      # UI tests only
npm run test:api      # API tests only
npm run test:ui       # interactive UI mode
npm run test:headed   # visible browser
npm run report        # view HTML report
```

---

## Writing Tests

Always import `test` and `expect` from `@fixtures`:

```typescript
import { test, expect } from '@fixtures';
import { generateAppointmentData } from '@test-data/AppointmentData';

test('book appointment', async ({ navigationPage, appointmentPage }) => {
  const data = generateAppointmentData();
  await navigationPage.navigateToMakeAppointment();
  await appointmentPage.fillForm(data);
  await appointmentPage.bookAppointment();
  await expect(appointmentPage.confirmFacility).toHaveText(data.facility);
});
```

### Hybrid pattern — API setup + UI verify

```typescript
test('create user and verify on UI', async ({ navigationPage, apiManager }) => {
  const user = generateUser();
  const created = await apiManager.onUserApi().createUser(user); // fast, no UI
  // verify on UI via navigationPage / other page fixtures ...
  await apiManager.onUserApi().deleteUser(created.id);           // clean teardown
});
```

### Static test data — for reproducing bugs

```typescript
import { getStaticUsers } from '@test-data/UserData';

const { standardUser } = getStaticUsers(); // fixed data from test-data/common/users.json
```

---

## Adding a New Page

1. Create `page-objects/MyNewPage.ts` extending `BasePage`
2. Register in `fixtures/index.ts`

```typescript
// page-objects/MyNewPage.ts
import { BasePage } from '@base/BasePage';

export class MyNewPage extends BasePage {
  async doSomething(): Promise<void> {
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }
}
```

```typescript
// fixtures/index.ts — add to TestFixtures type and extend block
type TestFixtures = {
  // ... existing fixtures
  myNewPage: MyNewPage;
};

export const test = base.extend<TestFixtures>({
  // ... existing fixtures
  myNewPage: async ({ page }, use) => {
    await use(new MyNewPage(page));
  },
});
```

## Adding a New API Class

1. Create `api/MyNewApi.ts` extending `BaseApi`
2. Register in `api/ApiManager.ts`

---

## Code Quality

```bash
npm run lint        # check errors
npm run lint:fix    # auto-fix
npm run format      # format with Prettier
```

Husky runs ESLint + Prettier automatically on every `git commit`.

---

## Project Documentation

See [`doc/framework-setup-guide.md`](doc/framework-setup-guide.md) for a complete step-by-step guide to rebuild this framework from scratch on a new project.
