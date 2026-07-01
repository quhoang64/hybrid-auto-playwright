import { test, expect } from '@fixtures';
import { generateAppointmentData } from '@test-data/AppointmentData';

test.describe('Make Appointment', () => {
  test('book appointment and verify confirmation', async ({ appointmentPage }) => {
    const data = generateAppointmentData();

    await test.step('1. Navigate to Make Appointment page', async () => {
      await appointmentPage.navigate();
    });

    await test.step('2. Fill appointment form', async () => {
      await appointmentPage.fillForm(data);
    });

    await test.step('3. Submit appointment', async () => {
      await appointmentPage.bookAppointment();
    });

    await test.step('4. Verify confirmation details', async () => {
      await expect(appointmentPage.confirmFacility).toHaveText(data.facility);
      await expect(appointmentPage.confirmReadmission).toHaveText(data.readmission ? 'Yes' : 'No');
      await expect(appointmentPage.confirmProgram).toHaveText(data.healthcareProgram);
      await expect(appointmentPage.confirmVisitDate).toHaveText(data.visitDate);
      await expect(appointmentPage.confirmComment).toHaveText(data.comment);
    });
  });
});
