const mongoose = require('mongoose');
const paymentGatewayEncryption = require('../utils/paymentGatewayEncryption');

const settingsSchema = new mongoose.Schema({
  // Site Information
  site: {
    title: {
      en: { type: String, required: true, default: 'Maison Darin' },
      ar: { type: String, required: true, default: 'دار دارين' }
    },
    tagline: {
      en: { type: String, default: 'Luxury Fragrances' },
      ar: { type: String, default: 'عطور فاخرة' }
    },
    description: {
      en: { type: String, default: 'Luxury perfumes for the modern woman' },
      ar: { type: String, default: 'عطور فاخرة للمرأة العصرية' }
    },
    email: { type: String, required: true, default: 'hello@maisondarin.com' },
    phone: { type: String, default: '+1 (555) 123-4567' },
    address: { type: String, default: 'Luxury Boutique, Fashion District' },
    socialMedia: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      youtube: { type: String, default: '' }
    }
  },

  // SEO Settings
  seo: {
    metaTitle: {
      en: { type: String, default: 'Maison Darin - Luxury Perfumes' },
      ar: { type: String, default: 'دار دارين - عطور فاخرة' }
    },
    metaDescription: {
      en: { type: String, default: 'Discover our curated collection of luxury perfumes for women' },
      ar: { type: String, default: 'اكتشفي مجموعتنا المختارة من العطور الفاخرة للنساء' }
    },
    keywords: {
      en: { type: String, default: 'luxury perfume, women fragrance, artisanal scents' },
      ar: { type: String, default: 'عطور فاخرة، عطور نسائية، عطور حرفية' }
    },
    enableSitemap: { type: Boolean, default: true },
    enableRobots: { type: Boolean, default: true }
  },

  // Appearance Settings
  appearance: {
    primaryColor: { type: String, default: '#1E6660' },
    accentColor: { type: String, default: '#CD9D82' },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    enableAnimations: { type: Boolean, default: true },
    enableParallax: { type: Boolean, default: true }
  },

  // Feature Toggles
  features: {
    enableSampleRequests: { type: Boolean, default: true },
    enableNewsletter: { type: Boolean, default: true },
    enableLiveChat: { type: Boolean, default: false },
    enableAnalytics: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false }
  },

  // Shipping Settings
  shipping: {
    enableShipping: { type: Boolean, default: true },
    freeShippingThreshold: { type: Number, default: 100 },
    domesticShipping: {
      enabled: { type: Boolean, default: true },
      cost: { type: Number, default: 10 },
      estimatedDays: { type: String, default: '3-5' },
      description: {
        en: { type: String, default: 'Standard domestic shipping' },
        ar: { type: String, default: 'الشحن المحلي العادي' }
      }
    },
    internationalShipping: {
      enabled: { type: Boolean, default: true },
      cost: { type: Number, default: 25 },
      estimatedDays: { type: String, default: '7-14' },
      description: {
        en: { type: String, default: 'International shipping' },
        ar: { type: String, default: 'الشحن الدولي' }
      }
    },
    expressShipping: {
      enabled: { type: Boolean, default: true },
      cost: { type: Number, default: 20 },
      estimatedDays: { type: String, default: '1-2' },
      description: {
        en: { type: String, default: 'Express shipping' },
        ar: { type: String, default: 'الشحن السريع' }
      }
    },
    shippingZones: [{
      name: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
      },
      countries: [{ type: String, required: true }],
      cost: { type: Number, required: true },
      estimatedDays: { type: String, required: true }
    }]
  },

  // Tax Settings
  taxes: {
    enableTaxes: { type: Boolean, default: true },
    taxIncludedInPrice: { type: Boolean, default: false },
    defaultTaxRate: { type: Number, default: 14 },
    taxRates: [{
      name: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
      },
      rate: { type: Number, required: true },
      countries: [{ type: String, required: true }],
      enabled: { type: Boolean, default: true }
    }],
    taxExemptProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    displayTaxBreakdown: { type: Boolean, default: true }
  },

  // Localization Settings
  localization: {
    defaultLanguage: { type: String, enum: ['en', 'ar'], default: 'en' },
    enableRTL: { type: Boolean, default: true },
    dateFormat: { type: String, enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], default: 'MM/DD/YYYY' },
    currencySymbol: { type: String, default: '$' },
    currencyCode: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' }
  },

  // Payment Gateway Settings (Encrypted)
  paymentGateways: {
    paymob: {
      enabled: { type: Boolean, default: false },
      environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      credentials: {
        apiKey: { type: String, default: '' }, // Will be encrypted
        secretKey: { type: String, default: '' }, // Will be encrypted
        merchantId: { type: String, default: '' },
        visaIntegrationId: { type: String, default: '' },
        mastercardIntegrationId: { type: String, default: '' },
        webhookSecret: { type: String, default: '' } // Will be encrypted
      }
    },
    fawry: {
      enabled: { type: Boolean, default: false },
      environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      credentials: {
        merchantCode: { type: String, default: '' },
        secretKey: { type: String, default: '' }, // Will be encrypted
        webhookSecret: { type: String, default: '' } // Will be encrypted
      }
    },
    paypal: {
      enabled: { type: Boolean, default: false },
      environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      credentials: {
        clientId: { type: String, default: '' }, // Will be encrypted
        clientSecret: { type: String, default: '' }, // Will be encrypted
        webhookId: { type: String, default: '' }
      }
    },
    bankTransfer: {
      enabled: { type: Boolean, default: true },
      accounts: [{
        bankName: {
          en: { type: String, default: 'National Bank of Egypt' },
          ar: { type: String, default: 'البنك الأهلي المصري' }
        },
        accountName: {
          en: { type: String, default: 'Maison Darin Perfumes' },
          ar: { type: String, default: 'ميزون دارين للعطور' }
        },
        accountNumber: { type: String, default: '' },
        iban: { type: String, default: '' },
        swiftCode: { type: String, default: '' },
        currency: { type: String, default: 'EGP' },
        instructions: {
          en: { type: String, default: '' },
          ar: { type: String, default: '' }
        }
      }]
    }
  },

  // System Settings
  system: {
    version: { type: String, default: '1.0.0' },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    encryptionVersion: { type: Number, default: 1 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one settings document exists
settingsSchema.index({}, { unique: true });

// Pre-save middleware to update lastUpdated and encrypt sensitive data
settingsSchema.pre('save', function(next) {
  this.system.lastUpdated = new Date();
  // Encrypt payment gateway credentials before saving
  this.encryptPaymentGateways();
  next();
});

// Static method to get or create settings
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = new this({
      shipping: {
        shippingZones: [
          {
            name: { en: "Local Area", ar: "المنطقة المحلية" },
            countries: ["EG"],
            cost: 5,
            estimatedDays: "1-2"
          },
          {
            name: { en: "Middle East", ar: "الشرق الأوسط" },
            countries: ["SA", "AE", "KW", "QA", "BH", "OM"],
            cost: 15,
            estimatedDays: "3-7"
          },
          {
            name: { en: "International", ar: "دولي" },
            countries: ["*"],
            cost: 25,
            estimatedDays: "7-14"
          }
        ]
      },
      taxes: {
        taxRates: [
          {
            name: { en: "VAT", ar: "ضريبة القيمة المضافة" },
            rate: 14,
            countries: ["EG"],
            enabled: true
          },
          {
            name: { en: "Gulf VAT", ar: "ضريبة القيمة المضافة الخليجية" },
            rate: 5,
            countries: ["AE", "SA", "BH", "OM"],
            enabled: true
          },
          {
            name: { en: "Kuwait VAT", ar: "ضريبة الكويت" },
            rate: 0,
            countries: ["KW"],
            enabled: false
          }
        ]
      }
    });
    await settings.save();
  }
  
  return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updates, updatedBy) {
  const settings = await this.getSettings();
  
  // Deep merge updates
  Object.keys(updates).forEach(key => {
    if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
      settings[key] = { ...settings[key], ...updates[key] };
    } else {
      settings[key] = updates[key];
    }
  });
  
  if (updatedBy) {
    settings.system.updatedBy = updatedBy;
  }
  
  await settings.save();
  return settings;
};

// Instance method to get shipping cost for country
settingsSchema.methods.getShippingCost = function(countryCode, shippingType = 'standard') {
  if (!this.shipping.enableShipping) return 0;
  
  // Check for free shipping threshold (would need order total)
  // This is a basic implementation
  
  if (shippingType === 'express' && this.shipping.expressShipping.enabled) {
    return this.shipping.expressShipping.cost;
  }
  
  // Find shipping zone for country
  const zone = this.shipping.shippingZones.find(zone => 
    zone.countries.includes(countryCode) || zone.countries.includes('*')
  );
  
  if (zone) {
    return zone.cost;
  }
  
  // Default to international shipping
  return this.shipping.internationalShipping.enabled ? 
    this.shipping.internationalShipping.cost : 0;
};

// Instance method to get tax rate for country
settingsSchema.methods.getTaxRate = function(countryCode) {
  if (!this.taxes.enableTaxes) return 0;
  
  const taxRate = this.taxes.taxRates.find(rate => 
    rate.enabled && rate.countries.includes(countryCode)
  );
  
  return taxRate ? taxRate.rate : this.taxes.defaultTaxRate;
};

// Instance method to calculate tax amount
settingsSchema.methods.calculateTax = function(amount, countryCode) {
  const taxRate = this.getTaxRate(countryCode);
  
  if (this.taxes.taxIncludedInPrice) {
    // Tax is included, calculate the tax portion
    return (amount * taxRate) / (100 + taxRate);
  } else {
    // Tax is additional
    return (amount * taxRate) / 100;
  }
};

// Instance method to encrypt payment gateway credentials
settingsSchema.methods.encryptPaymentGateways = function() {
  if (this.paymentGateways) {
    // Encrypt Paymob credentials
    if (this.paymentGateways.paymob && this.paymentGateways.paymob.credentials) {
      const paymobCreds = this.paymentGateways.paymob.credentials;
      if (paymobCreds.apiKey && !paymentGatewayEncryption.isEncrypted(paymobCreds.apiKey)) {
        paymobCreds.apiKey = paymentGatewayEncryption.encrypt(paymobCreds.apiKey);
      }
      if (paymobCreds.secretKey && !paymentGatewayEncryption.isEncrypted(paymobCreds.secretKey)) {
        paymobCreds.secretKey = paymentGatewayEncryption.encrypt(paymobCreds.secretKey);
      }
      if (paymobCreds.webhookSecret && !paymentGatewayEncryption.isEncrypted(paymobCreds.webhookSecret)) {
        paymobCreds.webhookSecret = paymentGatewayEncryption.encrypt(paymobCreds.webhookSecret);
      }
    }

    // Encrypt Fawry credentials
    if (this.paymentGateways.fawry && this.paymentGateways.fawry.credentials) {
      const fawryCreds = this.paymentGateways.fawry.credentials;
      if (fawryCreds.secretKey && !paymentGatewayEncryption.isEncrypted(fawryCreds.secretKey)) {
        fawryCreds.secretKey = paymentGatewayEncryption.encrypt(fawryCreds.secretKey);
      }
      if (fawryCreds.webhookSecret && !paymentGatewayEncryption.isEncrypted(fawryCreds.webhookSecret)) {
        fawryCreds.webhookSecret = paymentGatewayEncryption.encrypt(fawryCreds.webhookSecret);
      }
    }

    // Encrypt PayPal credentials
    if (this.paymentGateways.paypal && this.paymentGateways.paypal.credentials) {
      const paypalCreds = this.paymentGateways.paypal.credentials;
      if (paypalCreds.clientId && !paymentGatewayEncryption.isEncrypted(paypalCreds.clientId)) {
        paypalCreds.clientId = paymentGatewayEncryption.encrypt(paypalCreds.clientId);
      }
      if (paypalCreds.clientSecret && !paymentGatewayEncryption.isEncrypted(paypalCreds.clientSecret)) {
        paypalCreds.clientSecret = paymentGatewayEncryption.encrypt(paypalCreds.clientSecret);
      }
    }
  }
};

// Instance method to decrypt payment gateway credentials (for internal use)
settingsSchema.methods.decryptPaymentGateways = function() {
  const decrypted = this.toObject();
  
  if (decrypted.paymentGateways) {
    // Decrypt Paymob credentials
    if (decrypted.paymentGateways.paymob && decrypted.paymentGateways.paymob.credentials) {
      const paymobCreds = decrypted.paymentGateways.paymob.credentials;
      if (paymobCreds.apiKey) {
        paymobCreds.apiKey = paymentGatewayEncryption.decrypt(paymobCreds.apiKey);
      }
      if (paymobCreds.secretKey) {
        paymobCreds.secretKey = paymentGatewayEncryption.decrypt(paymobCreds.secretKey);
      }
      if (paymobCreds.webhookSecret) {
        paymobCreds.webhookSecret = paymentGatewayEncryption.decrypt(paymobCreds.webhookSecret);
      }
    }

    // Decrypt Fawry credentials
    if (decrypted.paymentGateways.fawry && decrypted.paymentGateways.fawry.credentials) {
      const fawryCreds = decrypted.paymentGateways.fawry.credentials;
      if (fawryCreds.secretKey) {
        fawryCreds.secretKey = paymentGatewayEncryption.decrypt(fawryCreds.secretKey);
      }
      if (fawryCreds.webhookSecret) {
        fawryCreds.webhookSecret = paymentGatewayEncryption.decrypt(fawryCreds.webhookSecret);
      }
    }

    // Decrypt PayPal credentials
    if (decrypted.paymentGateways.paypal && decrypted.paymentGateways.paypal.credentials) {
      const paypalCreds = decrypted.paymentGateways.paypal.credentials;
      if (paypalCreds.clientId) {
        paypalCreds.clientId = paymentGatewayEncryption.decrypt(paypalCreds.clientId);
      }
      if (paypalCreds.clientSecret) {
        paypalCreds.clientSecret = paymentGatewayEncryption.decrypt(paypalCreds.clientSecret);
      }
    }
  }
  
  return decrypted;
};

// Instance method to get masked credentials for display
settingsSchema.methods.getMaskedPaymentGateways = function() {
  const masked = this.toObject();
  
  if (masked.paymentGateways) {
    // Mask Paymob credentials
    if (masked.paymentGateways.paymob && masked.paymentGateways.paymob.credentials) {
      const paymobCreds = masked.paymentGateways.paymob.credentials;
      if (paymobCreds.apiKey) {
        paymobCreds.apiKey = paymentGatewayEncryption.mask(paymobCreds.apiKey, 6);
      }
      if (paymobCreds.secretKey) {
        paymobCreds.secretKey = '****************';
      }
      if (paymobCreds.webhookSecret) {
        paymobCreds.webhookSecret = '****************';
      }
    }

    // Mask Fawry credentials
    if (masked.paymentGateways.fawry && masked.paymentGateways.fawry.credentials) {
      const fawryCreds = masked.paymentGateways.fawry.credentials;
      if (fawryCreds.secretKey) {
        fawryCreds.secretKey = '****************';
      }
      if (fawryCreds.webhookSecret) {
        fawryCreds.webhookSecret = '****************';
      }
    }

    // Mask PayPal credentials
    if (masked.paymentGateways.paypal && masked.paymentGateways.paypal.credentials) {
      const paypalCreds = masked.paymentGateways.paypal.credentials;
      if (paypalCreds.clientId) {
        paypalCreds.clientId = paymentGatewayEncryption.mask(paypalCreds.clientId, 6);
      }
      if (paypalCreds.clientSecret) {
        paypalCreds.clientSecret = '****************';
      }
    }
  }
  
  return masked;
};

// Pre-save middleware to encrypt sensitive data
settingsSchema.pre('save', function(next) {
  // Encrypt payment gateway credentials before saving
  this.encryptPaymentGateways();
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;