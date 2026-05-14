const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'makkaylee_db',
  password: 'Network_admin',
  port: 5432,
});

async function dropTables() {
  try {
    await client.connect();
    await client.query('DROP TABLE IF EXISTS "BillingInfos" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "Registrations" CASCADE;');
    await client.query('DROP TABLE IF EXISTS "Users" CASCADE;');
    console.log('Tables dropped successfully.');
  } catch (err) {
    console.error('Error dropping tables:', err);
  } finally {
    await client.end();
  }
}

dropTables();
