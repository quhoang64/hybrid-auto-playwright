import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class HistoryPage extends BasePage {
  private readonly panels: Locator;

  constructor(page: Page) {
    super(page);
    this.panels = page.locator('.panel.panel-info');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/history.php#history');
  }

  getAppointment(visitDate: string, comment: string) {
    const panel = this.panels
      .filter({ has: this.page.locator('.panel-heading', { hasText: visitDate }) })
      .filter({ has: this.page.locator('#comment', { hasText: comment }) });
    return {
      visitDate: panel.locator('.panel-heading'),
      facility: panel.locator('#facility'),
      readmission: panel.locator('#hospital_readmission'),
      program: panel.locator('#program'),
      comment: panel.locator('#comment'),
    };
  }
}
