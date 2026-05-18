// Sequelize setup for PostgreSQL
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.NODE_ENV === 'production'
      ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
      : {},
  })
  : new Sequelize(
    process.env.DB_NAME || 'makkaylee_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false,
    },
  );

module.exports = sequelize;
