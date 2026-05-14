// Sequelize setup for PostgreSQL
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('makkaylee_db', 'postgres', 'Network_admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;
