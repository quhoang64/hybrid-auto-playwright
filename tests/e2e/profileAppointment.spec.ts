import { test, expect } from '@fixtures';
import { loadTestData } from '@helpers/DataLoader';

interface ProfileData {
  underConstructionText: string;
}

const STATIC = loadTestData<ProfileData>('profile.json');

test.describe('Profile', { tag: ['@regression', '@profile-appointment'] }, () => {
  test('Verify that the user can see the profile appointment after clicking the Profile button on the right menu', async ({
    profilePage,
  }) => {
    await test.step('1. Navigate to Profile', async () => {
      await profilePage.navigate();
    });

    await test.step('2. Verify profile page content', async () => {
      await expect(profilePage.underConstruction).toHaveText(STATIC.underConstructionText);
      await expect(profilePage.logoutLink).toBeVisible();
    });
  });
});
