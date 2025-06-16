const dbService = require("./db.service");
const apiService = require("./southernUsersApi.service");
const {
  HEMISPHERE_NORTH,
  HEMISPHERE_SOUTH,
  DATA_SOURCE_DB,
  DATA_SOURCE_API,
} = require("../config/constants");

module.exports = {
  async searchForUser(id) {
    const [dbResult, apiResult] = await Promise.allSettled([
        dbService.getUserById(id).then((user) => ({ user, source: DATA_SOURCE_DB })),
        apiService.fetchSingleUser(id).then((user) => ({ user, source: DATA_SOURCE_API })),
      ]);
    
      const validResult = [dbResult, apiResult]
        .filter((r) => r.status === "fulfilled" && r.value.user)[0];
    
      if (!validResult) return { user: undefined };
    
      return validResult.value;
  },

  async getAllUsers() {
    const [northernUsers, southernUsers] = await Promise.all([
      dbService.getAllUsers(),
      apiService.fetchAllUsers(),
    ]);
    return [...(northernUsers || []), ...(southernUsers || [])].sort(
      (a, b) => a.id - b.id
    );
  },

  async getUserById(id) {
    const { user } = await this.searchForUser(id);
    return user;
  },

  async createUser(userData, hemisphere) {
    return hemisphere === HEMISPHERE_NORTH
      ? dbService.createUser(userData)
      : apiService.insertUser(userData);
  },

  async updateUser(id, userData, source, newHemisphere) {
    const needsMigration =
      (source === DATA_SOURCE_DB && newHemisphere === HEMISPHERE_SOUTH) ||
      (source === DATA_SOURCE_API && newHemisphere === HEMISPHERE_NORTH);

    // Migrating user to correct hemmisphere
    let updatedUser;
    const migrated = { id, ...userData }
    if (needsMigration) {
      if (newHemisphere === HEMISPHERE_NORTH) {
        // From API to DB
        updatedUser = await dbService.createUser(migrated);
        await apiService.deleteUser(id);
      } else {
        // From DB to API
        updatedUser = await apiService.insertUser(migrated);
        await dbService.deleteUser(id);
      }
    } else if (source === DATA_SOURCE_DB) {
      // Continues in North, updating DB
      updatedUser = await dbService.updateUser(id, userData);
    } else {
      // Continues in South, updating through API
      updatedUser = await apiService.updateUser(id, userData);
    }

    return {
      id: id,
      username: userData.username,
      email: userData.email,
    };
  },

  async deleteUser(id, source) {
    if (source === DATA_SOURCE_DB) {
      const deletedDb = await dbService.deleteUser(id);
      return deletedDb;
    }else {
      const deletedAPI = await apiService.deleteUser(id);
      return deletedAPI
    }
  },
};
