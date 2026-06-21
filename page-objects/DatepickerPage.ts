import { BasePage } from '@base/BasePage';

export class DatepickerPage extends BasePage {
  async selectCommonPickerDateFromToday(numberOfDaysFromToday: number) {
    await this.page.getByPlaceholder('Form Picker').click();
    const dateToAssert = await this.selectDateInPicker(numberOfDaysFromToday);
    await this.page.getByPlaceholder('Form Picker').waitFor({ state: 'visible' });
    return dateToAssert;
  }

  private async selectDateInPicker(numberOfDaysFromToday: number) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + numberOfDaysFromToday);

    const expectedDate = targetDate.getDate().toString();
    const expectedMonthShort = targetDate.toLocaleString('En-US', { month: 'short' });
    const expectedMonthLong = targetDate.toLocaleString('En-US', { month: 'long' });
    const expectedYear = targetDate.getFullYear().toString();
    const dateToAssert = `${expectedMonthShort} ${expectedDate}, ${expectedYear}`;

    let calendarMonthAndYear = await this.page.locator('nb-calendar-view-mode').textContent();

    while (!calendarMonthAndYear!.includes(`${expectedMonthLong} ${expectedYear}`)) {
      await this.page
        .locator('nb-calendar-pageable-navigation [data-name="chevron-right"]')
        .click();
      calendarMonthAndYear = await this.page.locator('nb-calendar-view-mode').textContent();
    }

    await this.page
      .locator('.day-cell.ng-star-inserted')
      .getByText(expectedDate, { exact: true })
      .click();

    return dateToAssert;
  }
}
