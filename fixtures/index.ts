import { test as base, Page } from '@playwright/test';
import { NavigationPage } from '@page-objects/NavigationPage';
import { AppointmentPage } from '@page-objects/AppointmentPage';
import { HistoryPage } from '@page-objects/HistoryPage';
import { ProfilePage } from '@page-objects/ProfilePage';
import { ApiManager } from '@api/ApiManager';
import { AppointmentData, generateAppointmentData } from '@test-data/AppointmentData';

type TestFixtures = {
  navigationPage: NavigationPage;
  appointmentPage: AppointmentPage;
  historyPage: HistoryPage;
  profilePage: ProfilePage;
  apiManager: ApiManager;
  loggedInPage: Page;
  bookedAppointment: AppointmentData;
};

export const test = base.extend<TestFixtures>({
  navigationPage: async ({ page }, use) => {
    await page.goto('/');
    await use(new NavigationPage(page));
  },
  appointmentPage: async ({ page }, use) => {
    await use(new AppointmentPage(page));
  },
  historyPage: async ({ page }, use) => {
    await use(new HistoryPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
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
  bookedAppointment: async ({ navigationPage, appointmentPage }, use) => {
    const data = generateAppointmentData();
    await navigationPage.navigateToMakeAppointment();
    await appointmentPage.fillForm(data);
    await appointmentPage.bookAppointment();
    await use(data);
  },
});

export { expect } from '@playwright/test';
