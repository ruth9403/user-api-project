const { mockUsers } = require("../mocks/user");

module.exports = {
  async insertUser(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers[0]);
      }, 1000);
    });
  },

  async fetchAllUsers() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers);
      }, 1000);
    });
  },

  async fetchSingleUser(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.id === id);
        resolve(user);
      }, 1000);
    });
  },

  async updateUser(id, body) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers[0]);
      }, 1000);
    });
  },

  async deleteUser(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers[0]);
      }, 1000);
    });
  },
};
