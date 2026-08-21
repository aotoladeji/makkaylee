// Sequelize setup for the local SQLite database that can be imported into Turso.
const path = require('path');
const { Sequelize } = require('sequelize');

const configuredStorage = process.env.SQLITE_STORAGE;
const storage = configuredStorage
  ? (path.isAbsolute(configuredStorage) ? configuredStorage : path.join(__dirname, configuredStorage))
  : path.join(__dirname, 'database', 'makkaylee.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

module.exports = sequelize;
