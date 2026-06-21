import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';
import { AppointmentData } from '@test-data/AppointmentData';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export class AppointmentPage extends BasePage {
  private readonly facilitySelect: Locator;
  private readonly readmissionCheckbox: Locator;
  private readonly visitDateInput: Locator;
  private readonly commentInput: Locator;
  private readonly bookAppointmentButton: Locator;

  private readonly datepickerSwitch: Locator;
  private readonly datepickerNext: Locator;
  private readonly datepickerPrev: Locator;
  private readonly datepickerDays: Locator;

  readonly confirmFacility: Locator;
  readonly confirmReadmission: Locator;
  readonly confirmProgram: Locator;
  readonly confirmVisitDate: Locator;
  readonly confirmComment: Locator;

  constructor(page: Page) {
    super(page);

    this.facilitySelect = page.getByRole('combobox', { name: 'Facility' });
    this.readmissionCheckbox = page.getByRole('checkbox', {
      name: 'Apply for hospital readmission',
    });
    this.visitDateInput = page.getByPlaceholder('dd/mm/yyyy');
    this.commentInput = page.getByRole('textbox', { name: 'Comment' });
    this.bookAppointmentButton = page.getByRole('button', { name: 'Book Appointment' });

    this.datepickerSwitch = page.locator('.datepicker-days .datepicker-switch');
    this.datepickerNext = page.locator('.datepicker-days .next');
    this.datepickerPrev = page.locator('.datepicker-days .prev');
    this.datepickerDays = page.locator('.datepicker-days td.day:not(.old):not(.new)');

    this.confirmFacility = page.locator('#facility');
    this.confirmReadmission = page.locator('#hospital_readmission');
    this.confirmProgram = page.locator('#program');
    this.confirmVisitDate = page.locator('#visit_date');
    this.confirmComment = page.locator('#comment');
  }

  async fillForm(data: AppointmentData): Promise<void> {
    await this.facilitySelect.selectOption(data.facility);
    if (data.readmission) {
      await this.readmissionCheckbox.check();
    }
    await this.page.getByRole('radio', { name: data.healthcareProgram }).check();
    await this.selectVisitDate(data.visitDate);
    await this.commentInput.fill(data.comment);
  }

  async bookAppointment(): Promise<void> {
    await this.bookAppointmentButton.click();
    await this.page.waitForURL('**/appointment.php#summary');
  }

  private async selectVisitDate(date: string): Promise<void> {
    const [day, month, year] = date.split('/').map(Number);
    const targetMonthName = MONTHS[month - 1];

    await this.visitDateInput.click();

    let headerText = (await this.datepickerSwitch.textContent())!.trim();
    while (!headerText.includes(`${targetMonthName} ${year}`)) {
      const [headerMonth, headerYear] = headerText.split(' ');
      const isBeforeTarget =
        new Date(parseInt(headerYear), MONTHS.indexOf(headerMonth)) < new Date(year, month - 1);
      await (isBeforeTarget ? this.datepickerNext : this.datepickerPrev).click();
      headerText = (await this.datepickerSwitch.textContent())!.trim();
    }

    await this.datepickerDays.getByText(String(day), { exact: true }).click();
  }
}
