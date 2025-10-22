const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  // Email Settings
  emailSettings: {
    adminEmail: {
      type: String,
      required: true,
      default: 'maisondarin2025@gmail.com'
    },
    fromEmail: {
      type: String,
      required: true,
      default: 'noreply@maison-darin.com'
    },
    fromName: {
      type: String,
      required: true,
      default: 'ميزون دارين - Maison Darin'
    },
    // SMTP Settings
    smtpHost: {
      type: String,
      default: 'smtp.gmail.com'
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpUser: {
      type: String,
      default: 'maisondarin2025@gmail.com'
    },
    smtpPass: {
      type: String,
      default: ''
    },
    enableNotifications: {
      type: Boolean,
      default: true
    },
    enableCustomerConfirmation: {
      type: Boolean,
      default: true
    }
  },

  // Site Information
  siteInfo: {
    siteName: {
      ar: {
        type: String,
        default: 'ميزون دارين'
      },
      en: {
        type: String,
        default: 'Maison Darin'
      }
    },
    tagline: {
      ar: {
        type: String,
        default: 'عالم العطور الفاخرة'
      },
      en: {
        type: String,
        default: 'World of Luxury Fragrances'
      }
    },
    description: {
      ar: {
        type: String,
        default: 'متجر ميزون دارين للعطور الفاخرة والأصيلة'
      },
      en: {
        type: String,
        default: 'Maison Darin Luxury and Authentic Fragrances Store'
      }
    },
    logo: {
      type: String,
      default: ''
    },
    favicon: {
      type: String,
      default: ''
    }
  },

  // Contact Information
  contactInfo: {
    email: {
      type: String,
      default: 'info@maison-darin.com'
    },
    phone: {
      type: String,
      default: '+966 50 123 4567'
    },
    whatsapp: {
      type: String,
      default: '+966 50 123 4567'
    },
    whatsappEnabled: {
      type: Boolean,
      default: true
    },
    address: {
      ar: {
        type: String,
        default: 'الرياض، المملكة العربية السعودية'
      },
      en: {
        type: String,
        default: 'Riyadh, Saudi Arabia'
      }
    },
    workingHours: {
      ar: {
        type: String,
        default: 'السبت - الخميس: 9:00 ص - 10:00 م'
      },
      en: {
        type: String,
        default: 'Saturday - Thursday: 9:00 AM - 10:00 PM'
      }
    }
  },


  // Social Media Links
  socialMedia: {
    facebook: {
      type: String,
      default: ''
    },
    instagram: {
      type: String,
      default: ''
    },
    twitter: {
      type: String,
      default: ''
    },
    youtube: {
      type: String,
      default: ''
    },
    tiktok: {
      type: String,
      default: ''
    },
    snapchat: {
      type: String,
      default: ''
    }
  },

  // SEO Settings
  seoSettings: {
    metaTitle: {
      ar: {
        type: String,
        default: 'ميزون دارين - عطور فاخرة وأصيلة'
      },
      en: {
        type: String,
        default: 'Maison Darin - Luxury & Authentic Fragrances'
      }
    },
    metaDescription: {
      ar: {
        type: String,
        default: 'اكتشف مجموعة ميزون دارين الفاخرة من العطور الأصيلة والمميزة'
      },
      en: {
        type: String,
        default: 'Discover Maison Darin\'s luxury collection of authentic and distinctive fragrances'
      }
    },
    metaKeywords: {
      ar: {
        type: String,
        default: 'عطور، عطور فاخرة، عطور أصيلة، ميزون دارين'
      },
      en: {
        type: String,
        default: 'perfumes, luxury fragrances, authentic perfumes, maison darin'
      }
    },
    googleAnalyticsId: {
      type: String,
      default: ''
    },
    facebookPixelId: {
      type: String,
      default: ''
    }
  },

  // Business Settings
  businessSettings: {
    currency: {
      type: String,
      default: 'SAR'
    },
    currencySymbol: {
      type: String,
      default: 'ريال'
    },
    taxRate: {
      type: Number,
      default: 15 // 15% VAT in Saudi Arabia
    },
    freeShippingThreshold: {
      type: Number,
      default: 200
    },
    defaultShippingCost: {
      type: Number,
      default: 25
    }
  },

  // PayPal Settings
  paypalSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    environment: {
      type: String,
      enum: ['sandbox', 'live'],
      default: 'live'
    },
    clientId: {
      type: String,
      default: ''
    },
    clientSecret: {
      type: String,
      default: ''
    },
    webhookId: {
      type: String,
      default: ''
    }
  },

  // Maintenance Mode
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      ar: {
        type: String,
        default: 'الموقع تحت الصيانة، سنعود قريباً'
      },
      en: {
        type: String,
        default: 'Site under maintenance, we\'ll be back soon'
      }
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
siteSettingsSchema.statics.getSiteSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

siteSettingsSchema.statics.updateSiteSettings = async function(updates) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
