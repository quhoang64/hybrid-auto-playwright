import { faker } from '@faker-js/faker';
import { loadTestData } from '@helpers/DataLoader';

export interface UserData {
  name: string;
  email: string;
  password: string;
}

export interface StaticUsers {
  standardUser: UserData;
  adminUser: UserData;
  readOnlyUser: UserData;
}

// Random data — dùng khi muốn test với data mới mỗi lần chạy
export function generateUser(overrides: Partial<UserData> = {}): UserData {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
    ...overrides,
  };
}

// Static data — dùng khi cần reproduce bug hoặc test cần data cố định
export function getStaticUsers(): StaticUsers {
  return loadTestData<StaticUsers>('users.json');
}
