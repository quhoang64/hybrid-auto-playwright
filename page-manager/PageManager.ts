import { Page } from '@playwright/test';
import { NavigationPage } from '@page-objects/NavigationPage';
import { AppointmentPage } from '@page-objects/AppointmentPage';

export class PageManager {
  private readonly navigationPage: NavigationPage;
  private readonly appointmentPage: AppointmentPage;

  constructor(page: Page) {
    this.navigationPage = new NavigationPage(page);
    this.appointmentPage = new AppointmentPage(page);
  }

  onNavigationPage() {
    return this.navigationPage;
  }

  onAppointmentPage() {
    return this.appointmentPage;
  }
}
