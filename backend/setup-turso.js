#!/usr/bin/env node
/**
 * Initialize Turso database schema
 * Run: node backend/setup-turso.js
 * 
 * Make sure these env vars are set:
 * - TURSO_CONNECTION_URL
 * - TURSO_AUTH_TOKEN
 */

const { createClient } = require('@libsql/client');

const TURSO_CONNECTION_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_CONNECTION_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing environment variables: TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

async function setupDatabase() {
  let db;
  try {
    db = createClient({
      url: TURSO_CONNECTION_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    console.log('🔧 Setting up Turso database schema...\n');

    // Create User table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "User" (
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
      )
    `);
    console.log('✅ Created User table');

    // Create Registration table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "Registration" (
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
        FOREIGN KEY (userId) REFERENCES "User"(id)
      )
    `);
    console.log('✅ Created Registration table');

    // Create BillingInfo table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "BillingInfo" (
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
        FOREIGN KEY (registrationId) REFERENCES "Registration"(id)
      )
    `);
    console.log('✅ Created BillingInfo table');

    // Create TrainingEvent table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "TrainingEvent" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT 'Next Training Session',
        dateLabel TEXT NOT NULL DEFAULT 'April 4, 2026',
        venue TEXT NOT NULL DEFAULT 'International School Ibadan, University of Ibadan',
        note TEXT DEFAULT 'Open to all new registrants',
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created TrainingEvent table');

    // Create GalleryMedia table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "GalleryMedia" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        caption TEXT DEFAULT '',
        mediaType TEXT NOT NULL,
        mediaUrl TEXT NOT NULL,
        mimeType TEXT DEFAULT '',
        isPublished BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created GalleryMedia table');

    // Create Sponsor table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "Sponsor" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT DEFAULT '',
        websiteUrl TEXT DEFAULT '',
        logoUrl TEXT NOT NULL,
        isPublished BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created Sponsor table');

    // Create PaymentConfig table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "PaymentConfig" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        oneTimeRegistrationFee REAL NOT NULL DEFAULT 40000,
        trainingSessionFee REAL NOT NULL DEFAULT 30000,
        bundleMonths INTEGER NOT NULL DEFAULT 0,
        monthlyBundleFee REAL NOT NULL DEFAULT 0,
        dueDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created PaymentConfig table');

    // Create default admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      await db.execute(
        `INSERT INTO "User" (username, password, email, isAdmin, isStaff, parentName, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin', hashedPassword, 'admin@makkaylee.com', 1, 1, 'Admin User', '']
      );
      console.log('✅ Created default admin user (username: admin, password: admin123)');
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        console.log('ℹ️  Admin user already exists');
      } else {
        throw err;
      }
    }

    // Create default PaymentConfig
    try {
      await db.execute(
        `INSERT INTO "PaymentConfig" (oneTimeRegistrationFee, trainingSessionFee, bundleMonths, monthlyBundleFee, isActive)
         VALUES (?, ?, ?, ?, ?)`,
        [40000, 30000, 0, 0, 1]
      );
      console.log('✅ Created default PaymentConfig');
    } catch (err) {
      if (err.message.includes('UNIQUE') || err.message.includes('duplicate')) {
        console.log('ℹ️  PaymentConfig already exists');
      } else {
        throw err;
      }
    }

    // Create default TrainingEvent
    try {
      await db.execute(
        `INSERT INTO "TrainingEvent" (title, dateLabel, venue, note, isActive)
         VALUES (?, ?, ?, ?, ?)`,
        ['Next Training Session', 'April 4, 2026', 'International School Ibadan, University of Ibadan', 'Open to all new registrants', 1]
      );
      console.log('✅ Created default TrainingEvent');
    } catch (err) {
      if (err.message.includes('UNIQUE') || err.message.includes('duplicate')) {
        console.log('ℹ️  TrainingEvent already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✨ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
