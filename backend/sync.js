const sequelize = require('./db');
const { User, BillingInfo } = require('./models');

async function syncDb() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database synced!');
  } catch (err) {
    console.error('DB sync error:', err);
  } finally {
    await sequelize.close();
  }
}

syncDb();
