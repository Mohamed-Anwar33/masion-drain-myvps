const mongoose = require('mongoose');

const homePageContentSchema = new mongoose.Schema({
  // Hero Section - Multilingual Support
  hero: {
    // Badge Text
    badge: {
      en: {
        type: String,
        default: 'Luxury Fragrances'
      },
      ar: {
        type: String,
        default: 'عطور فاخرة'
      }
    },
    
    // Main Title
    title: {
      en: {
        type: String,
        default: 'Exquisite Perfumes for the Modern Woman'
      },
      ar: {
        type: String,
        default: 'عطور رائعة للمرأة العصرية'
      }
    },
    
    // Subtitle/Description
    subtitle: {
      en: {
        type: String,
        default: 'Discover our curated collection of artisanal fragrances, crafted with the finest ingredients and inspired by timeless elegance.'
      },
      ar: {
        type: String,
        default: 'اكتشفي مجموعتنا المختارة من العطور الحرفية، المصنوعة من أجود المكونات والمستوحاة من الأناقة الخالدة.'
      }
    },
    
    // Call to Action Buttons
    cta: {
      primary: {
        text: {
          en: {
            type: String,
            default: 'Explore Collections'
          },
          ar: {
            type: String,
            default: 'استكشفي المجموعات'
          }
        },
        link: {
          type: String,
          default: '/products'
        }
      },
      secondary: {
        text: {
          en: {
            type: String,
            default: 'Request Sample'
          },
          ar: {
            type: String,
            default: 'اطلبي عينة'
          }
        },
        link: {
          type: String,
          default: '/contact'
        }
      }
    },
    
    // Hero Images - Cloudinary Support
    images: {
      main: {
        url: {
          type: String,
          default: ''
        },
        cloudinaryId: {
          type: String,
          default: ''
        },
        alt: {
          en: {
            type: String,
            default: 'Maison Darin Luxury Perfume'
          },
          ar: {
            type: String,
            default: 'عطر ميزون دارين الفاخر'
          }
        }
      },
      slideshow: [{
        url: {
          type: String,
          required: true
        },
        cloudinaryId: {
          type: String,
          default: ''
        },
        alt: {
          en: {
            type: String,
            default: 'Luxury Perfume Collection'
          },
          ar: {
            type: String,
            default: 'مجموعة العطور الفاخرة'
          }
        },
        order: {
          type: Number,
          default: 0
        }
      }]
    },
    
    // Display Settings
    showSection: {
      type: Boolean,
      default: true
    },
    showBadge: {
      type: Boolean,
      default: true
    },
    showSlideshow: {
      type: Boolean,
      default: true
    },
    slideshowInterval: {
      type: Number,
      default: 4000 // milliseconds
    }
  },

  // About Section - Multilingual Support
  about: {
    // Main Title
    title: {
      en: {
        type: String,
        default: 'Our Story'
      },
      ar: {
        type: String,
        default: 'قصتنا'
      }
    },
    
    // Subtitle
    subtitle: {
      en: {
        type: String,
        default: 'WHEN HISTORY TURNS INTO TIMELESS FRAGRANCE..'
      },
      ar: {
        type: String,
        default: 'عندما يتحول التاريخ إلى عطر خالد..'
      }
    },
    
    // Main Description
    description: {
      en: {
        type: String,
        default: 'On the shores of the Arabian Gulf lies Dareen Island, where waves meet heritage and history whispers through every breeze. For centuries, Dareen stood as a global gateway of trade, a thriving port that welcomed fleets from India and East Asia. It became renowned for its musk, perfumes, and pearls, a destination where merchants and royalty alike found treasures beyond compare.'
      },
      ar: {
        type: String,
        default: 'على شواطئ الخليج العربي تقع جزيرة دارين، حيث تلتقي الأمواج بالتراث والتاريخ يهمس عبر كل نسمة. لقرون، وقفت دارين كبوابة عالمية للتجارة، ميناء مزدهر رحب بالأساطيل من الهند وشرق آسيا. أصبحت مشهورة بالمسك والعطور واللؤلؤ، وجهة حيث وجد التجار والملوك كنوزاً لا تُضاهى.'
      }
    },
    
    // Legacy Text
    legacy: {
      en: {
        type: String,
        default: 'Inspired by this legacy, Dareen Perfumes was born — redefining luxury with a modern touch while preserving the soul of tradition. Each fragrance is more than a scent; it is a journey through time, carrying the essence of ancient souks, the aroma of incense, and the elegance of the Arabian Gulf adorned with pearls. Dareen… where history transforms into a timeless fragrance, creating unforgettable moments of elegance and distinction.'
      },
      ar: {
        type: String,
        default: 'مستوحاة من هذا الإرث، وُلدت عطور دارين — إعادة تعريف الفخامة بلمسة عصرية مع الحفاظ على روح التقليد. كل عطر أكثر من مجرد رائحة؛ إنه رحلة عبر الزمن، يحمل جوهر الأسواق القديمة، وعبق البخور، وأناقة الخليج العربي المزين باللؤلؤ. دارين... حيث يتحول التاريخ إلى عطر خالد، خالقاً لحظات لا تُنسى من الأناقة والتميز.'
      }
    },
    
    // Values/Features
    values: {
      craftsmanship: {
        title: {
          en: {
            type: String,
            default: 'Artisanal Craftsmanship'
          },
          ar: {
            type: String,
            default: 'الحرفية الفنية'
          }
        },
        description: {
          en: {
            type: String,
            default: 'Every perfume is meticulously crafted using traditional techniques and the finest ingredients sourced globally.'
          },
          ar: {
            type: String,
            default: 'كل عطر مصنوع بعناية فائقة باستخدام تقنيات تقليدية وأجود المكونات المصدرة عالمياً.'
          }
        }
      },
      elegance: {
        title: {
          en: {
            type: String,
            default: 'Timeless Elegance'
          },
          ar: {
            type: String,
            default: 'الأناقة الخالدة'
          }
        },
        description: {
          en: {
            type: String,
            default: 'Our designs reflect sophistication and grace, creating pieces that transcend trends and seasons.'
          },
          ar: {
            type: String,
            default: 'تصاميمنا تعكس الرقي والنعومة، وتخلق قطعاً تتجاوز الصيحات والمواسم.'
          }
        }
      },
      exclusivity: {
        title: {
          en: {
            type: String,
            default: 'Exclusive Collections'
          },
          ar: {
            type: String,
            default: 'مجموعات حصرية'
          }
        },
        description: {
          en: {
            type: String,
            default: 'Limited edition fragrances that offer unique scent profiles for the discerning woman.'
          },
          ar: {
            type: String,
            default: 'عطور إصدار محدود تقدم ملامح عطرية فريدة للمرأة المميزة.'
          }
        }
      }
    },
    
    // Statistics
    statistics: {
      collections: {
        value: {
          type: String,
          default: '15+'
        },
        label: {
          en: {
            type: String,
            default: 'Collections'
          },
          ar: {
            type: String,
            default: 'مجموعة'
          }
        }
      },
      clients: {
        value: {
          type: String,
          default: '5K+'
        },
        label: {
          en: {
            type: String,
            default: 'Happy Clients'
          },
          ar: {
            type: String,
            default: 'عميلة سعيدة'
          }
        }
      },
      countries: {
        value: {
          type: String,
          default: '25+'
        },
        label: {
          en: {
            type: String,
            default: 'Countries'
          },
          ar: {
            type: String,
            default: 'دولة'
          }
        }
      }
    },
    
    // Display Settings
    showSection: {
      type: Boolean,
      default: true
    },
    showStatistics: {
      type: Boolean,
      default: true
    },
    showValues: {
      type: Boolean,
      default: true
    }
  },

  // Featured Collections section with multilingual support
  featuredCollections: {
    title: {
      en: {
        type: String,
        default: 'Featured Collections'
      },
      ar: {
        type: String,
        default: 'المجموعات المميزة'
      }
    },
    subtitle: {
      en: {
        type: String,
        default: 'Discover our most exclusive and beloved fragrance collections'
      },
      ar: {
        type: String,
        default: 'اكتشف أكثر مجموعات العطور حصرية وحباً'
      }
    },
    collections: [{
      name: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
      },
      description: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
      },
      image: {
        url: { type: String, required: true },
        cloudinaryId: { type: String },
        alt: {
          en: { type: String },
          ar: { type: String }
        }
      },
      category: {
        en: { type: String, required: true },
        ar: { type: String, required: true }
      },
      price: {
        value: { type: Number, required: true },
        currency: { type: String, default: 'SAR' },
        displayPrice: {
          en: { type: String },
          ar: { type: String }
        }
      },
      slug: { type: String, required: true },
      featured: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      rating: { type: Number, default: 4.9, min: 0, max: 5 },
      link: { type: String }, // Link to collection page
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }],
    showSection: { type: Boolean, default: true },
    maxCollections: { type: Number, default: 3 }, // Number of collections to display
    showPrices: { type: Boolean, default: true },
    showRatings: { type: Boolean, default: true },
    showViewAllButton: { type: Boolean, default: true },
    viewAllButtonText: {
      en: { type: String, default: 'View All Collections' },
      ar: { type: String, default: 'عرض جميع المجموعات' }
    },
    viewAllButtonLink: { type: String, default: '/products' }
  },

  // Featured Products Section
  featuredProductsTitle: {
    type: String,
    default: 'Featured Products'
  },
  featuredProductsSubtitle: {
    type: String,
    default: 'Discover our handpicked selection of premium products'
  },
  showFeaturedProducts: {
    type: Boolean,
    default: true
  },
  featuredProductsLimit: {
    type: Number,
    default: 8
  },

  // Categories Section
  categoriesTitle: {
    type: String,
    default: 'Shop by Category'
  },
  categoriesSubtitle: {
    type: String,
    default: 'Explore our diverse range of beauty and fragrance categories'
  },
  showCategories: {
    type: Boolean,
    default: true
  },

  // Newsletter Section
  newsletterTitle: {
    type: String,
    default: 'Stay Updated'
  },
  newsletterDescription: {
    type: String,
    default: 'Subscribe to our newsletter for the latest updates and exclusive offers'
  },
  newsletterButtonText: {
    type: String,
    default: 'Subscribe'
  },
  showNewsletter: {
    type: Boolean,
    default: true
  },

  // Contact Section
  contactTitle: {
    type: String,
    default: 'Get in Touch'
  },
  contactDescription: {
    type: String,
    default: 'Have questions? We\'d love to hear from you'
  },
  contactEmail: {
    type: String,
    default: 'info@maisondarin.com'
  },
  contactPhone: {
    type: String,
    default: '+1 (555) 123-4567'
  },
  contactAddress: {
    type: String,
    default: '123 Beauty Street, Luxury City, LC 12345'
  },
  showContact: {
    type: Boolean,
    default: true
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
    }
  },

  // SEO Settings
  seoTitle: {
    type: String,
    default: 'Maison Darin - Luxury Beauty & Fragrances'
  },
  seoDescription: {
    type: String,
    default: 'Discover premium beauty products and luxury fragrances at Maison Darin. Shop our exclusive collection of high-quality cosmetics and perfumes.'
  },
  seoKeywords: {
    type: String,
    default: 'luxury beauty, fragrances, cosmetics, perfumes, premium beauty products'
  },

  // Email Settings
  contactFormEmail: {
    type: String,
    default: 'contact@maisondarin.com'
  },
  newsletterEmail: {
    type: String,
    default: 'newsletter@maisondarin.com'
  },
  orderNotificationEmail: {
    type: String,
    default: 'orders@maisondarin.com'
  },

  // Display Settings
  showHeroSection: {
    type: Boolean,
    default: true
  },
  showAboutSection: {
    type: Boolean,
    default: true
  },
  showTestimonials: {
    type: Boolean,
    default: true
  },
  showBlog: {
    type: Boolean,
    default: false
  },

  // Custom CSS
  customCSS: {
    type: String,
    default: ''
  },

  // Custom JavaScript
  customJS: {
    type: String,
    default: ''
  },

  // Maintenance Mode
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'We are currently performing maintenance. Please check back soon!'
  },

  // Last Updated
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one document exists
homePageContentSchema.statics.getSingleton = async function() {
  let content = await this.findOne();
  if (!content) {
    content = await this.create({});
  }
  return content;
};

homePageContentSchema.statics.updateSingleton = async function(updateData, userId) {
  let content = await this.findOne();
  if (!content) {
    content = new this(updateData);
  } else {
    Object.assign(content, updateData);
  }
  content.lastUpdated = new Date();
  content.updatedBy = userId;
  return await content.save();
};

module.exports = mongoose.model('HomePageContent', homePageContentSchema);
