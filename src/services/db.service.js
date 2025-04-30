const db = require("../../lib/db");

module.exports = {
  async getAllUsers() {
    const client = await db.getClient();
    try {
      return await client.all("SELECT * FROM user");
    } finally {
      await client.close();
    }
  },

  async getUserById(id) {
    const client = await db.getClient();
    try {
      return await client.get("SELECT * FROM user WHERE id = ?", [id]);
    } finally {
      await client.close();
    }
  },

  async createUser(userData) {
      const client = await db.getClient();
    try {
      const result = await client.run(
        `INSERT INTO user 
         (id, username, email, password, latitude, longitude, browser_language)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        Object.values(userData)
      );
      console.log('result', result);
      return result;
    } finally {
      await client.close();
    }
  },

  async updateUser(id, userData) {
      const client = await db.getClient();
    try {
      const setClause = Object.keys(userData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(userData).concat(id);
      const result = await client.run(`UPDATE user SET ${setClause} WHERE id = ?`, values);
      return result;
    } finally {
      await client.close();
    }
  },

  async deleteUser(id) {
    const client = await db.getClient();
    try {
      const result = await client.run("DELETE FROM user WHERE id = ?", [id]);
      return result.changes > 0;
    } finally {
      await client.close();
    }
  },
};
