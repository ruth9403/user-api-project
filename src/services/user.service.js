const dbService = require("./db.service");
const apiService = require("./southernUsersApi.service");

module.exports = {
  async searchForUser(id) {
    const [dbResult, apiResult] = await Promise.allSettled([
        dbService.getUserById(id).then((user) => ({ user, source: "db" })),
        apiService.fetchSingleUser(id).then((user) => ({ user, source: "api" })),
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
    return hemisphere === "N"
      ? dbService.createUser(userData)
      : apiService.insertUser(userData);
  },

  async updateUser(id, userData, source, newHemisphere) {
    const needsMigration =
      (source === "db" && newHemisphere === "S") ||
      (source === "api" && newHemisphere === "N");

    // Migrating user to correct hemmisphere
    let updatedUser;
    const migrated = { id, ...userData }
    if (needsMigration) {
      if (newHemisphere === "N") {
        // From API to DB
        updatedUser = await dbService.createUser(migrated);
        await apiService.deleteUser(id);
      } else {
        // From DB to API
        updatedUser = await apiService.insertUser(migrated);
        await dbService.deleteUser(id);
      }
    } else if (source === "db") {
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
    if (source === "db") {
      const deletedDb = await dbService.deleteUser(id);
      return deletedDb;
    }else {
      const deletedAPI = await apiService.deleteUser(id);
      return deletedAPI
    }
  },
};
