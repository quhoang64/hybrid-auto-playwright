import { test } from '@fixtures';
import { generateUser } from '@test-data/UserData';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Form Layouts', () => {
  test('submit inline form with name and email', async ({ pageManager }) => {
    const user = generateUser();
    await pageManager.onNavigationPage().navigateToFormLayouts();
    await pageManager.onFormLayoutsPage().submitInlineFormWithNameAndEmail(user.name, user.email);
  });

  test('submit basic form with email and password', async ({ pageManager }) => {
    const user = generateUser();
    await pageManager.onNavigationPage().navigateToFormLayouts();
    await pageManager
      .onFormLayoutsPage()
      .submitBasicFormWithEmailAndPassword(user.email, user.password);
  });
});
