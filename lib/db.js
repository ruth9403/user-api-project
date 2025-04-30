const sqlite3 = require('sqlite3')
const { open } = require('sqlite');

/**
 * Creates sqlite connection with its client 
 */
class SQLiteDb {
  #client = null;
  // static #databaseFilename = ':memory:';
  static #databaseFilename = './database.db';

  async getClient() {
      return open({
        filename: SQLiteDb.#databaseFilename,
        driver: sqlite3.Database
      });
  }
}

module.exports = new SQLiteDb();