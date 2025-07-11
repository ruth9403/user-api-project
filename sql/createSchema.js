import fs from 'fs';
import path from 'path';
import { SQLiteDb } from '../lib/db.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


/**
 * Executes all sql statements in createSchema.sql
 */

const db = new SQLiteDb();
const createSchema = async () => {
  const dbClient = await db.getClient();
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'createSchema.sql'));
    console.log('- LOADING SCHEMA -');

    await dbClient.exec(schema.toString());
    console.log('Schema loaded successfully');

    // Verify Tables
    const tables = await dbClient.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Created tables:', tables);

    // Check user table
    const users = await dbClient.all('SELECT * FROM user');
    console.log('user table contents:', users);
  } catch (e) {
    console.error('Error loading schema:', e.message);
    throw e;
  }finally {
    await dbClient.close(); // Always close the connection
    console.log('Database connection closed');
  }
};

// Execute createSchema only if this script is run directly ( npm run create-db)
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  createSchema()
    .then(() => {
      console.log('Finished  OK');
      process.exit(0);
    })
    .catch((e) => {
      console.log('Finished  KO', e);
      process.exit(1);
    });
}

export { createSchema };