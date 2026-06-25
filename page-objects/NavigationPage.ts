import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class NavigationPage extends BasePage {
  private readonly makeAppointmentLink: Locator;
  private readonly menuToggle: Locator;
  private readonly historyLink: Locator;
  private readonly profileLink: Locator;

  constructor(page: Page) {
    super(page);
    this.makeAppointmentLink = page.getByRole('link', { name: 'Make Appointment' });
    this.menuToggle = page.locator('#menu-toggle');
    this.historyLink = page.getByRole('link', { name: 'History' });
    this.profileLink = page.getByRole('link', { name: 'Profile' });
  }

  async navigateToMakeAppointment(): Promise<void> {
    await this.makeAppointmentLink.click();
  }

  async navigateToHistory(): Promise<void> {
    await this.menuToggle.click();
    await this.historyLink.click();
    await this.page.waitForURL('**/history.php#history');
  }

  async navigateToProfile(): Promise<void> {
    await this.menuToggle.click();
    await this.profileLink.click();
    await this.page.waitForURL('**/profile.php#profile');
  }
}
