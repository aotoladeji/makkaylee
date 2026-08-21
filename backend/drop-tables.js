const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sequelize = require('./db');

async function dropTables() {
  try {
    await sequelize.authenticate();
    await sequelize.drop();
    console.log('Tables dropped successfully.');
  } catch (err) {
    console.error('Error dropping tables:', err);
  } finally {
    await sequelize.close();
  }
}

dropTables();
