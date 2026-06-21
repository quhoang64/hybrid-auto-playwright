import { Locator, Page } from '@playwright/test';

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

export class DatepickerComponent {
  private readonly switch: Locator;
  private readonly next: Locator;
  private readonly prev: Locator;
  private readonly days: Locator;

  constructor(
    page: Page,
    private readonly input: Locator,
  ) {
    this.switch = page.locator('.datepicker-days .datepicker-switch');
    this.next = page.locator('.datepicker-days .next');
    this.prev = page.locator('.datepicker-days .prev');
    this.days = page.locator('.datepicker-days td.day:not(.old):not(.new)');
  }

  async selectDate(date: string): Promise<void> {
    const [day, month, year] = date.split('/').map(Number);
    const targetMonthName = MONTHS[month - 1];

    await this.input.click();

    let headerText = (await this.switch.textContent())!.trim();
    while (!headerText.includes(`${targetMonthName} ${year}`)) {
      const [headerMonth, headerYear] = headerText.split(' ');
      const isBeforeTarget =
        new Date(parseInt(headerYear), MONTHS.indexOf(headerMonth)) < new Date(year, month - 1);
      await (isBeforeTarget ? this.next : this.prev).click();
      headerText = (await this.switch.textContent())!.trim();
    }

    await this.days.getByText(String(day), { exact: true }).click();
  }
}
