const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');
const sequelize = require('./db');
require('./models');

async function syncDb() {
  try {
    const storage = sequelize.options.storage;
    fs.mkdirSync(path.dirname(storage), { recursive: true });
    await sequelize.authenticate();
    await sequelize.query('PRAGMA journal_mode = WAL');
    await sequelize.sync({ alter: true });
    console.log(`SQLite database synced: ${storage}`);
  } catch (err) {
    console.error('DB sync error:', err);
  } finally {
    await sequelize.close();
  }
}

syncDb();
