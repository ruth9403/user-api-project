import SouthernUsersApiService from "../southernUsersApi.service";

export class ApiUserStrategy {
  async getUserById(id) {
    return SouthernUsersApiService.fetchSingleUser(id);
  }
  async getAllUsers() {
    return SouthernUsersApiService.fetchAllUsers();
  }
  async createUser(userData) {
    return SouthernUsersApiService.insertUser(userData);
  }
  async updateUser(id, userData) {
    return SouthernUsersApiService.updateUser(id, userData);
  }
  async deleteUser(id) {
    return SouthernUsersApiService.deleteUser(id);
  }
}