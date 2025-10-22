const mongoose = require('mongoose');
const User = require('../models/User');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    stdin.on('data', function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    });
  });
}

async function createAdminUser() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    console.log('\n=== Maison Darin Admin User Creation ===\n');

    // Get admin details
    const email = await askQuestion('Enter admin email (default: admin@maisondarin.com): ') || 'admin@maisondarin.com';
    
    // Check if admin user already exists
    const existingAdmin = await User.findByEmailWithPassword(email);
    
    if (existingAdmin) {
      console.log(`\nℹ️  Admin user with email ${email} already exists!`);
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Active:', existingAdmin.isActive);
      console.log('Created:', existingAdmin.createdAt);
      
      const overwrite = await askQuestion('\nDo you want to update the password? (y/N): ');
      
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        return;
      }
    }

    // Get password with validation
    let password;
    let confirmPassword;
    
    do {
      console.log('\n📋 Password Requirements:');
      console.log('   - At least 8 characters long');
      console.log('   - At least one uppercase letter (A-Z)');
      console.log('   - At least one lowercase letter (a-z)');
      console.log('   - At least one number (0-9)');
      console.log('   - At least one special character (!@#$%^&*(),.?":{}|<>)');
      
      password = await askPassword('\nEnter admin password: ');
      
      if (!User.validatePassword(password)) {
        console.log('\n❌ Password does not meet security requirements. Please try again.');
        continue;
      }
      
      confirmPassword = await askPassword('Confirm admin password: ');
      
      if (password !== confirmPassword) {
        console.log('\n❌ Passwords do not match. Please try again.');
      }
    } while (!User.validatePassword(password) || password !== confirmPassword);

    // Create or update admin user
    if (existingAdmin) {
      existingAdmin.password = password;
      existingAdmin.isActive = true;
      existingAdmin.loginAttempts = 0;
      existingAdmin.lockUntil = undefined;
      existingAdmin.passwordChangedAt = new Date();
      await existingAdmin.save();
      console.log('\n✅ Admin user password updated successfully!');
    } else {
      const adminUser = await User.create({
        email,
        password,
        role: 'admin',
        isActive: true
      });
      console.log('\n✅ Admin user created successfully!');
      console.log('ID:', adminUser._id);
    }
    
    console.log(`\n📧 Email: ${email}`);
    console.log('🔒 Password: [HIDDEN FOR SECURITY]');
    console.log('\n⚠️  Security Recommendations:');
    console.log('   ✓ Change the password after first login');
    console.log('   ✓ Use a password manager');
    console.log('   ✓ Enable session monitoring');
    console.log('   ✓ Regularly review admin access logs');
    console.log('   ✓ Consider implementing 2FA in production');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate email address detected.');
    }
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\nOperation cancelled by user.');
  rl.close();
  mongoose.disconnect();
  process.exit(0);
});

// Run the script
createAdminUser();