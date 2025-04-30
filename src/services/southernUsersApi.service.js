const mockUsers = [
  {
    id: '20bf5474-5b97-4dd2-afe4-e375bfd58cd0',
    username: 'ausie',
    email: 'ausie@example.com',
    password: 'hashed_password',
    latitude: -33.8688,
    longitude: 151.2093,
    browser_language: 'en-AU'
  }
];

module.exports = {
  async insertUser (data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers[0]);
      }, 1000);
    });
  },
  
  async fetchAllUsers () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers);
      }, 1000);
    });
  },
  
  async fetchSingleUser (id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers[0]);
      }, 1000);
    });
  },
  
  async updateUser (id, body) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers[0]);
      }, 1000);
    });
  },

  async deleteUser (id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUsers[0]);
      }, 1000);
    });
  }
}

