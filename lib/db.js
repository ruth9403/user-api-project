import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

/**
 * Creates sqlite connection with its client 
 */
export class SQLiteDb {
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