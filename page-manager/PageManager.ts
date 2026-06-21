import { Page } from '@playwright/test';
import { NavigationPage } from '@page-objects/NavigationPage';
import { FormLayoutsPage } from '@page-objects/FormLayoutsPage';
import { DatepickerPage } from '@page-objects/DatepickerPage';

export class PageManager {
  private readonly page: Page;
  private readonly navigationPage: NavigationPage;
  private readonly formLayoutsPage: FormLayoutsPage;
  private readonly datepickerPage: DatepickerPage;

  constructor(page: Page) {
    this.page = page;
    this.navigationPage = new NavigationPage(page);
    this.formLayoutsPage = new FormLayoutsPage(page);
    this.datepickerPage = new DatepickerPage(page);
  }

  onNavigationPage() {
    return this.navigationPage;
  }

  onFormLayoutsPage() {
    return this.formLayoutsPage;
  }

  onDatepickerPage() {
    return this.datepickerPage;
  }
}
