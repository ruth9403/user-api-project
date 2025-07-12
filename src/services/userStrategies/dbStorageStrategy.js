import { DbService } from "../db.service.js";
import { StorageStrategy } from "./storageStrategy.js";

export class DbStorageStrategy extends StorageStrategy {
  constructor() {
    super();
    this.dbService = new DbService();
  }

  async createUser(userData) {
    return await this.dbService.createUser(userData);
  }

  async getUserById(id) {
    return await this.dbService.getUserById(id);
  }

  async getAllUsers() {
    return await this.dbService.getAllUsers();
  }

  async updateUser(id, userData) {
    return await this.dbService.updateUser(id, userData);
  }

  async deleteUser(id) {
    return await this.dbService.deleteUser(id);
  }
}