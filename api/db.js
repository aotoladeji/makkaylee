// Database module for Vercel serverless functions with Turso
const { createClient } = require('@libsql/client');

let db = null;

async function getDb() {
  if (db) return db;

  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('TURSO_CONNECTION_URL not set');
    return null;
  }

  db = createClient({
    url,
    authToken,
  });

  return db;
}

async function query(sql, params = []) {
  const db = await getDb();
  if (!db) throw new Error('Database not configured');
  
  try {
    const result = await db.execute({
      sql,
      args: params,
    });
    return result.rows || [];
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
}

async function run(sql, params = []) {
  const db = await getDb();
  if (!db) throw new Error('Database not configured');
  
  try {
    await db.execute({
      sql,
      args: params,
    });
  } catch (err) {
    console.error('Execute error:', err);
    throw err;
  }
}

module.exports = { getDb, query, run };
