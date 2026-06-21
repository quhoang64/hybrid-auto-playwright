import { BaseApi } from './BaseApi';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

export class UserApi extends BaseApi {
  async createUser(payload: CreateUserPayload) {
    const response = await this.request.post('/api/users', { data: payload });
    return response.json();
  }

  async getUser(id: number) {
    const response = await this.request.get(`/api/users/${id}`);
    return response.json();
  }

  async deleteUser(id: number) {
    await this.request.delete(`/api/users/${id}`);
  }
}
