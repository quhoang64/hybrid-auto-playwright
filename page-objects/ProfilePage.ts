import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class ProfilePage extends BasePage {
  readonly underConstruction: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.underConstruction = page.getByText('Under construction.');
    this.logoutLink = page.locator('#profile').getByRole('link', { name: 'Logout' });
  }
}
