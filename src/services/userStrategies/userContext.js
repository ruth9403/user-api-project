import DbUserStrategy from "./dbUserStrategy";
import ApiUserStrategy from "./apiUserStrategy";
import { HEMISPHERE_NORTH, HEMISPHERE_SOUTH } from "../../config/constants";

export class UserContext {

  constructor(hemisphere) {
    if (hemisphere === HEMISPHERE_NORTH) {
      this.strategy = new DbUserStrategy();
    } else if (hemisphere === HEMISPHERE_SOUTH) {
      this.strategy = new ApiUserStrategy();
    } else {
      throw new Error("Invalid hemisphere");
    }
  }

  async getUserById(id) {
    return this.strategy.getUserById(id);
  }

  async getAllUsers() {
    return this.strategy.getAllUsers();
  }

  async createUser(userData) {
    return this.strategy.createUser(userData);
  }

  async updateUser(id, userData) {
    return this.strategy.updateUser(id, userData);
  }
  
  async deleteUser(id) {
    return this.strategy.deleteUser(id);
  }
}
