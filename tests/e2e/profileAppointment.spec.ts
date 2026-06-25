import { test, expect } from '@fixtures';
import { loadTestData } from '@helpers/DataLoader';

interface ProfileData {
  underConstructionText: string;
}

const STATIC = loadTestData<ProfileData>('profile.json');

test.describe('Profile', { tag: ['@regression', '@profile-appointment'] }, () => {
  test('Verify that the user can see the profile appointment after clicking the Profile button on the right menu', async ({
    pageManager,
  }) => {
    const profilePage = pageManager.onProfilePage();

    await test.step('1. Navigate to Profile via menu', async () => {
      await pageManager.onNavigationPage().navigateToProfile();
    });

    await test.step('2. Verify profile page content', async () => {
      await expect(profilePage.underConstruction).toHaveText(STATIC.underConstructionText);
      await expect(profilePage.logoutLink).toBeVisible();
    });
  });
});
