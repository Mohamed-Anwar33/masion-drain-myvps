const mongoose = require('mongoose');
const SiteSettings = require('./models/SiteSettings');

mongoose.connect('mongodb://127.0.0.1:27017/maison-darin')
  .then(async () => {
    console.log('Connected to database');
    
    // Get current settings
    const settings = await SiteSettings.getSiteSettings();
    
    // Update email settings with the correct password
    settings.emailSettings.smtpPass = 'cnzs qjfg mxzg pkmb';
    settings.emailSettings.smtpUser = 'maisondarin2025@gmail.com';
    settings.emailSettings.smtpHost = 'smtp.gmail.com';
    settings.emailSettings.smtpPort = 587;
    settings.emailSettings.adminEmail = 'maisondarin2025@gmail.com';
    settings.emailSettings.fromEmail = 'maisondarin2025@gmail.com';
    settings.emailSettings.fromName = 'ميزون دارين - Maison Darin';
    settings.emailSettings.enableNotifications = true;
    settings.emailSettings.enableCustomerConfirmation = true;
    
    await settings.save();
    
    console.log('✅ Email settings updated successfully');
    console.log('SMTP Pass:', settings.emailSettings.smtpPass ? 'SET' : 'NOT SET');
    console.log('Admin Email:', settings.emailSettings.adminEmail);
    console.log('Enable Notifications:', settings.emailSettings.enableNotifications);
    console.log('Enable Customer Confirmation:', settings.emailSettings.enableCustomerConfirmation);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database error:', err);
    process.exit(1);
  });
