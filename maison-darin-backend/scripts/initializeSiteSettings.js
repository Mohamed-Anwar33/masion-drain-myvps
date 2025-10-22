const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
require('dotenv').config();

async function initializeSiteSettings() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maison-darin');
    console.log('✅ Connected to MongoDB');

    // Check if settings already exist
    const existingSettings = await SiteSettings.findOne();
    
    if (existingSettings) {
      console.log('⚠️  Site settings already exist. Updating with new defaults...');
      
      // Update existing settings with new defaults (only if fields are empty)
      const updates = {};
      
      if (!existingSettings.emailSettings?.adminEmail) {
        updates['emailSettings.adminEmail'] = 'maisondarin2025@gmail.com';
      }
      
      if (!existingSettings.emailSettings?.smtpUser) {
        updates['emailSettings.smtpUser'] = 'maisondarin2025@gmail.com';
      }
      
      if (Object.keys(updates).length > 0) {
        await SiteSettings.updateOne({}, { $set: updates });
        console.log('✅ Updated existing settings with new defaults');
      } else {
        console.log('ℹ️  No updates needed');
      }
    } else {
      // Create new settings with defaults
      const defaultSettings = new SiteSettings({
        emailSettings: {
          adminEmail: 'maisondarin2025@gmail.com',
          fromEmail: 'noreply@maison-darin.com',
          fromName: 'ميزون دارين - Maison Darin',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'maisondarin2025@gmail.com',
          smtpPass: '', // Will be set from admin panel
          enableNotifications: true,
          enableCustomerConfirmation: true
        },
        
        siteInfo: {
          siteName: {
            ar: 'ميزون دارين',
            en: 'Maison Darin'
          },
          tagline: {
            ar: 'عالم العطور الفاخرة',
            en: 'World of Luxury Fragrances'
          },
          description: {
            ar: 'متجر ميزون دارين للعطور الفاخرة والأصيلة',
            en: 'Maison Darin Luxury and Authentic Fragrances Store'
          }
        },
        
        contactInfo: {
          email: 'info@maison-darin.com',
          phone: '+966 50 123 4567',
          whatsapp: '+966 50 123 4567',
          address: {
            ar: 'الرياض، المملكة العربية السعودية',
            en: 'Riyadh, Saudi Arabia'
          },
          workingHours: {
            ar: 'السبت - الخميس: 9:00 ص - 10:00 م',
            en: 'Saturday - Thursday: 9:00 AM - 10:00 PM'
          }
        },
        
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          tiktok: '',
          snapchat: ''
        },
        
        seoSettings: {
          metaTitle: {
            ar: 'ميزون دارين - عطور فاخرة وأصيلة',
            en: 'Maison Darin - Luxury & Authentic Fragrances'
          },
          metaDescription: {
            ar: 'اكتشف مجموعة ميزون دارين الفاخرة من العطور الأصيلة والمميزة',
            en: 'Discover Maison Darin\'s luxury collection of authentic and distinctive fragrances'
          },
          metaKeywords: {
            ar: 'عطور، عطور فاخرة، عطور أصيلة، ميزون دارين',
            en: 'perfumes, luxury fragrances, authentic perfumes, maison darin'
          }
        },
        
        businessSettings: {
          currency: 'SAR',
          currencySymbol: 'ريال',
          taxRate: 15,
          freeShippingThreshold: 200,
          defaultShippingCost: 25
        },
        
        maintenanceMode: {
          enabled: false,
          message: {
            ar: 'الموقع تحت الصيانة، سنعود قريباً',
            en: 'Site under maintenance, we\'ll be back soon'
          }
        }
      });

      await defaultSettings.save();
      console.log('✅ Created default site settings');
    }

    console.log('🎉 Site settings initialization completed successfully!');
    
    // Display current settings
    const currentSettings = await SiteSettings.findOne();
    console.log('\n📋 Current Settings:');
    console.log('Admin Email:', currentSettings.emailSettings.adminEmail);
    console.log('From Email:', currentSettings.emailSettings.fromEmail);
    console.log('Site Name (AR):', currentSettings.siteInfo.siteName.ar);
    console.log('Site Name (EN):', currentSettings.siteInfo.siteName.en);
    
  } catch (error) {
    console.error('❌ Error initializing site settings:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the initialization
if (require.main === module) {
  initializeSiteSettings();
}

module.exports = initializeSiteSettings;
