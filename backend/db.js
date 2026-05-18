// Sequelize setup for PostgreSQL
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

function parseBoolean(value) {
  if (value === undefined) return null;
  return String(value).toLowerCase() === 'true';
}

function shouldUseSsl(urlValue) {
  const explicitSsl = parseBoolean(process.env.DB_SSL);
  if (explicitSsl !== null) return explicitSsl;

  if (!urlValue) return process.env.NODE_ENV === 'production';

  try {
    const parsed = new URL(urlValue);
    const host = (parsed.hostname || '').toLowerCase();
    const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
    return !localHosts.has(host);
  } catch {
    return process.env.NODE_ENV === 'production';
  }
}

const useSsl = shouldUseSsl(databaseUrl);
const rejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED);
const sslRejectUnauthorized = rejectUnauthorized === null ? false : rejectUnauthorized;

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: useSsl
      ? {
        ssl: {
          require: true,
          rejectUnauthorized: sslRejectUnauthorized,
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
