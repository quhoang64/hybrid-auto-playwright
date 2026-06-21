import { BasePage } from '@base/BasePage';

export class NavigationPage extends BasePage {
  async navigateToFormLayouts() {
    await this.page.getByText('Forms').click();
    await this.page.getByText('Form Layouts').click();
  }

  async navigateToDatatpicker() {
    await this.page.getByText('Forms').click();
    await this.page.getByText('Datepicker').click();
  }
}
