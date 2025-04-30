const db = require('../lib/db');
const fs = require('fs');
const path = require('path');

/**
 * Executes all sql statements in createSchema.sql
 */
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

createSchema().then(r => {
  console.log('Finished  OK');
}).catch(e => {
  console.log('Finished  KO', e);
});