const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: '../.env' });

const users = [
  {
    name: 'JPM Admin',
    email: 'admin@jpm.com',
    password: 'Admin123',
    role: 'admin',
  },
  {
    name: 'John Analyst',
    email: 'analyst@jpm.com',
    password: 'Fraud123',
    role: 'analyst',
  },
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/fraudDetectionDB');
    console.log('MongoDB Connected...');

    // Delete existing users
    await User.deleteMany({});
    console.log('Existing users cleared...');

    // Create new users
    for (const userData of users) {
      const user = new User(userData);
      await user.save(); // this triggers password hashing
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log('----------------------------');
    console.log('Seed completed successfully!');
    console.log('Admin:   admin@jpm.com / Admin123');
    console.log('Analyst: analyst@jpm.com / Fraud123');
    console.log('----------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedUsers();