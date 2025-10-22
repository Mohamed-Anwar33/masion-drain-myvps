const mongoose = require('mongoose');
const SiteSettings = require('./models/SiteSettings');

// Load environment variables
require('dotenv').config();

async function updatePayPalSettings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get existing site settings
    let siteSettings = await SiteSettings.findOne();
    
    if (!siteSettings) {
      siteSettings = new SiteSettings({});
    }

    // Update PayPal settings with real credentials
    siteSettings.paypalSettings = {
      enabled: true,
      mode: 'sandbox',
      clientId: 'Ac60mEJLoUKBEDiIUsnjgr2lS5xFbpFn352-JrwDWPzPJWKVgLy4W7VwYlAMnwvrB1yq03fkIAZGZpa7',
      clientSecret: 'ED_SfwADAlVZmhjV6Qf7kVXLXf5tHtsmjD6Gi1_UdYPKZBae2Pe9yluX9eC6W7ieoxr3AJYmYMq3MENa',
      webhookId: '',
      currency: 'USD',
      brandName: 'Maison Darin',
      locale: 'en-US',
      landingPage: 'NO_PREFERENCE',
      userAction: 'pay_now',
      returnUrl: 'http://localhost:8080/checkout/success',
      cancelUrl: 'http://localhost:8080/checkout/cancel',
      enableShipping: true,
      enableTax: false
    };

    // Save the updated settings
    await siteSettings.save();

    console.log('✅ PayPal settings updated successfully!');
    console.log('   - Enabled:', siteSettings.paypalSettings.enabled);
    console.log('   - Mode:', siteSettings.paypalSettings.mode);
    console.log('   - Client ID:', siteSettings.paypalSettings.clientId.substring(0, 20) + '...');

  } catch (error) {
    console.error('❌ Error updating PayPal settings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updatePayPalSettings();
