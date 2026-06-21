import { faker } from '@faker-js/faker';
import { loadTestData } from '@helpers/DataLoader';

export interface DateData {
  daysFromToday: number;
}

export interface StaticDates {
  nearFuture: DateData;
  farFuture: DateData;
  nextMonth: DateData;
}

// Random data — dùng khi muốn test với date mới mỗi lần chạy
export function generateFutureDate(minDays = 1, maxDays = 30): DateData {
  return {
    daysFromToday: faker.number.int({ min: minDays, max: maxDays }),
  };
}

// Static data — dùng khi cần reproduce bug hoặc test cần date cố định
export function getStaticDates(): StaticDates {
  return loadTestData<StaticDates>('dates.json');
}
