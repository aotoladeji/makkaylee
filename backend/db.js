// Sequelize setup for the local SQLite database that can be imported into Turso.
const path = require('path');
const { Sequelize } = require('sequelize');

const storage = process.env.SQLITE_STORAGE
  ? path.resolve(process.env.SQLITE_STORAGE)
  : path.join(__dirname, 'database', 'makkaylee.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

module.exports = sequelize;
