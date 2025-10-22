/**
 * Email Configuration - Fixed SMTP Settings
 * These settings are hardcoded for security and cannot be changed from admin panel
 */

const emailConfig = {
  // Fixed SMTP settings for maisondarin2025@gmail.com
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'maisondarin2025@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password-here' // App password from .env
    }
  },
  
  // Fixed sender information
  from: {
    email: 'maisondarin2025@gmail.com',
    name: 'ميزون دارين - Maison Darin'
  },
  
  // Admin email (where messages are sent)
  adminEmail: 'maisondarin2025@gmail.com',
  
  // Email settings that can be toggled
  settings: {
    enableNotifications: true,
    enableCustomerConfirmation: true
  }
};

module.exports = {
  emailConfig
};
