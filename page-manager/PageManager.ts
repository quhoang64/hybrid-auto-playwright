import { Page } from '@playwright/test';
import { NavigationPage } from '@page-objects/NavigationPage';
import { AppointmentPage } from '@page-objects/AppointmentPage';
import { HistoryPage } from '@page-objects/HistoryPage';
import { ProfilePage } from '@page-objects/ProfilePage';

export class PageManager {
  private readonly navigationPage: NavigationPage;
  private readonly appointmentPage: AppointmentPage;
  private readonly historyPage: HistoryPage;
  private readonly profilePage: ProfilePage;

  constructor(page: Page) {
    this.navigationPage = new NavigationPage(page);
    this.appointmentPage = new AppointmentPage(page);
    this.historyPage = new HistoryPage(page);
    this.profilePage = new ProfilePage(page);
  }

  onNavigationPage() {
    return this.navigationPage;
  }

  onAppointmentPage() {
    return this.appointmentPage;
  }

  onHistoryPage() {
    return this.historyPage;
  }

  onProfilePage() {
    return this.profilePage;
  }
}
