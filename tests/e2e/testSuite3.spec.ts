import { test, expect } from '@fixtures';

test.describe('Tests requiring fresh login each time', () => {
  test('verify dashboard after login', async ({ loggedInPage }) => {
    await expect(loggedInPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('verify user profile is accessible', async ({ loggedInPage }) => {
    // loggedInPage là page đã logged in — truyền vào PageManager nếu cần
    await loggedInPage.getByRole('link', { name: 'Profile' }).click();
    await expect(loggedInPage.getByLabel('Email')).toHaveValue(process.env.USER_EMAIL!);
  });
});
