export type Facility =
  | 'Tokyo CURA Healthcare Center'
  | 'Hongkong CURA Healthcare Center'
  | 'Seoul CURA Healthcare Center';

export type HealthcareProgram = 'Medicare' | 'Medicaid' | 'None';

export interface AppointmentData {
  facility: Facility;
  readmission: boolean;
  healthcareProgram: HealthcareProgram;
  visitDate: string; // dd/mm/yyyy
  comment: string;
}

export function generateAppointmentData(overrides?: Partial<AppointmentData>): AppointmentData {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return {
    facility: 'Hongkong CURA Healthcare Center',
    readmission: true,
    healthcareProgram: 'Medicaid',
    visitDate: `${dd}/${mm}/${yyyy}`,
    comment: `Automated test appointment ${Date.now()}`,
    ...overrides,
  };
}
