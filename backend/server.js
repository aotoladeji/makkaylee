// Basic Express server for MakkayLee
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
const { User, Registration, BillingInfo, TrainingEvent, GalleryMedia } = require('./models');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';

// Force sync models to DB (add missing columns)
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synchronized');
});

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
  max: 5, // Stricter limit for login attempts
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
    const hash = await bcrypt.hash(password, 10);
    // Create parent user
    const user = await User.create({ username, password: hash, email, parentName, phone, address });
    // Create registration (child info)
    const registration = await Registration.create({
      playerName, age, gender, program, medical, consent, userId: user.id
    });
    // Create billing info for this registration
    await BillingInfo.create({
      registrationId: registration.id,
      amountDue: 0,
      dueDate: new Date(),
      paid: false
    });
    res.json({ message: 'Registration successful' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, SECRET, { expiresIn: JWT_EXPIRE });
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

// Get billing info (user)
app.get('/api/billing', auth, async (req, res) => {
  try {
    // Find the user's registration and billing info
    const registration = await Registration.findOne({ where: { userId: req.user.id } });
    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    const billing = await BillingInfo.findOne({ where: { registrationId: registration.id } });
    res.json(billing);
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
    // Get registration and billing
    const registration = await Registration.findOne({ where: { userId: user.id } });
    let billing = null;
    if (registration) {
      billing = await BillingInfo.findOne({ where: { registrationId: registration.id } });
    }
    res.json({
      user: {
        parentName: user.parentName,
        phone: user.phone,
        email: user.email,
        address: user.address,
      },
      registration,
      billing,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Admin: get all registrations
app.get('/api/admin/registrations', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  try {
    const registrations = await Registration.findAll({
      include: { model: User, attributes: ['parentName', 'email', 'phone'] }
    });
    res.json({ data: registrations });
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
    const { title, caption } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Media file is required' });
    if (!title) return res.status(400).json({ error: 'Media title is