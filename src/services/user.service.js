const dbService = require("./db.service");
const apiService = require("./southernUsersApi.service");

module.exports = {
  async searchForUser(id) {
    const { user, source } = await Promise.any([
      dbService.getUserById(id).then((user) => ({ user, source: "db" })),
      apiService.fetchSingleUser(id).then((user) => ({ user, source: "api" })),
    ]);
    return { user, source };
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

  async updateUser(id, userData, source, needsMigration) {
    // Migrating user to correct hemmisphere
    let updatedUser;
    if (needsMigration) {
      if (newHemisphere === "N") {
        // From API to DB
        updatedUser = await dbService.createUser(userData);
        await apiService.deleteUser(id);
      } else {
        // From DB to API
        updatedUser = await apiService.insertUser(userData);
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

  async deleteUser(id) {
    const deletedFromDb = await dbService.deleteUser(id);
    if (deletedFromDb) return;

    await apiService.deleteUser(id);
  },
};
