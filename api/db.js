// Database module for Vercel serverless functions with Turso
const { createClient } = require('@libsql/client');

let db = null;
let initialized = false;

async function getDb() {
  if (db) return db;

  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_CONNECTION_URL environment variable not set. Set it in Vercel project settings.');
  }

  db = createClient({
    url,
    authToken,
  });

  // Initialize database schema on first connection
  if (!initialized) {
    try {
      await initializeSchema();
      initialized = true;
    } catch (err) {
      console.error('Schema initialization error (non-fatal):', err.message);
      // Continue anyway - tables might already exist
      initialized = true;
    }
  }

  return db;
}

async function initializeSchema() {
  if (!db) return;
  
  // Create tables if they don't exist
  const tables = [
    `CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      isAdmin BOOLEAN DEFAULT 0,
      isStaff BOOLEAN DEFAULT 0,
      parentName TEXT,
      phone TEXT,
      address TEXT,
      resetToken TEXT,
      resetTokenExpiry DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS Registration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      playerName TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT,
      program TEXT,
      medical TEXT,
      consent BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'Pending Payment',
      badges TEXT DEFAULT '[]',
      passportUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id)
    )`,
    `CREATE TABLE IF NOT EXISTS BillingInfo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registrationId INTEGER NOT NULL,
      amountDue REAL NOT NULL,
      registrationFee REAL NOT NULL DEFAULT 40000,
      registrationFeeSettled BOOLEAN NOT NULL DEFAULT 0,
      trainingSessionFee REAL NOT NULL DEFAULT 30000,
      bundleMonths INTEGER NOT NULL DEFAULT 0,
      bundleFee REAL NOT NULL DEFAULT 0,
      paymentMode TEXT NOT NULL DEFAULT 'one_time',
      selectedAmount REAL,
      dueDate DATETIME NOT NULL,
      paid BOOLEAN DEFAULT 0,
      receiptUrl TEXT,
      receiptMimeType TEXT,
      receiptUploadedAt DATETIME,
      paymentConfirmedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registrationId) REFERENCES Registration(id)
    )`,
    `CREATE TABLE IF NOT EXISTS TrainingEvent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT 'Next Training Session',
      dateLabel TEXT NOT NULL DEFAULT 'April 4, 2026',
      venue TEXT NOT NULL DEFAULT 'International School Ibadan, University of Ibadan',
      note TEXT DEFAULT 'Open to all new registrants',
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS GalleryMedia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      caption TEXT DEFAULT '',
      mediaType TEXT NOT NULL,
      mediaUrl TEXT NOT NULL,
      mimeType TEXT DEFAULT '',
      isPublished BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS Sponsor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT DEFAULT '',
      websiteUrl TEXT DEFAULT '',
      logoUrl TEXT NOT NULL,
      isPublished BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS PaymentConfig (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      oneTimeRegistrationFee REAL NOT NULL DEFAULT 40000,
      trainingSessionFee REAL NOT NULL DEFAULT 30000,
      bundleMonths INTEGER NOT NULL DEFAULT 0,
      monthlyBundleFee REAL NOT NULL DEFAULT 0,
      dueDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of tables) {
    try {
      await db.execute(sql);
    } catch (err) {
      // Table might already exist, continue
      if (!err.message.includes('already exists')) {
        console.warn('Table creation warning:', err.message);
      }
    }
  }

  // Ensure default admin user exists
  try {
    const bcrypt = require('bcryptjs');
    const existingAdmin = await query('SELECT id FROM User WHERE username = ? LIMIT 1', ['admin']);
    
    if (!existingAdmin.length) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await run(
        'INSERT INTO User (username, password, email, isAdmin, parentName) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin@makkaylee.com', 1, 'Admin']
      );
      console.log('✅ Default admin user created (username: admin, password: admin)');
    }
  } catch (err) {
    console.warn('Admin user creation warning:', err.message);
  }
}

async function query(sql, params = []) {
  try {
    const db = await getDb();
    const result = await db.execute({
      sql,
      args: params,
    });
    return result.rows || [];
  } catch (err) {
    console.error('Query error:', err.message, 'SQL:', sql);
    throw err;
  }
}

async function run(sql, params = []) {
  try {
    const db = await getDb();
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
