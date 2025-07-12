import { SouthernUsersApiService } from "../southernUsersApi.service.js";
import { StorageStrategy } from "./storageStrategy.js";

export class ApiStorageStrategy extends StorageStrategy {
  constructor() {
    super();
    this.apiService = new SouthernUsersApiService();
  }

  async createUser(userData) {
    return await this.apiService.insertUser(userData);
  }

  async getUserById(id) {
    return await this.apiService.fetchSingleUser(id);
  }

  async getAllUsers() {
    return await this.apiService.fetchAllUsers();
  }

  async updateUser(id, userData) {
    return await this.apiService.updateUser(id, userData);
  }

  async deleteUser(id) {
    return await this.apiService.deleteUser(id);
  }
}