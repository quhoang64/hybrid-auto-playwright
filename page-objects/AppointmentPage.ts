import { Locator, Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';
import { AppointmentData } from '@test-data/AppointmentData';
import { DatepickerComponent } from '@page-objects/components/DatepickerComponent';

export class AppointmentPage extends BasePage {
  private readonly facilitySelect: Locator;
  private readonly readmissionCheckbox: Locator;
  private readonly commentInput: Locator;
  private readonly bookAppointmentButton: Locator;
  private readonly datepicker: DatepickerComponent;

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
    this.commentInput = page.getByRole('textbox', { name: 'Comment' });
    this.bookAppointmentButton = page.getByRole('button', { name: 'Book Appointment' });
    this.datepicker = new DatepickerComponent(page, page.getByPlaceholder('dd/mm/yyyy'));

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
    await this.datepicker.selectDate(data.visitDate);
    await this.commentInput.fill(data.comment);
  }

  async bookAppointment(): Promise<void> {
    await this.bookAppointmentButton.click();
    await this.page.waitForURL('**/appointment.php#summary');
  }
}
