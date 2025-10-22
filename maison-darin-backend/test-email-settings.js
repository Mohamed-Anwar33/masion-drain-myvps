const mongoose = require('mongoose');
const SiteSettings = require('./models/SiteSettings');

mongoose.connect('mongodb://127.0.0.1:27017/maison-darin')
  .then(async () => {
    console.log('Connected to database');
    const settings = await SiteSettings.getSiteSettings();
    console.log('SMTP Pass:', settings.emailSettings.smtpPass ? 'SET' : 'NOT SET');
    console.log('Enable Notifications:', settings.emailSettings.enableNotifications);
    console.log('Enable Customer Confirmation:', settings.emailSettings.enableCustomerConfirmation);
    process.exit(0);
  })
  .catch(err => {
    console.error('Database error:', err);
    process.exit(1);
  });
