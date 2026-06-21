# Worked Example — Make Appointment (CURA Healthcare)

This is a complete end-to-end example of the skill workflow using the CURA Healthcare demo app.

---

## Input

```
Feature: Make Appointment
URL: /#appointment
Priority: smoke
Feature tag: make-appointment

Scenarios:
- name: book appointment and verify confirmation
  steps:
    1. Navigate to Make Appointment page
    2. Fill appointment form (facility, readmission, program, visit date, comment)
    3. Submit the form
    4. Verify all confirmation details match the submitted data
```

---

## Step 1 — Plan Output

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

Navigation causes redirect: /#appointment → /appointment.php#summary (on submit)
Scenarios: 1 test, 4 steps
```

---

## Step 2 — Discovered Locators

```
Form page (/#appointment):
  facilitySelect       → getByRole('combobox', { name: 'Facility' })
  readmissionCheckbox  → getByRole('checkbox', { name: 'Apply for hospital readmission' })
  healthcareRadio      → getByRole('radio', { name: data.healthcareProgram })  [parameterized]
  visitDateInput       → getByPlaceholder('dd/mm/yyyy')
  commentInput         → getByRole('textbox', { name: 'Comment' })
  bookButton           → getByRole('button', { name: 'Book Appointment' })

Datepicker (Bootstrap — opens on visitDateInput click):
  datepickerSwitch     → locator('.datepicker-days .datepicker-switch')
  datepickerNext       → locator('.datepicker-days .next')
  datepickerPrev       → locator('.datepicker-days .prev')
  datepickerDays       → locator('.datepicker-days td.day:not(.old):not(.new)')

Confirmation page (/appointment.php#summary):
  confirmFacility      → locator('#facility')
  confirmReadmission   → locator('#hospital_readmission')
  confirmProgram       → locator('#program')
  confirmVisitDate     → locator('#visit_date')
  confirmComment       → locator('#comment')
```

> Note: `healthcareRadio` is parameterized — not stored as a constructor field because the
> value changes per test run. Used inline: `page.getByRole('radio', { name: data.healthcareProgram })`

---

## Step 3 — Generated Page Object

### `page-objects/AppointmentPage.ts`

```typescript
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';
import { AppointmentData } from '@test-data/AppointmentData';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export class AppointmentPage extends BasePage {
  private readonly facilitySelect: Locator;
  private readonly readmissionCheckbox: Locator;
  private readonly visitDateInput: Locator;
  private readonly commentInput: Locator;
  private readonly bookAppointmentButton: Locator;

  private readonly datepickerSwitch: Locator;
  private readonly datepickerNext: Locator;
  private readonly datepickerPrev: Locator;
  private readonly datepickerDays: Locator;

  readonly confirmFacility: Locator;
  readonly confirmReadmission: Locator;
  readonly confirmProgram: Locator;
  readonly confirmVisitDate: Locator;
  readonly confirmComment: Locator;

  constructor(page: Page) {
    super(page);

    this.facilitySelect = page.getByRole('combobox', { name: 'Facility' });
    this.readmissionCheckbox = page.getByRole('checkbox', { name: 'Apply for hospital readmission' });
    this.visitDateInput = page.getByPlaceholder('dd/mm/yyyy');
    this.commentInput = page.getByRole('textbox', { name: 'Comment' });
    this.bookAppointmentButton = page.getByRole('button', { name: 'Book Appointment' });

    this.datepickerSwitch = page.locator('.datepicker-days .datepicker-switch');
    this.datepickerNext = page.locator('.datepicker-days .next');
    this.datepickerPrev = page.locator('.datepicker-days .prev');
    this.datepickerDays = page.locator('.datepicker-days td.day:not(.old):not(.new)');

    this.confirmFacility = page.locator('#facility');
    this.confirmReadmission = page.locator('#hospital_readmission');
    this.confirmProgram = page.locator('#program');
    this.confirmVisitDate = page.locator('#visit_date');
    this.confirmComment = page.locator('#comment');
  }

  async fillForm(data: AppointmentData): Promise<void> {
    await this.facilitySelect.selectOption(data.facility);
    if (data.readmission) {
      await this.readmissionCheckbox.check();
    }
    await this.page.getByRole('radio', { name: data.healthcareProgram }).check();
    await this.selectVisitDate(data.visitDate);
    await this.commentInput.fill(data.comment);
  }

  async bookAppointment(): Promise<void> {
    await this.bookAppointmentButton.click();
    await this.page.waitForURL('**/appointment.php#summary');
  }

  private async selectVisitDate(date: string): Promise<void> {
    const [day, month, year] = date.split('/').map(Number);
    const targetMonthName = MONTHS[month - 1];

    await this.visitDateInput.click();

    let headerText = (await this.datepickerSwitch.textContent())!.trim();
    while (!headerText.includes(`${targetMonthName} ${year}`)) {
      const [headerMonth, headerYear] = headerText.split(' ');
      const isBeforeTarget =
        new Date(parseInt(headerYear), MONTHS.indexOf(headerMonth)) < new Date(year, month - 1);
      await (isBeforeTarget ? this.datepickerNext : this.datepickerPrev).click();
      headerText = (await this.datepickerSwitch.textContent())!.trim();
    }

    await this.datepickerDays.getByText(String(day), { exact: true }).click();
  }
}
```

### `page-objects/NavigationPage.ts` (updated)

```typescript
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class NavigationPage extends BasePage {
  private readonly makeAppointmentLink: Locator;

  constructor(page: Page) {
    super(page);
    this.makeAppointmentLink = page.getByRole('link', { name: 'Make Appointment' });
  }

  async navigateToMakeAppointment() {
    await this.makeAppointmentLink.click();
  }
}
```

### `page-manager/PageManager.ts` (updated)

```typescript
import { Page } from '@playwright/test';
import { NavigationPage } from '@page-objects/NavigationPage';
import { AppointmentPage } from '@page-objects/AppointmentPage';

export class PageManager {
  private readonly navigationPage: NavigationPage;
  private readonly appointmentPage: AppointmentPage;

  constructor(page: Page) {
    this.navigationPage = new NavigationPage(page);
    this.appointmentPage = new AppointmentPage(page);
  }

  onNavigationPage() { return this.navigationPage; }
  onAppointmentPage() { return this.appointmentPage; }
}
```

---

## Step 4 — Generated Test Data

### `test-data/AppointmentData.ts`

```typescript
export type Facility =
  | 'Tokyo CURA Healthcare Center'
  | 'Hongkong CURA Healthcare Center'
  | 'Seoul CURA Healthcare Center';

export type HealthcareProgram = 'Medicare' | 'Medicaid' | 'None';

export interface AppointmentData {
  facility: Facility;
  readmission: boolean;
  healthcareProgram: HealthcareProgram;
  visitDate: string; // dd/mm/yyyy
  comment: string;
}

export function generateAppointmentData(overrides?: Partial<AppointmentData>): AppointmentData {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return {
    facility: 'Hongkong CURA Healthcare Center',
    readmission: true,
    healthcareProgram: 'Medicaid',
    visitDate: `${dd}/${mm}/${yyyy}`,
    comment: 'Automated test appointment',
    ...overrides,
  };
}
```

> No static JSON needed — all values are either typed constants or generated dynamically.

---

## Step 5 — Generated Test File

### `tests/e2e/makeAppointment.spec.ts`

```typescript
import { test, expect } from '@fixtures';
import { generateAppointmentData } from '@test-data/AppointmentData';

test.describe('Make Appointment', { tag: ['@smoke', '@feature-make-appointment'] }, () => {
  test('book appointment and verify confirmation', async ({ pageManager }) => {
    const data = generateAppointmentData();
    const appointmentPage = pageManager.onAppointmentPage();

    await test.step('1. Navigate to Make Appointment page', async () => {
      await pageManager.onNavigationPage().navigateToMakeAppointment();
    });

    await test.step('2. Fill appointment form', async () => {
      await appointmentPage.fillForm(data);
    });

    await test.step('3. Submit appointment', async () => {
      await appointmentPage.bookAppointment();
    });

    await test.step('4. Verify confirmation details', async () => {
      await expect(appointmentPage.confirmFacility).toHaveText(data.facility);
      await expect(appointmentPage.confirmReadmission).toHaveText(data.readmission ? 'Yes' : 'No');
      await expect(appointmentPage.confirmProgram).toHaveText(data.healthcareProgram);
      await expect(appointmentPage.confirmVisitDate).toHaveText(data.visitDate);
      await expect(appointmentPage.confirmComment).toHaveText(data.comment);
    });
  });
});
```

---

## Key Decisions Made in This Example

| Decision | Reason |
|----------|--------|
| `healthcareProgram` radio inline (not in constructor) | Value is dynamic — can't hardcode all options as separate fields |
| `selectVisitDate` is `private` | Implementation detail of the page, not a business action tests need to call directly |
| Datepicker scoped to `.datepicker-days` | The Bootstrap datepicker renders 5 `.datepicker-switch` elements (one per view — days/months/years/decades/centuries); scoping prevents strict mode violation |
| `confirmXxx` fields are `readonly` (public) | Tests access them directly for assertions — no getter methods needed |
| `readmission ? 'Yes' : 'No'` in assertion | Avoids hardcoded `'Yes'` that would silently break if test data changes |
