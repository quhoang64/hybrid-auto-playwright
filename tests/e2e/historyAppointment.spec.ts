import { test, expect } from '@fixtures';

test.describe('History Appointment', { tag: ['@regression', '@history-appointment'] }, () => {
  test('Verify that the user can see the history appointment after submitting the form', async ({
    pageManager,
    bookedAppointment,
  }) => {
    const historyPage = pageManager.onHistoryPage();

    await test.step('1. Navigate to History via menu', async () => {
      await pageManager.onNavigationPage().navigateToHistory();
    });

    await test.step('2. Verify appointment history matches submitted data', async () => {
      const appointment = historyPage.getAppointment(bookedAppointment.visitDate);
      await expect(appointment.visitDate).toHaveText(bookedAppointment.visitDate);
      await expect(appointment.facility).toHaveText(bookedAppointment.facility);
      await expect(appointment.readmission).toHaveText(
        bookedAppointment.readmission ? 'Yes' : 'No',
      );
      await expect(appointment.program).toHaveText(bookedAppointment.healthcareProgram);
      await expect(appointment.comment).toHaveText(bookedAppointment.comment);
    });
  });
});
