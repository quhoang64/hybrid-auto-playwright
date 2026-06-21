import { test as base, Page } from '@playwright/test';
import { PageManager } from '@page-manager/PageManager';
import { ApiManager } from '@api/ApiManager';

type TestFixtures = {
  pageManager: PageManager;
  apiManager: ApiManager;
  loggedInPage: Page;
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
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/#appointment');
    await use(page);
  },
});

export { expect } from '@playwright/test';
