import { test as setup } from '@playwright/test';
import path from 'path';

export const AUTH_FILE = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/profile.php#login');
  await page.getByLabel('Username').fill(process.env.USER_NAME!);
  await page.getByLabel('Password').fill(process.env.USER_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/appointment.php');

  await page.context().storageState({ path: AUTH_FILE });
});
