const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const sequelize = require('./db');
const { User } = require('./models');

const DEFAULT_USER = {
  username: 'admin',
  email: 'admin@makkayleeFA.ng',
  password: 'oladeji',
  parentName: 'System Admin',
  phone: '+2340000000000',
  address: 'Ibadan',
  isAdmin: true,
};

async function createDefaultUser() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const hash = await bcrypt.hash(DEFAULT_USER.password, 10);

    const existing = await User.findOne({
      where: { username: DEFAULT_USER.username },
    });

    if (existing) {
      await existing.update({
        email: DEFAULT_USER.email,
        password: hash,
        parentName: DEFAULT_USER.parentName,
        phone: DEFAULT_USER.phone,
        address: DEFAULT_USER.address,
        isAdmin: DEFAULT_USER.isAdmin,
      });
      console.log('Default admin user updated.');
    } else {
      await User.create({
        username: DEFAULT_USER.username,
        email: DEFAULT_USER.email,
        password: hash,
        parentName: DEFAULT_USER.parentName,
        phone: DEFAULT_USER.phone,
        address: DEFAULT_USER.address,
        isAdmin: DEFAULT_USER.isAdmin,
      });
      console.log('Default admin user created.');
    }

    console.log('Login credentials:');
    console.log(`username: ${DEFAULT_USER.username}`);
    console.log(`password: ${DEFAULT_USER.password}`);
  } catch (err) {
    console.error('Failed to create default user:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

createDefaultUser();