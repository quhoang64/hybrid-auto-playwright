import { test, expect } from '@fixtures';
import { generateUser } from '@test-data/UserData';

test.describe('User management — hybrid API + UI', () => {
  test('create user via API then verify on UI', async ({ pageManager, apiManager }) => {
    const user = generateUser();

    // Setup: tạo user nhanh qua API, không tốn thời gian đi qua UI
    const created = await apiManager.onUserApi().createUser({
      name: user.name,
      email: user.email,
      password: user.password,
    });

    // Verify: kiểm tra kết quả trên UI
    await pageManager.onNavigationPage().navigateToFormLayouts();
    await expect(pageManager.onFormLayoutsPage().getUserByEmail(user.email)).toBeVisible();

    // Teardown: xoá data sau khi test xong
    await apiManager.onUserApi().deleteUser(created.id);
  });
});
