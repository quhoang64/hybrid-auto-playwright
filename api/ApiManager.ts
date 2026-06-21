import { APIRequestContext } from '@playwright/test';
import { UserApi } from './UserApi';

export class ApiManager {
  private readonly userApi: UserApi;

  constructor(request: APIRequestContext) {
    this.userApi = new UserApi(request);
  }

  onUserApi() {
    return this.userApi;
  }
}
