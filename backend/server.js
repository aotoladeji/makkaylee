// Basic Express server for MakkayLee
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const sequelize = require('./db');
const { Op } = require('sequelize');
const { User, Registration, BillingInfo, TrainingEvent, GalleryMedia, PaymentConfig, Sponsor } = require('./models');

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';

// Keep schema sync opt-in for deployment safety.
if (process.env.DB_SYNC === 'true') {
  sequelize.sync({ alter: true }).then(() => {
    console.log('Database synchronized');
  });
}

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image and video files are allowed'));
  },
});

const receiptUpload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    if (allowed) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image or PDF receipt files are allowed'));
  },
});

const passportUpload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image files are allowed for passport photos'));
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Stricter limit for login attempts
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/login', loginLimiter);
app.use('/api/register', loginLimiter);


// Register (parent + child info)
app.post('/api/register', async (req, res) => {
  try {
    const {
      username, password, email, parentName, phone, address,
      playerName, age, gender, program, medical, consent
    } = req.body;
    const existingUser = await User.findOne({ where: { username: { [Op.iLike]: username } } });
    if (existingUser) return res.status(400).json({ error: 'Username is already taken' });
    const hash = await bcrypt.hash(password, 10);
    // Create parent user
    const user = await User.create({ username, password: hash, email, parentName, phone, address });
    // Create registration (child info)
    const registration = await Registration.create({
      playerName, age, gender, program, medical, consent, userId: user.id
    });
    const paymentConfig = await getOrCreatePaymentConfig();
    const paymentMode = 'one_time';
    const totalAmountDue = computeAmountByMode(
      paymentConfig.oneTimeRegistrationFee,
      paymentConfig.trainingSessionFee,
      paymentConfig.monthlyBundleFee,
      paymentMode,
      true,
    );

    // Create billing info for this registration
    await BillingInfo.create({
      registrationId: registration.id,
      amountDue: totalAmountDue,
      registrationFee: paymentConfig.oneTimeRegistrationFee,
      registrationFeeSettled: false,
      trainingSessionFee: paymentConfig.trainingSessionFee,
      bundleMonths: paymentConfig.bundleMonths,
      bundleFee: paymentConfig.monthlyBundleFee,
      paymentMode,
      selectedAmount: totalAmountDue,
      dueDate: paymentConfig.dueDate,
      paid: false
    });
    res.json({ message: 'Registration successful' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add another child registration under an existing parent account
app.post('/api/children', auth, async (req, res) => {
  try {
    const {
      playerName, age, gender, program, medical, consent,
    } = req.body;

    if (!playerName || age === undefined || !gender || !program || consent !== true) {
      return res.status(400).json({ error: 'playerName, age, gender, program, and consent are required' });
    }

    const parent = await User.findByPk(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent account not found' });

    const paymentConfig = await getOrCreatePaymentConfig();
    const paymentMode = 'one_time';
    const totalAmountDue = computeAmountByMode(
      paymentConfig.oneTimeRegistrationFee,
      paymentConfig.trainingSessionFee,
      paymentConfig.monthlyBundleFee,
      paymentMode,
      true,
    );

    const registration = await Registration.create({
      playerName,
      age,
      gender,
      program,
      medical,
      consent,
      userId: parent.id,
    });

    await BillingInfo.create({
      registrationId: registration.id,
      amountDue: totalAmountDue,
      registrationFee: paymentConfig.oneTimeRegistrationFee,
      registrationFeeSettled: false,
      trainingSessionFee: paymentConfig.trainingSessionFee,
      bundleMonths: paymentConfig.bundleMonths,
      bundleFee: paymentConfig.monthlyBundleFee,
      paymentMode,
      selectedAmount: totalAmountDue,
      dueDate: paymentConfig.dueDate,
      paid: false,
    });

    res.json({
      message: 'Child registration added successfully',
      data: { registrationId: registration.id },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username: { [Op.iLike]: username } } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin, isStaff: user.isStaff }, SECRET, { expiresIn: JWT_EXPIRE });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Staff login (staff-only)
app.post('/api/staff/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username: { [Op.iLike]: username } } });
    if (!user || !user.isStaff) return res.status(401).json({ error: 'Invalid staff credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid staff credentials' });

    const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin, isStaff: user.isStaff }, SECRET, { expiresIn: JWT_EXPIRE });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Middleware to verify JWT
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function getOrCreateActiveEvent() {
  const event = await TrainingEvent.findOne({ where: { isActive: true }, order: [['updatedAt', 'DESC']] });

  if (event) return event;

  return TrainingEvent.create({
    title: 'Next Training Session',
    dateLabel: 'April 4, 2026',
    venue: 'International School Ibadan, University of Ibadan',
    note: 'Open to all new registrants',
    isActive: true,
  });
}

async function getOrCreatePaymentConfig() {
  const config = await PaymentConfig.findOne({ where: { isActive: true }, order: [['updatedAt', 'DESC']] });

  if (config) return config;

  return PaymentConfig.create({
    oneTimeRegistrationFee: 40000,
    trainingSessionFee: 30000,
    bundleMonths: 0,
    monthlyBundleFee: 0,
    dueDate: new Date(),
    isActive: true,
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

// Public: current training event notification
app.get('/api/training-event', async (req, res) => {
  try {
    const event = await getOrCreateActiveEvent();
    res.json({
      data: {
        id: event.id,
        title: event.title,
        dateLabel: event.dateLabel,
        venue: event.venue,
        note: event.note,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Public: published gallery media
app.get('/api/gallery', async (req, res) => {
  try {
    const items = await GalleryMedia.findAll({
      where: { isPublished: true },
      order: [['createdAt', 'DESC']],
    });

    res.json({ data: items });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Public: current global payment configuration
app.get('/api/payment-config', async (req, res) => {
  try {
    const config = await getOrCreatePaymentConfig();
    const oneTimeTotal = computeAmountByMode(config.oneTimeRegistrationFee, config.trainingSessionFee, config.monthlyBundleFee, 'one_time', true);
    const bundleTotal = computeAmountByMode(config.oneTimeRegistrationFee, config.trainingSessionFee, config.monthlyBundleFee, 'bundle', true);
    const recurringOneTimeTotal = computeAmountByMode(config.oneTimeRegistrationFee, config.trainingSessionFee, config.monthlyBundleFee, 'one_time', false);
    const recurringBundleTotal = computeAmountByMode(config.oneTimeRegistrationFee, config.trainingSessionFee, config.monthlyBundleFee, 'bundle', false);
    const hasBundleOption = Number(config.monthlyBundleFee || 0) > 0;
    res.json({
      data: {
        ...config.toJSON(),
        oneTimeTotal,
        bundleTotal,
        recurringOneTimeTotal,
        recurringBundleTotal,
        hasBundleOption,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get billing info (user)
app.get('/api/billing', auth, async (req, res) => {
  try {
    const requestedRegistrationId = Number(req.query.registrationId);
    const registrations = await Registration.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    if (!registrations.length) return res.status(404).json({ error: 'Registration not found' });

    const selectedRegistration = Number.isNaN(requestedRegistrationId)
      ? registrations[0]
      : registrations.find((registration) => registration.id === requestedRegistrationId);

    if (!selectedRegistration) {
      return res.status(404).json({ error: 'Requested child registration not found' });
    }

    const billing = await BillingInfo.findOne({ where: { registrationId: selectedRegistration.id } });
    res.json({
      ...billing.toJSON(),
      registrationId: selectedRegistration.id,
      playerName: selectedRegistration.playerName,
      children: registrations.map((registration) => ({
        id: registration.id,
        playerName: registration.playerName,
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User: upload payment receipt
app.post('/api/billing/receipt', auth, receiptUpload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Receipt file is required' });
    const paymentMode = req.body.paymentMode || 'one_time';
    if (!['one_time', 'bundle'].includes(paymentMode)) {
      return res.status(400).json({ error: 'paymentMode must be one_time or bundle' });
    }

    const requestedRegistrationId = Number(req.body.registrationId);
    const registrationWhere = { userId: req.user.id };
    if (!Number.isNaN(requestedRegistrationId)) {
      registrationWhere.id = requestedRegistrationId;
    }

    const registration = await Registration.findOne({ where: registrationWhere, order: [['createdAt', 'DESC']] });
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    const billing = await BillingInfo.findOne({ where: { registrationId: registration.id } });
    if (!billing) return res.status(404).json({ error: 'Billing record not found' });

    if (paymentMode === 'bundle') {
      const hasBundle = Number(billing.bundleFee || 0) > 0;
      if (!hasBundle) {
        return res.status(400).json({ error: 'Bundle payment is not configured at the moment' });
      }
    }

    if (billing.receiptUrl) {
      const oldPath = path.join(__dirname, billing.receiptUrl.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const selectedAmount = computeAmountByMode(
      billing.registrationFee,
      billing.trainingSessionFee,
      billing.bundleFee,
      paymentMode,
      !billing.registrationFeeSettled,
    );

    await billing.update({
      receiptUrl: `/uploads/${req.file.filename}`,
      receiptMimeType: req.file.mimetype,
      receiptUploadedAt: new Date(),
      paymentMode,
      selectedAmount,
      amountDue: selectedAmount,
      paymentConfirmedAt: null,
      paid: false,
    });

    if (registration.status !== 'Receipt Submitted') {
      await registration.update({ status: 'Receipt Submitted' });
    }

    res.json({
      message: 'Receipt uploaded successfully',
      data: {
        ...billing.toJSON(),
        registrationId: registration.id,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Profile endpoint for dashboard
app.get('/api/profile', auth, async (req, res) => {
  try {
    // Get parent info
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const requestedRegistrationId = Number(req.query.registrationId);
    const registrations = await Registration.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
    });

    const selectedRegistration = Number.isNaN(requestedRegistrationId)
      ? registrations[0] || null
      : registrations.find((registrationItem) => registrationItem.id === requestedRegistrationId) || null;

    let billing = null;
    if (selectedRegistration) {
      billing = await BillingInfo.findOne({ where: { registrationId: selectedRegistration.id } });
    }

    const childrenWithBilling = await Promise.all(registrations.map(async (registrationItem) => {
      const childBilling = await BillingInfo.findOne({ where: { registrationId: registrationItem.id } });
      return {
        id: registrationItem.id,
        playerName: registrationItem.playerName,
        age: registrationItem.age,
        gender: registrationItem.gender,
        program: registrationItem.program,
        medical: registrationItem.medical,
        status: registrationItem.status,
        badges: registrationItem.badges || [],
        createdAt: registrationItem.createdAt,
        billing: childBilling
          ? {
            amountDue: childBilling.amountDue,
            dueDate: childBilling.dueDate,
            paid: childBilling.paid,
            paymentMode: childBilling.paymentMode,
            selectedAmount: childBilling.selectedAmount,
            receiptUploadedAt: childBilling.receiptUploadedAt,
            paymentConfirmedAt: childBilling.paymentConfirmedAt,
          }
          : null,
      };
    }));

    const children = childrenWithBilling.map((registrationItem) => ({
      id: registrationItem.id,
      playerName: registrationItem.playerName,
      age: registrationItem.age,
      gender: registrationItem.gender,
      program: registrationItem.program,
      medical: registrationItem.medical,
      status: registrationItem.status,
      badges: registrationItem.badges || [],
      createdAt: registrationItem.createdAt,
      billing: registrationItem.billing,
    }));

    res.json({
      user: {
        parentName: user.parentName,
        phone: user.phone,
        email: user.email,
        address: user.address,
      },
      registration: selectedRegistration,
      billing,
      children,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Parent: update a specific child profile
app.put('/api/children/:id', auth, async (req, res) => {
  try {
    const registrationId = Number(req.params.id);
    if (Number.isNaN(registrationId)) return res.status(400).json({ error: 'Invalid child id' });

    const registration = await Registration.findOne({
      where: {
        id: registrationId,
        userId: req.user.id,
      },
    });

    if (!registration) return res.status(404).json({ error: 'Child registration not found' });

    const {
      playerName,
      age,
      gender,
      program,
      medical,
    } = req.body;

    if (!playerName || age === undefined || !gender || !program) {
      return res.status(400).json({ error: 'playerName, age, gender, and program are required' });
    }

    const numericAge = Number(age);
    if (Number.isNaN(numericAge) || numericAge < 4 || numericAge > 15) {
      return res.status(400).json({ error: 'Age must be between 4 and 15' });
    }

    await registration.update({
      playerName,
      age: numericAge,
      gender,
      program,
      medical: medical || '',
    });

    res.json({ message: 'Child profile updated successfully', data: registration });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Parent: remove a child profile and its billing record
app.delete('/api/children/:id', auth, async (req, res) => {
  try {
    const registrationId = Number(req.params.id);
    if (Number.isNaN(registrationId)) return res.status(400).json({ error: 'Invalid child id' });

    const registrations = await Registration.findAll({ where: { userId: req.user.id } });
    if (registrations.length <= 1) {
      return res.status(400).json({ error: 'At least one child profile must remain on this account' });
    }

    const registration = registrations.find((item) => item.id === registrationId);
    if (!registration) return res.status(404).json({ error: 'Child registration not found' });

    const billing = await BillingInfo.findOne({ where: { registrationId: registration.id } });

    if (billing?.receiptUrl) {
      const receiptPath = path.join(__dirname, billing.receiptUrl.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(receiptPath)) fs.unlinkSync(receiptPath);
    }

    if (billing) {
      await billing.destroy();
    }

    await registration.destroy();

    res.json({ message: 'Child profile deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: get all registrations
app.get('/api/admin/registrations', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  try {
    const registrations = await Registration.findAll({
      include: [
        { model: User, attributes: ['parentName', 'email', 'phone'] },
        { model: BillingInfo, attributes: ['id', 'amountDue', 'registrationFee', 'registrationFeeSettled', 'trainingSessionFee', 'bundleMonths', 'bundleFee', 'paymentMode', 'selectedAmount', 'dueDate', 'paid', 'receiptUrl', 'receiptMimeType', 'receiptUploadedAt', 'paymentConfirmedAt'] },
      ],
    });
    res.json({ data: registrations });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update a player's registration details
app.put('/api/admin/registrations/:id', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    const { playerName, age, gender, program, medical } = req.body;
    const numericAge = Number(age);
    if (!playerName?.trim() || Number.isNaN(numericAge) || numericAge < 4 || numericAge > 15 || !gender || !program) {
      return res.status(400).json({ error: 'Player name, age (4-15), gender, and program are required' });
    }

    await registration.update({
      playerName: playerName.trim(),
      age: numericAge,
      gender,
      program,
      medical: medical || '',
    });

    res.json({ message: 'Player information updated', data: registration });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: upload or replace a player's passport photograph
app.post('/api/admin/registrations/:id/passport', auth, passportUpload.single('passport'), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    if (!req.file) return res.status(400).json({ error: 'Passport image is required' });

    const registration = await Registration.findByPk(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    if (registration.passportUrl) {
      const oldPath = path.join(__dirname, registration.passportUrl.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const passportUrl = `/uploads/${req.file.filename}`;
    await registration.update({ passportUrl });
    res.json({ message: 'Passport photo uploaded', data: { id: registration.id, passportUrl } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: upload or replace a payment receipt for a player
app.post('/api/admin/registrations/:id/receipt', auth, receiptUpload.single('receipt'), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    if (!req.file) return res.status(400).json({ error: 'Receipt file is required' });

    const registration = await Registration.findByPk(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    const billing = await BillingInfo.findOne({ where: { registrationId: registration.id } });
    if (!billing) return res.status(404).json({ error: 'Billing record not found' });

    if (billing.receiptUrl) {
      const oldPath = path.join(__dirname, billing.receiptUrl.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const receiptUrl = `/uploads/${req.file.filename}`;
    await billing.update({
      receiptUrl,
      receiptMimeType: req.file.mimetype,
      receiptUploadedAt: new Date(),
      paid: false,
      paymentConfirmedAt: null,
    });
    await registration.update({ status: 'Receipt Submitted' });

    res.json({
      message: 'Payment receipt uploaded',
      data: {
        registrationId: registration.id,
        receiptUrl,
        receiptMimeType: req.file.mimetype,
        receiptUploadedAt: billing.receiptUploadedAt,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: adjust global payment amount and due date
app.put('/api/admin/payment-config', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { oneTimeRegistrationFee, trainingSessionFee, bundleMonths, monthlyBundleFee, dueDate } = req.body;

    if (oneTimeRegistrationFee === undefined || trainingSessionFee === undefined || dueDate === undefined) {
      return res.status(400).json({ error: 'oneTimeRegistrationFee, trainingSessionFee, and dueDate are required' });
    }

    const registrationFee = Number(oneTimeRegistrationFee);
    const sessionFee = Number(trainingSessionFee);
    const months = bundleMonths === undefined || bundleMonths === null || bundleMonths === ''
      ? 0
      : Number(bundleMonths);
    const bundleFee = monthlyBundleFee === undefined || monthlyBundleFee === null || monthlyBundleFee === ''
      ? 0
      : Number(monthlyBundleFee);
    if (Number.isNaN(registrationFee) || registrationFee < 0 || Number.isNaN(sessionFee) || sessionFee < 0 || Number.isNaN(months) || months < 0 || !Number.isInteger(months) || Number.isNaN(bundleFee) || bundleFee < 0) {
      return res.status(400).json({ error: 'All fee values must be valid non-negative numbers, and bundleMonths must be an integer' });
    }

    if ((months > 0 && bundleFee <= 0) || (months === 0 && bundleFee > 0)) {
      return res.status(400).json({ error: 'Bundle months and bundle amount must be set together' });
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ error: 'dueDate must be a valid date' });
    }

    const oneTimeTotal = computeAmountByMode(registrationFee, sessionFee, bundleFee, 'one_time', true);
    const bundleTotal = computeAmountByMode(registrationFee, sessionFee, bundleFee, 'bundle', true);
    const recurringOneTimeTotal = computeAmountByMode(registrationFee, sessionFee, bundleFee, 'one_time', false);
    const recurringBundleTotal = computeAmountByMode(registrationFee, sessionFee, bundleFee, 'bundle', false);

    const config = await getOrCreatePaymentConfig();
    await config.update({
      oneTimeRegistrationFee: registrationFee,
      trainingSessionFee: sessionFee,
      bundleMonths: months,
      monthlyBundleFee: bundleFee,
      dueDate: parsedDueDate,
    });

    const unpaidBillings = await BillingInfo.findAll({ where: { paid: false } });
    for (const billing of unpaidBillings) {
      const updatedAmount = computeAmountByMode(
        registrationFee,
        sessionFee,
        bundleFee,
        billing.paymentMode || 'one_time',
        !billing.registrationFeeSettled,
      );
      await billing.update({
        amountDue: updatedAmount,
        selectedAmount: updatedAmount,
        registrationFee,
        trainingSessionFee: sessionFee,
        bundleMonths: months,
        bundleFee,
        dueDate: parsedDueDate,
      });
    }

    res.json({
      message: 'Global payment configuration updated successfully',
      data: {
        ...config.toJSON(),
        oneTimeTotal,
        bundleTotal,
        recurringOneTimeTotal,
        recurringBundleTotal,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: confirm payment received for a registration
app.post('/api/admin/registrations/:id/confirm-payment', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    const billing = await BillingInfo.findOne({ where: { registrationId: registration.id } });
    if (!billing) return res.status(404).json({ error: 'Billing record not found' });
    if (!billing.receiptUrl) return res.status(400).json({ error: 'No receipt uploaded yet' });

    await billing.update({
      paid: true,
      registrationFeeSettled: true,
      paymentConfirmedAt: new Date(),
    });

    await registration.update({ status: 'Paid' });

    res.json({ message: 'Payment confirmed successfully', data: { registrationId: registration.id } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: assign performance badges to a registration
const VALID_BADGE_KEYS = [
  'rising_star', 'top_scorer', 'most_improved', 'team_player',
  'captain', 'speed_demon', 'iron_wall', 'discipline', 'match_ready', 'golden_boot',
];

app.put('/api/admin/registrations/:id/badges', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    const { badges } = req.body;
    if (!Array.isArray(badges)) return res.status(400).json({ error: 'badges must be an array' });

    const sanitized = badges.filter((k) => VALID_BADGE_KEYS.includes(k));
    await registration.update({ badges: sanitized });

    res.json({ message: 'Badges updated', data: { id: registration.id, badges: sanitized } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: get all users
app.get('/api/admin/users', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }
    });
    res.json({ data: users });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: create a staff account
app.post('/api/admin/staff', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { username, password, email, parentName, phone } = req.body;

    if (!username || !password || !email || !parentName) {
      return res.status(400).json({ error: 'username, password, email, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hash,
      email,
      parentName,
      phone: phone || null,
      isStaff: true,
      isAdmin: false,
    });

    res.json({
      message: 'Staff account created successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        parentName: user.parentName,
        phone: user.phone,
        isStaff: user.isStaff,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: edit an existing staff account
app.put('/api/admin/staff/:id', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const staff = await User.findByPk(req.params.id);
    if (!staff || !staff.isStaff || staff.isAdmin) return res.status(404).json({ error: 'Staff account not found' });

    const { username, email, parentName, phone, password } = req.body;
    if (!username?.trim() || !email?.trim() || !parentName?.trim()) {
      return res.status(400).json({ error: 'Username, email, and full name are required' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({
      where: {
        id: { [Op.ne]: staff.id },
        [Op.or]: [
          { username: { [Op.iLike]: username.trim() } },
          { email: { [Op.iLike]: email.trim() } },
        ],
      },
    });
    if (existing) return res.status(400).json({ error: 'Username or email already exists' });

    const updates = {
      username: username.trim(),
      email: email.trim(),
      parentName: parentName.trim(),
      phone: phone?.trim() || null,
    };
    if (password) updates.password = await bcrypt.hash(password, 10);

    await staff.update(updates);
    res.json({
      message: 'Staff account updated',
      data: {
        id: staff.id,
        username: staff.username,
        email: staff.email,
        parentName: staff.parentName,
        phone: staff.phone,
        isStaff: staff.isStaff,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: update training event notification
app.put('/api/admin/training-event', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { title, dateLabel, venue, note } = req.body;

    if (!title || !dateLabel || !venue) {
      return res.status(400).json({ error: 'Title, date label, and venue are required' });
    }

    const event = await getOrCreateActiveEvent();
    await event.update({ title, dateLabel, venue, note: note || '' });

    res.json({
      message: 'Training event updated successfully',
      data: event,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: list all gallery media items
app.get('/api/admin/gallery', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const items = await GalleryMedia.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ data: items });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: upload media for gallery
app.post('/api/admin/gallery/upload', auth, upload.single('media'), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { title, caption, youtubeUrl } = req.body;

    if (!title) return res.status(400).json({ error: 'Media title is required' });
    if (!req.file && !youtubeUrl) return res.status(400).json({ error: 'Media file or YouTube URL is required' });

    let mediaType, mediaUrl, mimeType;

    if (youtubeUrl) {
      if (!/youtube\.com\/watch|youtu\.be\//.test(youtubeUrl)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }
      mediaType = 'video';
      mediaUrl = youtubeUrl;
      mimeType = 'youtube';
    } else {
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      mediaUrl = `/uploads/${req.file.filename}`;
      mimeType = req.file.mimetype;
    }

    const created = await GalleryMedia.create({
      title,
      caption: caption || '',
      mediaType,
      mediaUrl,
      mimeType,
      isPublished: true,
    });

    res.json({ message: 'Media uploaded successfully', data: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete gallery media item
app.delete('/api/admin/gallery/:id', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const item = await GalleryMedia.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Media item not found' });

    if (item.mimeType !== 'youtube') {
      const absolutePath = path.join(__dirname, item.mediaUrl.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await item.destroy();
    res.json({ message: 'Media deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Change own password (all authenticated users)
app.post('/api/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hash, resetToken: null, resetTokenExpiry: null });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin-compatible alias for change-password
app.post('/api/admin/change-password', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hash, resetToken: null, resetTokenExpiry: null });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    await user.update({ resetToken, resetTokenExpiry });

    // TODO: Send email with reset link (use SendGrid or similar)
    // For now, just log it
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log(`Password reset link: ${resetUrl}`);
    
    res.json({ message: 'Password reset link sent (check console in dev mode)' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = await bcrypt.hash(password, 10);
    await user.update({ password: hash, resetToken: null, resetTokenExpiry: null });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Staff profile
app.get('/api/staff/profile', auth, async (req, res) => {
  if (!req.user.isStaff) return res.status(403).json({ error: 'Forbidden' });

  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'parentName', 'phone', 'address', 'isStaff', 'createdAt'],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ data: user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/staff/profile', auth, async (req, res) => {
  if (!req.user.isStaff) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { parentName, phone, address } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update({ parentName, phone, address });
    res.json({
      message: 'Staff profile updated',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        parentName: user.parentName,
        phone: user.phone,
        address: user.address,
        isStaff: user.isStaff,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update profile
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { parentName, phone, address } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update({ parentName, phone, address });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sample API route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// ─── Sponsors / Partners ────────────────────────────────────────────────────

const logoUpload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed for logos'));
  },
});

// Public: list published sponsors or partners
app.get('/api/sponsors', async (req, res) => {
  try {
    const { type } = req.query; // 'sponsor' | 'partner' | undefined (all)
    const where = { isPublished: true };
    if (type === 'sponsor' || type === 'partner') where.type = type;
    const items = await Sponsor.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: add sponsor / partner (with logo upload)
app.post('/api/admin/sponsors', auth, logoUpload.single('logo'), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  try {
    const { name, type, description, websiteUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (type !== 'sponsor' && type !== 'partner') return res.status(400).json({ error: 'Type must be sponsor or partner' });
    if (!req.file) return res.status(400).json({ error: 'Logo image is required' });

    const logoUrl = `/uploads/${req.file.filename}`;
    const entry = await Sponsor.create({ name, type, description: description || '', websiteUrl: websiteUrl || '', logoUrl, isPublished: true });
    res.json({ message: 'Entry created', data: entry });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: list all sponsors / partners (including unpublished)
app.get('/api/admin/sponsors', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  try {
    const items = await Sponsor.findAll({ order: [['createdAt', 'DESC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete sponsor / partner
app.delete('/api/admin/sponsors/:id', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  try {
    const item = await Sponsor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Entry not found' });

    const absPath = path.join(__dirname, item.logoUrl.replace('/uploads/', 'uploads/'));
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);

    await item.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
