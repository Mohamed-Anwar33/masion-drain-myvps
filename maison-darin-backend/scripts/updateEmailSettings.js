const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');

async function updateEmailSettings() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect('mongodb://127.0.0.1:27017/maison-darin');
    console.log('✅ Connected to database');
    
    // Get or create site settings
    let settings = await SiteSettings.findOne({});
    if (!settings) {
      console.log('📝 Creating new site settings document...');
      settings = new SiteSettings({});
    }
    
    console.log('📧 Current email settings:', JSON.stringify(settings.emailSettings, null, 2));
    
    // Update email settings with complete configuration
    settings.emailSettings = {
      adminEmail: 'maisondarin2025@gmail.com',
      fromEmail: 'maisondarin2025@gmail.com', 
      fromName: 'ميزون دارين - Maison Darin',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'maisondarin2025@gmail.com',
      smtpPass: 'cnzs qjfg mxzg pkmb',
      enableNotifications: true,
      enableCustomerConfirmation: true
    };
    
    await settings.save();
    console.log('✅ Email settings updated successfully!');
    console.log('📧 New email settings:', JSON.stringify(settings.emailSettings, null, 2));
    
    // Verify the update
    const verifySettings = await SiteSettings.findOne({});
    console.log('🔍 Verification - Email settings from database:', {
      adminEmail: verifySettings.emailSettings.adminEmail,
      smtpHost: verifySettings.emailSettings.smtpHost,
      smtpPort: verifySettings.emailSettings.smtpPort,
      smtpUser: verifySettings.emailSettings.smtpUser,
      hasPassword: !!verifySettings.emailSettings.smtpPass,
      enableNotifications: verifySettings.emailSettings.enableNotifications,
      enableCustomerConfirmation: verifySettings.emailSettings.enableCustomerConfirmation
    });
    
    console.log('🎉 Email settings update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating email settings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
}

updateEmailSettings();
