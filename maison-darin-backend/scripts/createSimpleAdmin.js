const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createSimpleAdmin() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    const email = 'admin@maisondarin.com';
    const password = 'admin123';

    // Check if admin user already exists
    const existingAdmin = await User.findByEmailWithPassword(email);
    
    if (existingAdmin) {
      console.log(`\nℹ️  Admin user with email ${email} already exists! Updating password...`);
      existingAdmin.password = password;
      existingAdmin.isActive = true;
      existingAdmin.loginAttempts = 0;
      existingAdmin.lockUntil = undefined;
      existingAdmin.passwordChangedAt = new Date();
      await existingAdmin.save();
      console.log('✅ Admin user password updated successfully!');
    } else {
      const adminUser = await User.create({
        email,
        password,
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin user created successfully!');
      console.log('ID:', adminUser._id);
    }
    
    console.log(`\n📧 Email: ${email}`);
    console.log('🔒 Password: admin123');
    console.log('\n⚠️  Note: This is a simple password for development only!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createSimpleAdmin();
