import {
  HEMISPHERE_NORTH,
  HEMISPHERE_SOUTH,
  DATA_SOURCE_DB,
  DATA_SOURCE_API,
} from "../config/constants.js";
import { isSouthOrNorth } from "../utils/geoLocation.js";



export class UserService {
  constructor(strategies) {
    this.strategies = strategies;
  }

  async getStorageStrategy(latitude, longitude) {
    const hemisphere = await isSouthOrNorth(latitude, longitude);
    const strategy = this.strategies[hemisphere];
    if (!strategy) {
      throw new Error(`No strategy found for hemisphere: ${hemisphere}`);
    }
    return strategy;
  }

  async searchForUser(id) {
    const results = await Promise.allSettled(
      Object.entries(this.strategies).map(([hemisphere, strategy]) =>
        strategy.getUserById(id).then((user) => ({ user, source: hemisphere }))
      )
    );

    const validResult = results
      .filter((r) => r.status === "fulfilled" && r.value.user)
      .map((r) => r.value)[0];

    return validResult || { user: undefined };
  }

  async getAllUsers() {
    const allUsers = await Promise.all(
      Object.values(this.strategies).map((strategy) => strategy.getAllUsers())
    );
    return allUsers
      .flat()
      .filter((user) => user)
      .sort((a, b) => a.id - b.id);
  }

  async getUserById(id) {
    const { user } = await this.searchForUser(id);
    return user;
  }

  async createUser(userData, hemisphere) {
    const strategy = this.strategies[hemisphere];
    if (!strategy) {
      throw new Error(`No strategy found for hemisphere: ${hemisphere}`);
    }
    return await strategy.createUser(userData);
  }

 async updateUser(id, userData, source, newHemisphere) {
    const currentStrategy = this.strategies[source];
    const newStrategy = this.strategies[newHemisphere];
    if (!currentStrategy || !newStrategy) {
      throw new Error(`Invalid strategy for source: ${source} or hemisphere: ${newHemisphere}`);
    }

    const needsMigration = source !== newHemisphere;
    let updatedUser;
    const migrated = { id, ...userData };
    if (needsMigration) {
      updatedUser = await newStrategy.createUser(migrated);
      await currentStrategy.deleteUser(id);
    } else {
      updatedUser = await currentStrategy.updateUser(id, userData);
    }

    return {
      id,
      username: userData.username,
      email: userData.email,
    };
  }

  async deleteUser(id, source) {
    const strategy = this.strategies[source];
    if (!strategy) {
      throw new Error(`No strategy found for source: ${source}`);
    }
    return await strategy.deleteUser(id);
  }

}
