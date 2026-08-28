/**
 * Vercel Serverless Functions API Handler with Turso Database
 * COMPREHENSIVE - Handles ALL backend operations for Vercel deployment
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, run } = require('./db');

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────

function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 ? parts[1] : null;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function jsonResponse(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function computeAmountByMode(registrationFee, trainingSessionFee, bundleFee, paymentMode, includeRegistrationFee = true) {
  const registration = Number(registrationFee || 0);
  const training = Number(trainingSessionFee || 0);
  const bundle = Number(bundleFee || 0);
  const registrationPart = includeRegistrationFee ? registration : 0;

  if (paymentMode === 'bundle') {
    return registrationPart + bundle;
  }

  return registrationPart + training;
}

// ─────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────

async function handleLogin(req, res) {
  const body = await getRequestBody(req);
  const { username, password } = body;

  if (!username || !password) {
    return jsonResponse(res, 400, { error: 'Username and password required' });
  }

  try {
    const rows = await query(
      'SELECT id, username, password, isAdmin, isStaff FROM User WHERE LOWER(username) = LOWER(?)',
      [username]
    );

    if (!rows.length) {
      return jsonResponse(res, 401, { error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return jsonResponse(res, 401, { error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin, isStaff: user.isStaff },
      SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    jsonResponse(res, 200, { token });
  } catch (err) {
    console.error('Login error:', err.message);
    if (err.message.includes('no such table') || err.message.includes('not connected')) {
      return jsonResponse(res, 503, { error: 'Database not initialized' });
    }
    jsonResponse(res, 400, { error: 'Login failed. Please try again.' });
  }
}

async function handleRegister(req, res) {
  const body = await getRequestBody(req);
  const { username, password, email, parentName, phone, address, playerName, age, gender, program, medical, consent } = body;

  if (!username || !password || !email || !parentName || !playerName || age === undefined || !gender || !program) {
    return jsonResponse(res, 400, { error: 'All required fields must be provided' });
  }

  try {
    // Check if username already exists
    const existing = await query('SELECT id FROM User WHERE LOWER(username) = LOWER(?)', [username]);
    if (existing.length) {
      return jsonResponse(res, 400, { error: 'Username is already taken' });
    }

    const hash = await bcrypt.hash(password, 10);
    
    // Create parent user
    const userResult = await run(
      'INSERT INTO User (username, password, email, parentName, phone, address, isAdmin, isStaff, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [username, hash, email, parentName, phone || '', address || '']
    );

    const userId = userResult.lastID;

    // Get payment config
    const configRows = await query('SELECT * FROM PaymentConfig WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');
    const config = configRows.length ? configRows[0] : { oneTimeRegistrationFee: 40000, trainingSessionFee: 30000, bundleMonths: 0, monthlyBundleFee: 0, dueDate: new Date() };

    // Create registration
    const regResult = await run(
      'INSERT INTO Registration (playerName, age, gender, program, medical, consent, userId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [playerName, age, gender, program, medical || '', consent ? 1 : 0, userId, 'Pending Payment']
    );

    const registrationId = regResult.lastID;

    // Create billing info
    const totalAmountDue = computeAmountByMode(config.oneTimeRegistrationFee, config.trainingSessionFee, config.monthlyBundleFee, 'one_time', true);
    await run(
      'INSERT INTO BillingInfo (registrationId, amountDue, registrationFee, registrationFeeSettled, trainingSessionFee, bundleMonths, bundleFee, paymentMode, selectedAmount, dueDate, paid, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [registrationId, totalAmountDue, config.oneTimeRegistrationFee, config.trainingSessionFee, config.bundleMonths, config.monthlyBundleFee, 'one_time', totalAmountDue, config.dueDate]
    );

    jsonResponse(res, 200, { message: 'Registration successful' });
  } catch (err) {
    console.error('Register error:', err.message);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleStaffLogin(req, res) {
  const body = await getRequestBody(req);
  const { username, password } = body;

  if (!username || !password) {
    return jsonResponse(res, 400, { error: 'Username and password required' });
  }

  try {
    const rows = await query(
      'SELECT id, username, password, isAdmin, isStaff FROM User WHERE LOWER(username) = LOWER(?) AND isStaff = 1',
      [username]
    );

    if (!rows.length) {
      return jsonResponse(res, 401, { error: 'Invalid staff credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return jsonResponse(res, 401, { error: 'Invalid staff credentials' });
    }

    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin, isStaff: user.isStaff },
      SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    jsonResponse(res, 200, { token });
  } catch (err) {
    console.error('Staff login error:', err.message);
    jsonResponse(res, 400, { error: 'Login failed' });
  }
}

async function handleAddChild(req, res, user) {
  const body = await getRequestBody(req);
  const { playerName, age, gender, program, medical, consent } = body;

  if (!playerName || age === undefined || !gender || !program || consent !== true) {
    return jsonResponse(res, 400, { error: 'playerName, age, gender, program, and consent are required' });
  }

  try {
    // Get payment config
    const configRows = await query('SELECT * FROM PaymentConfig WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');
    const config = configRows.length ? configRows[0] : { oneTimeRegistrationFee: 40000, trainingSessionFee: 30000, bundleMonths: 0, monthlyBundleFee: 0, dueDate: new Date() };

    // Create registration
    const regResult = await run(
      'INSERT INTO Registration (playerName, age, gender, program, medical, consent, userId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [playerName, age, gender, program, medical || '', consent ? 1 : 0, user.id, 'Pending Payment']
    );

    const registrationId = regResult.lastID;

    // Create billing info
    const totalAmountDue = computeAmountByMode(config.oneTimeRegistrationFee, config.trainingSessionFee, config.monthlyBundleFee, 'one_time', true);
    await run(
      'INSERT INTO BillingInfo (registrationId, amountDue, registrationFee, registrationFeeSettled, trainingSessionFee, bundleMonths, bundleFee, paymentMode, selectedAmount, dueDate, paid, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [registrationId, totalAmountDue, config.oneTimeRegistrationFee, config.trainingSessionFee, config.bundleMonths, config.monthlyBundleFee, 'one_time', totalAmountDue, config.dueDate]
    );

    jsonResponse(res, 200, { message: 'Child registration added successfully', data: { registrationId } });
  } catch (err) {
    console.error('Add child error:', err.message);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetBilling(req, res, user) {
  try {
    const registrationIdParam = req.url.includes('registrationId=') ? parseInt(req.url.split('registrationId=')[1]) : null;

    const registrations = await query('SELECT id, playerName FROM Registration WHERE userId = ? ORDER BY createdAt DESC', [user.id]);

    if (!registrations.length) {
      return jsonResponse(res, 404, { error: 'Registration not found' });
    }

    const selectedRegistration = (registrationIdParam && !Number.isNaN(registrationIdParam)) 
      ? registrations.find(r => r.id === registrationIdParam) 
      : registrations[0];

    if (!selectedRegistration) {
      return jsonResponse(res, 404, { error: 'Requested child registration not found' });
    }

    const billing = await query('SELECT * FROM BillingInfo WHERE registrationId = ?', [selectedRegistration.id]);
    const billingData = billing.length ? billing[0] : {};

    jsonResponse(res, 200, {
      ...billingData,
      registrationId: selectedRegistration.id,
      playerName: selectedRegistration.playerName,
      children: registrations.map(r => ({ id: r.id, playerName: r.playerName })),
    });
  } catch (err) {
    console.error('Get billing error:', err.message);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetProfile(req, res, user) {
  try {
    const registrationIdParam = req.url.includes('registrationId=') ? parseInt(req.url.split('registrationId=')[1]) : null;

    // Get parent user info
    const userRows = await query('SELECT id, parentName, phone, email, address FROM User WHERE id = ?', [user.id]);
    if (!userRows.length) {
      return jsonResponse(res, 404, { error: 'User not found' });
    }
    const userData = userRows[0];

    // Get all registrations
    const registrations = await query('SELECT * FROM Registration WHERE userId = ? ORDER BY createdAt DESC', [user.id]);

    const selectedRegistration = (registrationIdParam && !Number.isNaN(registrationIdParam))
      ? registrations.find(r => r.id === registrationIdParam)
      : (registrations.length ? registrations[0] : null);

    let selectedBilling = null;
    if (selectedRegistration) {
      const billingRows = await query('SELECT * FROM BillingInfo WHERE registrationId = ?', [selectedRegistration.id]);
      selectedBilling = billingRows.length ? billingRows[0] : null;
    }

    const childrenPromises = registrations.map(async (registration) => {
      const billingRows = await query('SELECT * FROM BillingInfo WHERE registrationId = ?', [registration.id]);
      const billing = billingRows.length ? billingRows[0] : null;
      return {
        id: registration.id,
        playerName: registration.playerName,
        age: registration.age,
        gender: registration.gender,
        program: registration.program,
        medical: registration.medical,
        status: registration.status,
        badges: registration.badges ? JSON.parse(registration.badges) : [],
        createdAt: registration.createdAt,
        billing: billing ? {
          amountDue: billing.amountDue,
          dueDate: billing.dueDate,
          paid: billing.paid,
          paymentMode: billing.paymentMode,
          selectedAmount: billing.selectedAmount,
          receiptUploadedAt: billing.receiptUploadedAt,
          paymentConfirmedAt: billing.paymentConfirmedAt,
        } : null,
      };
    });

    const children = await Promise.all(childrenPromises);

    jsonResponse(res, 200, {
      user: {
        parentName: userData.parentName,
        phone: userData.phone,
        email: userData.email,
        address: userData.address,
      },
      registration: selectedRegistration || null,
      billing: selectedBilling,
      children,
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    jsonResponse(res, 500, { error: 'Failed to load profile' });
  }
}

async function handleUpdateChild(req, res, user) {
  const body = await getRequestBody(req);
  const childIdParam = parseInt(req.url.split('/').pop());

  if (Number.isNaN(childIdParam)) {
    return jsonResponse(res, 400, { error: 'Invalid child id' });
  }

  try {
    const registrations = await query('SELECT * FROM Registration WHERE id = ? AND userId = ?', [childIdParam, user.id]);
    if (!registrations.length) {
      return jsonResponse(res, 404, { error: 'Child registration not found' });
    }

    const { playerName, age, gender, program, medical } = body;
    if (!playerName || age === undefined || !gender || !program) {
      return jsonResponse(res, 400, { error: 'playerName, age, gender, and program are required' });
    }

    const numericAge = Number(age);
    if (Number.isNaN(numericAge) || numericAge < 4 || numericAge > 15) {
      return jsonResponse(res, 400, { error: 'Age must be between 4 and 15' });
    }

    await run(
      'UPDATE Registration SET playerName = ?, age = ?, gender = ?, program = ?, medical = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [playerName, numericAge, gender, program, medical || '', childIdParam]
    );

    jsonResponse(res, 200, { message: 'Child profile updated successfully' });
  } catch (err) {
    console.error('Update child error:', err.message);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleDeleteChild(req, res, user) {
  const childIdParam = parseInt(req.url.split('/').pop());

  if (Number.isNaN(childIdParam)) {
    return jsonResponse(res, 400, { error: 'Invalid child id' });
  }

  try {
    const registrations = await query('SELECT id FROM Registration WHERE userId = ?', [user.id]);
    if (registrations.length <= 1) {
      return jsonResponse(res, 400, { error: 'At least one child profile must remain on this account' });
    }

    const registrationExists = registrations.find(r => r.id === childIdParam);
    if (!registrationExists) {
      return jsonResponse(res, 404, { error: 'Child registration not found' });
    }

    // Delete billing info
    await run('DELETE FROM BillingInfo WHERE registrationId = ?', [childIdParam]);

    // Delete registration
    await run('DELETE FROM Registration WHERE id = ?', [childIdParam]);

    jsonResponse(res, 200, { message: 'Child profile deleted successfully' });
  } catch (err) {
    console.error('Delete child error:', err.message);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleUploadBillingReceipt(req, res, user) {
  const body = await getRequestBody(req);
  const { paymentMode, registrationId, receiptUrl } = body;

  if (!paymentMode || !['one_time', 'bundle'].includes(paymentMode)) {
    return jsonResponse(res, 400, { error: 'paymentMode must be one_time or bundle' });
  }

  if (!receiptUrl) {
    return jsonResponse(res, 400, { error: 'Receipt URL (from Cloudinary) is required' });
  }

  try {
    const requestedRegistrationId = Number(registrationId);
    const registrationWhere = { userId: user.id };
    if (!Number.isNaN(requestedRegistrationId)) {
      registrationWhere.id = requestedRegistrationId;
    }

    const registration = await query(
      'SELECT id, userId, status FROM Registration WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
      [user.id]
    );
    if (!registration.length) {
      return jsonResponse(res, 404, { error: 'Registration not found' });
    }

    const regId = registration[0].id;
    
    const billing = await query(
      'SELECT * FROM BillingInfo WHERE registrationId = ? LIMIT 1',
      [regId]
    );
    if (!billing.length) {
      return jsonResponse(res, 404, { error: 'Billing record not found' });
    }

    const selectedAmount = computeAmountByMode(
      billing[0].registrationFee,
      billing[0].trainingSessionFee,
      billing[0].bundleFee,
      paymentMode,
      !billing[0].registrationFeeSettled
    );

    await run(
      'UPDATE BillingInfo SET receiptUrl = ?, receiptMimeType = ?, receiptUploadedAt = ?, paymentMode = ?, selectedAmount = ?, amountDue = ?, paymentConfirmedAt = NULL WHERE registrationId = ?',
      [receiptUrl, 'application/cloudinary', new Date().toISOString(), paymentMode, selectedAmount, selectedAmount, regId]
    );

    await run(
      'UPDATE Registration SET status = ? WHERE id = ?',
      ['Receipt Submitted', regId]
    );

    jsonResponse(res, 200, { 
      message: 'Receipt uploaded successfully',
      data: { receiptUrl, receiptMimeType: 'application/cloudinary' }
    });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleChangePassword(req, res, user) {
  const body = await getRequestBody(req);
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return jsonResponse(res, 400, { error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return jsonResponse(res, 400, { error: 'New password must be at least 6 characters' });
  }

  try {
    const rows = await query('SELECT id, password FROM User WHERE id = ?', [user.id]);

    if (!rows.length) {
      return jsonResponse(res, 404, { error: 'User not found' });
    }

    const userRecord = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, userRecord.password);

    if (!isMatch) {
      return jsonResponse(res, 401, { error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await run('UPDATE User SET password = ?, resetToken = NULL, resetTokenExpiry = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [hash, user.id]);

    jsonResponse(res, 200, { message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleForgotPassword(req, res) {
  const body = await getRequestBody(req);
  const { email } = body;

  if (!email) {
    return jsonResponse(res, 400, { error: 'Email is required' });
  }

  try {
    const users = await query('SELECT id, email FROM User WHERE email = ?', [email]);
    if (!users.length) {
      return jsonResponse(res, 404, { error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await run(
      'UPDATE User SET resetToken = ?, resetTokenExpiry = ?, updatedAt = CURRENT_TIMESTAMP WHERE email = ?',
      [resetToken, resetTokenExpiry.toISOString(), email]
    );

    // TODO: Send email with reset link
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log(`Password reset link: ${resetUrl}`);

    jsonResponse(res, 200, { message: 'Password reset link sent (check console in dev mode)' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleResetPassword(req, res) {
  const body = await getRequestBody(req);
  const { token, password } = body;

  if (!token || !password) {
    return jsonResponse(res, 400, { error: 'Token and password are required' });
  }

  if (password.length < 6) {
    return jsonResponse(res, 400, { error: 'Password must be at least 6 characters' });
  }

  try {
    const users = await query(
      'SELECT id FROM User WHERE resetToken = ? AND resetTokenExpiry > CURRENT_TIMESTAMP',
      [token]
    );

    if (!users.length) {
      return jsonResponse(res, 400, { error: 'Invalid or expired reset token' });
    }

    const hash = await bcrypt.hash(password, 10);
    await run(
      'UPDATE User SET password = ?, resetToken = NULL, resetTokenExpiry = NULL, updatedAt = CURRENT_TIMESTAMP WHERE resetToken = ?',
      [hash, token]
    );

    jsonResponse(res, 200, { message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    jsonResponse(res, 400, { error: err.message });
  }
}

// ADMIN ENDPOINTS

async function handleGetTrainingEvent(req, res) {
  try {
    const rows = await query('SELECT * FROM TrainingEvent WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');
    if (rows.length) {
      jsonResponse(res, 200, { data: rows[0] });
    } else {
      jsonResponse(res, 200, { data: { id: 1, title: 'Next Training Session', dateLabel: 'April 4, 2026', venue: 'International School Ibadan, University of Ibadan', note: 'Open to all new registrants', isActive: 1 } });
    }
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleUpdateTrainingEvent(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const { title, dateLabel, venue, note } = body;

  if (!title || !dateLabel || !venue) {
    return jsonResponse(res, 400, { error: 'Title, date label, and venue are required' });
  }

  try {
    const rows = await query('SELECT id FROM TrainingEvent WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');

    if (rows.length) {
      await run('UPDATE TrainingEvent SET title = ?, dateLabel = ?, venue = ?, note = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [title, dateLabel, venue, note || '', rows[0].id]);
    } else {
      await run('INSERT INTO TrainingEvent (title, dateLabel, venue, note, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [title, dateLabel, venue, note || '']);
    }

    jsonResponse(res, 200, { message: 'Training event updated successfully' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetPaymentConfig(req, res) {
  try {
    const rows = await query('SELECT * FROM PaymentConfig WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');

    if (rows.length) {
      const config = rows[0];
      const oneTimeTotal = computeAmountByMode(config.oneTimeRegistrationFee, config.trainingSessionFee, config.monthlyBundleFee, 'one_time', true);
      const bundleTotal = computeAmountByMode(config.oneTimeRegistrationFee, config.trainingSessionFee, config.monthlyBundleFee, 'bundle', true);
      const hasBundleOption = Number(config.monthlyBundleFee || 0) > 0;

      jsonResponse(res, 200, {
        data: {
          ...config,
          oneTimeTotal,
          bundleTotal,
          hasBundleOption,
        },
      });
    } else {
      jsonResponse(res, 200, {
        data: {
          id: 1,
          oneTimeRegistrationFee: 40000,
          trainingSessionFee: 30000,
          bundleMonths: 0,
          monthlyBundleFee: 0,
          hasBundleOption: false,
        },
      });
    }
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleUpdatePaymentConfig(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const { oneTimeRegistrationFee, trainingSessionFee, bundleMonths, monthlyBundleFee, dueDate } = body;

  if (oneTimeRegistrationFee === undefined || trainingSessionFee === undefined || dueDate === undefined) {
    return jsonResponse(res, 400, { error: 'oneTimeRegistrationFee, trainingSessionFee, and dueDate are required' });
  }

  try {
    const registrationFee = Number(oneTimeRegistrationFee);
    const sessionFee = Number(trainingSessionFee);
    const months = bundleMonths === undefined || bundleMonths === null || bundleMonths === '' ? 0 : Number(bundleMonths);
    const bundleFee = monthlyBundleFee === undefined || monthlyBundleFee === null || monthlyBundleFee === '' ? 0 : Number(monthlyBundleFee);

    if (Number.isNaN(registrationFee) || registrationFee < 0 || Number.isNaN(sessionFee) || sessionFee < 0 || Number.isNaN(months) || Number.isNaN(bundleFee) || bundleFee < 0) {
      return jsonResponse(res, 400, { error: 'All fee values must be valid non-negative numbers' });
    }

    if ((months > 0 && bundleFee <= 0) || (months === 0 && bundleFee > 0)) {
      return jsonResponse(res, 400, { error: 'Bundle months and bundle amount must be set together' });
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return jsonResponse(res, 400, { error: 'dueDate must be a valid date' });
    }

    const config = await query('SELECT id FROM PaymentConfig WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1');
    if (config.length) {
      await run(
        'UPDATE PaymentConfig SET oneTimeRegistrationFee = ?, trainingSessionFee = ?, bundleMonths = ?, monthlyBundleFee = ?, dueDate = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [registrationFee, sessionFee, months, bundleFee, parsedDueDate.toISOString(), config[0].id]
      );
    } else {
      await run(
        'INSERT INTO PaymentConfig (oneTimeRegistrationFee, trainingSessionFee, bundleMonths, monthlyBundleFee, dueDate, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [registrationFee, sessionFee, months, bundleFee, parsedDueDate.toISOString()]
      );
    }

    jsonResponse(res, 200, { message: 'Global payment configuration updated successfully' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetPublicGallery(req, res) {
  try {
    const rows = await query('SELECT * FROM GalleryMedia WHERE isPublished = 1 ORDER BY createdAt DESC');
    jsonResponse(res, 200, { data: rows });
  } catch (err) {
    jsonResponse(res, 200, { data: [] });
  }
}

async function handleGetAdminGallery(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query('SELECT * FROM GalleryMedia ORDER BY createdAt DESC');
    jsonResponse(res, 200, { data: rows });
  } catch (err) {
    jsonResponse(res, 200, { data: [] });
  }
}

async function handleUploadGallery(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const body = await getRequestBody(req);
    const { title, caption, youtubeUrl, mediaUrl } = body;

    if (!title) {
      return jsonResponse(res, 400, { error: 'Media title is required' });
    }

    let mediaType, finalUrl, mimeType;

    if (youtubeUrl) {
      if (!/youtube\.com\/watch|youtu\.be\//.test(youtubeUrl)) {
        return jsonResponse(res, 400, { error: 'Invalid YouTube URL' });
      }
      mediaType = 'video';
      finalUrl = youtubeUrl;
      mimeType = 'youtube';
    } else if (mediaUrl) {
      // Cloudinary URL
      mediaType = mediaUrl.includes('video') ? 'video' : 'image';
      finalUrl = mediaUrl;
      mimeType = mediaType === 'video' ? 'video/cloudinary' : 'image/cloudinary';
    } else {
      return jsonResponse(res, 400, { error: 'Either YouTube URL or Cloudinary URL (mediaUrl) is required' });
    }

    await run(
      'INSERT INTO GalleryMedia (title, caption, mediaType, mediaUrl, mimeType, isPublished, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [title, caption || '', mediaType, finalUrl, mimeType]
    );

    jsonResponse(res, 200, { message: 'Media uploaded successfully' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleDeleteGallery(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const id = parseInt(req.url.split('/').pop());
  if (Number.isNaN(id)) {
    return jsonResponse(res, 400, { error: 'Gallery ID is required' });
  }

  try {
    await run('DELETE FROM GalleryMedia WHERE id = ?', [id]);
    jsonResponse(res, 200, { message: 'Gallery media deleted successfully' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetPublicSponsors(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const typeParam = url.searchParams.get('type');
    
    let rows;
    if (typeParam === 'sponsor' || typeParam === 'partner') {
      rows = await query('SELECT * FROM Sponsor WHERE isPublished = 1 AND type = ? ORDER BY createdAt DESC', [typeParam]);
    } else {
      rows = await query('SELECT * FROM Sponsor WHERE isPublished = 1 ORDER BY createdAt DESC');
    }

    jsonResponse(res, 200, rows);
  } catch (err) {
    jsonResponse(res, 200, []);
  }
}

async function handleGetAdminSponsors(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query('SELECT * FROM Sponsor ORDER BY createdAt DESC');
    jsonResponse(res, 200, rows);
  } catch (err) {
    jsonResponse(res, 200, []);
  }
}

async function handleCreateSponsor(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const { name, type, description, websiteUrl, logoUrl } = body;

  if (!name || (type !== 'sponsor' && type !== 'partner')) {
    return jsonResponse(res, 400, { error: 'Name and valid type (sponsor/partner) are required' });
  }

  if (!logoUrl) {
    return jsonResponse(res, 400, { error: 'Logo URL (from Cloudinary) is required' });
  }

  try {
    await run(
      'INSERT INTO Sponsor (name, type, description, websiteUrl, logoUrl, isPublished, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [name, type, description || '', websiteUrl || '', logoUrl]
    );

    jsonResponse(res, 200, { message: 'Sponsor/partner entry created' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleDeleteSponsor(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const id = parseInt(req.url.split('/').pop());
  if (Number.isNaN(id)) {
    return jsonResponse(res, 400, { error: 'Sponsor ID is required' });
  }

  try {
    await run('DELETE FROM Sponsor WHERE id = ?', [id]);
    jsonResponse(res, 200, { message: 'Sponsor deleted successfully' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetAdminUsers(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query('SELECT id, username, email, parentName, phone, isAdmin, isStaff, createdAt FROM User');
    jsonResponse(res, 200, { data: rows });
  } catch (err) {
    jsonResponse(res, 200, { data: [] });
  }
}

async function handleGetAdminRegistrations(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query(`
      SELECT r.*, u.parentName, u.email, u.phone, b.amountDue, b.registrationFee, b.trainingSessionFee, 
             b.bundleMonths, b.bundleFee, b.paymentMode, b.selectedAmount, b.paid, b.paymentConfirmedAt
      FROM Registration r
      LEFT JOIN User u ON r.userId = u.id
      LEFT JOIN BillingInfo b ON r.id = b.registrationId
      ORDER BY r.createdAt DESC
    `);
    jsonResponse(res, 200, { data: rows });
  } catch (err) {
    jsonResponse(res, 200, { data: [] });
  }
}

async function handleUpdateRegistration(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const registrationId = parseInt(req.url.split('/')[4]);
  const { playerName, age, gender, program, medical } = body;

  if (!playerName || age === undefined || !gender || !program) {
    return jsonResponse(res, 400, { error: 'playerName, age, gender, and program are required' });
  }

  const numericAge = Number(age);
  if (Number.isNaN(numericAge) || numericAge < 4 || numericAge > 15) {
    return jsonResponse(res, 400, { error: 'Age must be between 4 and 15' });
  }

  try {
    await run(
      'UPDATE Registration SET playerName = ?, age = ?, gender = ?, program = ?, medical = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [playerName, numericAge, gender, program, medical || '', registrationId]
    );

    jsonResponse(res, 200, { message: 'Player information updated' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleConfirmPayment(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const registrationId = parseInt(req.url.split('/')[4]);

  try {
    const registrations = await query('SELECT id FROM Registration WHERE id = ?', [registrationId]);
    if (!registrations.length) {
      return jsonResponse(res, 404, { error: 'Registration not found' });
    }

    const billings = await query('SELECT id, receiptUrl FROM BillingInfo WHERE registrationId = ?', [registrationId]);
    if (!billings.length || !billings[0].receiptUrl) {
      return jsonResponse(res, 400, { error: 'No receipt uploaded yet' });
    }

    await run(
      'UPDATE BillingInfo SET paid = 1, registrationFeeSettled = 1, paymentConfirmedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE registrationId = ?',
      [registrationId]
    );

    await run('UPDATE Registration SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['Paid', registrationId]);

    jsonResponse(res, 200, { message: 'Payment confirmed successfully' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleAssignBadges(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const registrationId = parseInt(req.url.split('/')[4]);
  const { badges } = body;

  if (!Array.isArray(badges)) {
    return jsonResponse(res, 400, { error: 'badges must be an array' });
  }

  const VALID_BADGE_KEYS = ['rising_star', 'top_scorer', 'most_improved', 'team_player', 'captain', 'speed_demon', 'iron_wall', 'discipline', 'match_ready', 'golden_boot'];
  const sanitized = badges.filter(k => VALID_BADGE_KEYS.includes(k));

  try {
    await run(
      'UPDATE Registration SET badges = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(sanitized), registrationId]
    );

    jsonResponse(res, 200, { message: 'Badges updated', data: { id: registrationId, badges: sanitized } });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleCreateStaff(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const { username, password, email, parentName, phone } = body;

  if (!username || !password || !email || !parentName) {
    return jsonResponse(res, 400, { error: 'username, password, email, and name are required' });
  }

  if (password.length < 6) {
    return jsonResponse(res, 400, { error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await query('SELECT id FROM User WHERE username = ? OR email = ?', [username, email]);
    if (existing.length) {
      return jsonResponse(res, 400, { error: 'Username or email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO User (username, password, email, parentName, phone, isStaff, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [username, hash, email, parentName, phone || '']
    );

    jsonResponse(res, 200, {
      message: 'Staff account created successfully',
      data: {
        id: result.lastID,
        username,
        email,
        parentName,
        phone: phone || null,
        isStaff: true,
      },
    });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleUpdateStaff(req, res, user) {
  if (!user.isAdmin) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const staffId = parseInt(req.url.split('/').pop());
  const { username, email, parentName, phone, password } = body;

  if (!username || !email || !parentName) {
    return jsonResponse(res, 400, { error: 'Username, email, and full name are required' });
  }

  if (password && password.length < 6) {
    return jsonResponse(res, 400, { error: 'Password must be at least 6 characters' });
  }

  try {
    const staffRows = await query('SELECT id, isStaff, isAdmin FROM User WHERE id = ?', [staffId]);
    if (!staffRows.length || !staffRows[0].isStaff || staffRows[0].isAdmin) {
      return jsonResponse(res, 404, { error: 'Staff account not found' });
    }

    const existing = await query('SELECT id FROM User WHERE id != ? AND (username = ? OR email = ?)', [staffId, username, email]);
    if (existing.length) {
      return jsonResponse(res, 400, { error: 'Username or email already exists' });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await run(
        'UPDATE User SET username = ?, email = ?, parentName = ?, phone = ?, password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [username, email, parentName, phone || '', hash, staffId]
      );
    } else {
      await run(
        'UPDATE User SET username = ?, email = ?, parentName = ?, phone = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [username, email, parentName, phone || '', staffId]
      );
    }

    jsonResponse(res, 200, { message: 'Staff account updated' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleGetStaffProfile(req, res, user) {
  if (!user.isStaff) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  try {
    const rows = await query('SELECT id, username, email, parentName, phone, address, isStaff, createdAt FROM User WHERE id = ?', [user.id]);
    if (!rows.length) {
      return jsonResponse(res, 404, { error: 'User not found' });
    }

    jsonResponse(res, 200, { data: rows[0] });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleUpdateStaffProfile(req, res, user) {
  if (!user.isStaff) {
    return jsonResponse(res, 403, { error: 'Forbidden' });
  }

  const body = await getRequestBody(req);
  const { parentName, phone, address } = body;

  try {
    await run(
      'UPDATE User SET parentName = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [parentName || '', phone || '', address || '', user.id]
    );

    jsonResponse(res, 200, { message: 'Staff profile updated' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleUpdateProfile(req, res, user) {
  const body = await getRequestBody(req);
  const { parentName, phone, address } = body;

  try {
    await run(
      'UPDATE User SET parentName = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [parentName || '', phone || '', address || '', user.id]
    );

    jsonResponse(res, 200, { message: 'Profile updated' });
  } catch (err) {
    jsonResponse(res, 400, { error: err.message });
  }
}

async function handleHello(req, res) {
  jsonResponse(res, 200, { message: 'Hello from the backend!' });
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  try {
    corsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Extract token early if present
    const authHeader = req.headers.authorization;
    const token = authHeader ? extractToken(authHeader) : null;
    const user = token ? verifyToken(token) : null;

    // PUBLIC ENDPOINTS
    if (pathname === '/api/login' && req.method === 'POST') return handleLogin(req, res);
    if (pathname === '/api/register' && req.method === 'POST') return handleRegister(req, res);
    if (pathname === '/api/staff/login' && req.method === 'POST') return handleStaffLogin(req, res);
    if (pathname === '/api/training-event' && req.method === 'GET') return handleGetTrainingEvent(req, res);
    if (pathname === '/api/gallery' && req.method === 'GET') return handleGetPublicGallery(req, res);
    if (pathname === '/api/sponsors' && req.method === 'GET') return handleGetPublicSponsors(req, res);
    if (pathname === '/api/payment-config' && req.method === 'GET') return handleGetPaymentConfig(req, res);
    if (pathname === '/api/forgot-password' && req.method === 'POST') return handleForgotPassword(req, res);
    if (pathname === '/api/reset-password' && req.method === 'POST') return handleResetPassword(req, res);
    if (pathname === '/api/hello' && req.method === 'GET') return handleHello(req, res);

    // AUTH CHECK FOR PROTECTED ENDPOINTS
    if (!user && (pathname.startsWith('/api/admin/') || pathname.startsWith('/api/staff/') || pathname.startsWith('/api/children') || pathname.startsWith('/api/billing') || pathname.startsWith('/api/profile') || pathname === '/api/change-password')) {
      return jsonResponse(res, 401, { error: 'Unauthorized' });
    }

    // USER ENDPOINTS (require auth)
    if (pathname === '/api/children' && req.method === 'POST') return handleAddChild(req, res, user);
    if (pathname.match(/^\/api\/children\/\d+$/) && req.method === 'PUT') return handleUpdateChild(req, res, user);
    if (pathname.match(/^\/api\/children\/\d+$/) && req.method === 'DELETE') return handleDeleteChild(req, res, user);
    if (pathname === '/api/billing' && req.method === 'GET') return handleGetBilling(req, res, user);
    if (pathname === '/api/billing/receipt' && req.method === 'POST') return handleUploadBillingReceipt(req, res, user);
    if (pathname === '/api/profile' && req.method === 'GET') return handleGetProfile(req, res, user);
    if (pathname === '/api/profile' && req.method === 'PUT') return handleUpdateProfile(req, res, user);
    if (pathname === '/api/change-password' && req.method === 'POST') return handleChangePassword(req, res, user);

    // STAFF ENDPOINTS
    if (pathname === '/api/staff/profile' && req.method === 'GET') return handleGetStaffProfile(req, res, user);
    if (pathname === '/api/staff/profile' && req.method === 'PUT') return handleUpdateStaffProfile(req, res, user);

    // ADMIN ENDPOINTS
    if (!user || !user.isAdmin) {
      if (pathname.startsWith('/api/admin/')) {
        return jsonResponse(res, 403, { error: 'Forbidden' });
      }
    }

    if (pathname === '/api/admin/training-event' && req.method === 'PUT') return handleUpdateTrainingEvent(req, res, user);
    if (pathname === '/api/admin/payment-config' && req.method === 'PUT') return handleUpdatePaymentConfig(req, res, user);
    if (pathname === '/api/admin/gallery' && req.method === 'GET') return handleGetAdminGallery(req, res, user);
    if (pathname === '/api/admin/gallery/upload' && req.method === 'POST') return handleUploadGallery(req, res, user);
    if (pathname.match(/^\/api\/admin\/gallery\/\d+$/) && req.method === 'DELETE') return handleDeleteGallery(req, res, user);
    if (pathname === '/api/admin/sponsors' && req.method === 'GET') return handleGetAdminSponsors(req, res, user);
    if (pathname === '/api/admin/sponsors' && req.method === 'POST') return handleCreateSponsor(req, res, user);
    if (pathname.match(/^\/api\/admin\/sponsors\/\d+$/) && req.method === 'DELETE') return handleDeleteSponsor(req, res, user);
    if (pathname === '/api/admin/users' && req.method === 'GET') return handleGetAdminUsers(req, res, user);
    if (pathname === '/api/admin/registrations' && req.method === 'GET') return handleGetAdminRegistrations(req, res, user);
    if (pathname.match(/^\/api\/admin\/registrations\/\d+$/) && req.method === 'PUT') return handleUpdateRegistration(req, res, user);
    if (pathname.match(/^\/api\/admin\/registrations\/\d+\/confirm-payment$/) && req.method === 'POST') return handleConfirmPayment(req, res, user);
    if (pathname.match(/^\/api\/admin\/registrations\/\d+\/badges$/) && req.method === 'PUT') return handleAssignBadges(req, res, user);
    if (pathname === '/api/admin/staff' && req.method === 'POST') return handleCreateStaff(req, res, user);
    if (pathname.match(/^\/api\/admin\/staff\/\d+$/) && req.method === 'PUT') return handleUpdateStaff(req, res, user);
    if (pathname === '/api/admin/change-password' && req.method === 'POST') return handleChangePassword(req, res, user);

    // 404
    jsonResponse(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('API error:', error);
    jsonResponse(res, 500, { error: 'Internal server error' });
  }
}

module.exports = handleRequest;
