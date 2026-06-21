import { test, expect } from '@fixtures';
import { generateFutureDate } from '@test-data/DateData';

test.describe('Datepicker', () => {
  test('select a random future date', async ({ page, pageManager }) => {
    const { daysFromToday } = generateFutureDate(1, 30);
    await pageManager.onNavigationPage().navigateToDatatpicker();
    const selectedDate = await pageManager
      .onDatepickerPage()
      .selectCommonPickerDateFromToday(daysFromToday);
    await expect(page.getByPlaceholder('Form Picker')).toHaveValue(selectedDate);
  });
});
