import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class NavigationPage extends BasePage {
  private readonly makeAppointmentLink: Locator;

  constructor(page: Page) {
    super(page);
    this.makeAppointmentLink = page.getByRole('link', { name: 'Make Appointment' });
  }

  async navigateToMakeAppointment() {
    await this.makeAppointmentLink.click();
  }
}
