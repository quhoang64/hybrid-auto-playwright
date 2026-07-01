# Golden Templates

These are the source of truth for all generated code. Follow exactly.

---

## 1. Page Object Template

```typescript
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';
import { XxxData } from '@test-data/XxxData';

export class XxxPage extends BasePage {
  // Form / interaction locators (private)
  private readonly fieldA: Locator;
  private readonly fieldB: Locator;
  private readonly submitButton: Locator;

  // Confirmation / assertion locators (public — used in test assertions)
  readonly confirmFieldA: Locator;
  readonly confirmFieldB: Locator;

  constructor(page: Page) {
    super(page);

    // Form
    this.fieldA = page.getByRole('textbox', { name: 'Field A' });
    this.fieldB = page.getByRole('combobox', { name: 'Field B' });
    this.submitButton = page.getByRole('button', { name: 'Submit' });

    // Confirmation
    this.confirmFieldA = page.locator('#field-a');
    this.confirmFieldB = page.locator('#field-b');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/xxx-page-path');
  }

  async fillForm(data: XxxData): Promise<void> {
    await this.fieldA.fill(data.fieldA);
    await this.fieldB.selectOption(data.fieldB);
  }

  async submitAndWait(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForURL('**/result-page-url-pattern');
  }
}
```

### Rules
- Locators declared **above** the constructor as class fields
- `private readonly` for form/action locators
- `readonly` (public) for confirmation/assertion locators — tests access these directly
- Constructor uses the `page` parameter to initialize locators — NOT `this.page`
- Method names describe business actions: `fillForm`, `bookAppointment`, `submitOrder`
- `waitForURL(...)` inside any method that causes navigation
- **NO** `expect()`, `verifyXxx()`, or `waitFor()` in page objects

---

## 3. Fixtures Registration

Add every new Page Object to `fixtures/index.ts` — one entry in the type, one fixture implementation:

```typescript
import { XxxPage } from '@page-objects/XxxPage';              // ← add import

type TestFixtures = {
  // ... existing fixtures
  xxxPage: XxxPage;                                           // ← add to type
};

export const test = base.extend<TestFixtures>({
  // ... existing fixtures
  xxxPage: async ({ page }, use) => {                         // ← add fixture
    await use(new XxxPage(page));
  },
});
```

---

## 4. Test Data Template

### Dynamic data — `test-data/XxxData.ts`

```typescript
import { faker } from '@faker-js/faker';

export interface XxxData {
  fieldA: string;
  fieldB: 'OptionOne' | 'OptionTwo' | 'OptionThree';
  fieldC: boolean;
  fieldD: string; // format: dd/mm/yyyy
}

export function generateXxxData(overrides?: Partial<XxxData>): XxxData {
  const date = faker.date.future();
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return {
    fieldA: faker.lorem.words(3),
    fieldB: 'OptionOne',
    fieldC: true,
    fieldD: `${dd}/${mm}/${yyyy}`,
    ...overrides,
  };
}
```

### Static data — `test-data/common/xxx.json`

```json
{
  "expectedTitle": "Confirmation",
  "expectedMessage": "Your request has been submitted."
}
```

Load in test with:
```typescript
import { loadTestData } from '@helpers/DataLoader';

interface XxxStaticData {
  expectedTitle: string;
  expectedMessage: string;
}

const STATIC = loadTestData<XxxStaticData>('xxx.json');
```

---

## 5. Test File Template

```typescript
import { test, expect } from '@fixtures';
import { generateXxxData } from '@test-data/XxxData';

test.describe('Feature Name', { tag: ['@smoke', '@feature-xxx'] }, () => {
  test('scenario name — what the user can do', async ({ xxxPage }) => {
    const data = generateXxxData();

    await test.step('1. Navigate to feature page', async () => {
      await xxxPage.navigate();
    });

    await test.step('2. Fill form', async () => {
      await xxxPage.fillForm(data);
    });

    await test.step('3. Submit', async () => {
      await xxxPage.submitAndWait();
    });

    await test.step('4. Verify confirmation', async () => {
      await expect(xxxPage.confirmFieldA).toHaveText(data.fieldA);
      await expect(xxxPage.confirmFieldB).toHaveText(data.fieldB);
    });
  });
});
```

### Rules
- `import { test, expect } from '@fixtures'` — **NEVER** from `@playwright/test`
- Tags on `test.describe`: `['@priority', '@feature-tag']`
- Every logical group wrapped in `test.step('N. Description', ...)`
- All assertions inside `test.step('N. Verify ...')`
- Declare only the fixtures the test needs — `{ navigationPage, xxxPage }` — **NEVER** `new XxxPage(page)`
- Dynamic data via factory function (`generateXxxData()`)
- Static data via `loadTestData<T>('xxx.json')` from `@helpers/DataLoader`

---

## Locator Priority Reference

| Tier | Method | Use when |
|------|--------|----------|
| 1 | `getByRole('button', { name: '...' })` | buttons, links, headings, inputs, comboboxes, checkboxes, radios |
| 2 | `getByLabel('...')` | form fields with a `<label>` |
| 3 | `getByPlaceholder('...')` | inputs with placeholder text |
| 4 | `getByText('...')` | static text / labels with no role |
| 5 | `locator('css')` | last resort — shadow DOM, custom components, no other option |
