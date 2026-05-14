const { DataTypes } = require('sequelize');
const sequelize = require('./db');

// User model (parent account)
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  parentName: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  resetToken: { type: DataTypes.STRING, defaultValue: null },
  resetTokenExpiry: { type: DataTypes.DATE, defaultValue: null },
});

// Registration/child info model
const Registration = sequelize.define('Registration', {
  playerName: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },
  gender: { type: DataTypes.STRING },
  program: { type: DataTypes.STRING },
  medical: { type: DataTypes.STRING },
  consent: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.STRING, defaultValue: 'Pending Payment' },
});

// BillingInfo model
const BillingInfo = sequelize.define('BillingInfo', {
  amountDue: { type: DataTypes.FLOAT, allowNull: false },
  registrationFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 40000 },
  trainingSessionFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 30000 },
  bundleFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  paid: { type: DataTypes.BOOLEAN, defaultValue: false },
  receiptUrl: { type: DataTypes.STRING, defaultValue: null },
  receiptMimeType: { type: DataTypes.STRING, defaultValue: null },
  receiptUploadedAt: { type: DataTypes.DATE, defaultValue: null },
  paymentConfirmedAt: { type: DataTypes.DATE, defaultValue: null },
});

// Admin-managed training event notification
const TrainingEvent = sequelize.define('TrainingEvent', {
  title: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Next Training Session' },
  dateLabel: { type: DataTypes.STRING, allowNull: false, defaultValue: 'April 4, 2026' },
  venue: { type: DataTypes.STRING, allowNull: false, defaultValue: 'International School Ibadan, University of Ibadan' },
  note: { type: DataTypes.STRING, defaultValue: 'Open to all new registrants' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// Admin-uploaded gallery media
const GalleryMedia = sequelize.define('GalleryMedia', {
  title: { type: DataTypes.STRING, allowNull: false },
  caption: { type: DataTypes.STRING, defaultValue: '' },
  mediaType: { type: DataTypes.ENUM('image', 'video'), allowNull: false },
  mediaUrl: { type: DataTypes.STRING, allowNull: false },
  mimeType: { type: DataTypes.STRING, defaultValue: '' },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// Global payment configuration (applies to all unpaid records)
const PaymentConfig = sequelize.define('PaymentConfig', {
  oneTimeRegistrationFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 40000 },
  trainingSessionFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 30000 },
  monthlyBundleFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  dueDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// Associations
User.hasMany(Registration, { foreignKey: 'userId' });
Registration.belongsTo(User, { foreignKey: 'userId' });
Registration.hasOne(BillingInfo, { foreignKey: 'registrationId' });
BillingInfo.belongsTo(Registration, { foreignKey: 'registrationId' });

module.exports = { User, Registration, BillingInfo, TrainingEvent, GalleryMedia, PaymentConfig };
