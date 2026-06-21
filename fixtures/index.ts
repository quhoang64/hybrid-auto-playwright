import { test as base, Page } from '@playwright/test';
import { PageManager } from '@page-manager/PageManager';
import { ApiManager } from '@api/ApiManager';
import { AppointmentData, generateAppointmentData } from '@test-data/AppointmentData';

type TestFixtures = {
  pageManager: PageManager;
  apiManager: ApiManager;
  loggedInPage: Page;
  bookedAppointment: AppointmentData;
};

export const test = base.extend<TestFixtures>({
  pageManager: async ({ page }, use) => {
    await page.goto('/');
    await use(new PageManager(page));
  },
  apiManager: async ({ request }, use) => {
    await use(new ApiManager(request));
  },
  loggedInPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.USER_NAME!);
    await page.getByLabel('Password').fill(process.env.USER_PASSWORD!);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL('/#appointment');
    await use(page);
  },
  bookedAppointment: async ({ pageManager }, use) => {
    const data = generateAppointmentData();
    await pageManager.onNavigationPage().navigateToMakeAppointment();
    await pageManager.onAppointmentPage().fillForm(data);
    await pageManager.onAppointmentPage().bookAppointment();
    await use(data);
  },
});

export { expect } from '@playwright/test';
