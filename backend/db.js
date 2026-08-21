// Sequelize setup for the local SQLite database that can be imported into Turso.
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const configuredStorage = process.env.SQLITE_STORAGE;
const bundledStorage = configuredStorage
  ? (path.isAbsolute(configuredStorage) ? configuredStorage : path.join(__dirname, configuredStorage))
  : path.join(__dirname, 'database', 'makkaylee.sqlite');
const storage = process.env.VERCEL
  ? path.join('/tmp', 'makkaylee.sqlite')
  : bundledStorage;

if (process.env.VERCEL && !fs.existsSync(storage)) {
  fs.mkdirSync(path.dirname(storage), { recursive: true });
  fs.copyFileSync(bundledStorage, storage);
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

module.exports = sequelize;
