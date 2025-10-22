const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createCorrectAdmin() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Use the correct credentials from memory
    const email = 'admin@maisondarin.com';
    const password = 'Admin123456#';

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
        isActive: true,
        firstName: 'Admin',
        lastName: 'User'
      });
      console.log('✅ Admin user created successfully!');
      console.log('ID:', adminUser._id);
    }
    
    console.log(`\n📧 Email: ${email}`);
    console.log('🔒 Password: Admin123456#');
    console.log('\n✅ Admin credentials are now correct and match the frontend!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate email address detected.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createCorrectAdmin();
