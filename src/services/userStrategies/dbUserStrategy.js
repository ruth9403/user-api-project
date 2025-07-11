import DbService from "../db.service";

export class DbUserStrategy {
  async getUserById(id) {
    return DbService.getUserById(id);
  }
  async getAllUsers() {
    return DbService.getAllUsers();
  }
  async createUser(userData) {
    return DbService.createUser(userData);
  }
  async updateUser(id, userData) {
    return DbService.updateUser(id, userData);
  }
  async deleteUser(id) {
    return DbService.deleteUser(id);
  }
}
