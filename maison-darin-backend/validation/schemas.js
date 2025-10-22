const Joi = require('joi');

// Common validation patterns
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');
const email = Joi.string().email().lowercase().trim();
const password = Joi.string().min(8).max(128);
const phone = Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{7,20}$/).message('Invalid phone number format');
const url = Joi.string().uri();

// Multilingual text validation
const multilingualText = Joi.object({
  en: Joi.string().required().trim().min(1).max(1000),
  ar: Joi.string().required().trim().min(1).max(1000)
});

const multilingualTextOptional = Joi.object({
  en: Joi.string().allow('').trim().max(1000),
  ar: Joi.string().allow('').trim().max(1000)
});

const multilingualArray = Joi.object({
  en: Joi.array().items(Joi.string().trim().max(100)),
  ar: Joi.array().items(Joi.string().trim().max(100))
});

// Authentication schemas
const authSchemas = {
  login: Joi.object({
    email: email.required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: password.required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  })
};

// Product schemas
const productSchemas = {
  create: Joi.object({
    name: multilingualText.required(),
    description: multilingualText.required(),
    longDescription: multilingualTextOptional,
    price: Joi.number().positive().precision(2).required().messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required'
    }),
    size: Joi.string().required().trim().max(50),
    category: Joi.string()
      .valid('floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand')
      .required()
      .messages({
        'any.only': 'Category must be one of: floral, oriental, fresh, woody, citrus, spicy, aquatic, gourmand'
      }),
    concentration: multilingualTextOptional,
    notes: Joi.object({
      top: multilingualArray,
      middle: multilingualArray,
      base: multilingualArray
    }),
    featured: Joi.boolean().default(false),
    inStock: Joi.boolean().default(true),
    stock: Joi.number().integer().min(0).default(0),
    images: Joi.array().items(
      Joi.alternatives().try(
        Joi.string().uri(), // URL string
        Joi.object({
          url: Joi.string().uri().required(),
          cloudinaryId: Joi.string().required(),
          alt: Joi.object({
            en: Joi.string().allow('').max(200),
            ar: Joi.string().allow('').max(200)
          }),
          order: Joi.number().integer().min(0)
        })
      )
    ).max(10).default([]),
    seo: Joi.object({
      metaTitle: multilingualTextOptional,
      metaDescription: multilingualTextOptional
    })
  }),

  update: Joi.object({
    name: multilingualText,
    description: multilingualText,
    longDescription: multilingualTextOptional,
    price: Joi.number().positive().precision(2),
    size: Joi.string().trim().max(50),
    category: Joi.string()
      .valid('floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand'),
    concentration: multilingualTextOptional,
    notes: Joi.object({
      top: multilingualArray,
      middle: multilingualArray,
      base: multilingualArray
    }),
    featured: Joi.boolean(),
    inStock: Joi.boolean(),
    stock: Joi.number().integer().min(0),
    images: Joi.array().items(
      Joi.alternatives().try(
        Joi.string().uri(), // URL string
        Joi.object({
          url: Joi.string().uri().required(),
          cloudinaryId: Joi.string().required(),
          alt: Joi.object({
            en: Joi.string().allow('').max(200),
            ar: Joi.string().allow('').max(200)
          }),
          order: Joi.number().integer().min(0)
        })
      )
    ).max(10),
    seo: Joi.object({
      metaTitle: multilingualTextOptional,
      metaDescription: multilingualTextOptional
    })
  }).min(1), // At least one field must be provided

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    category: Joi.string().valid('floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand'),
    featured: Joi.boolean(),
    inStock: Joi.boolean(),
    minPrice: Joi.number().positive(),
    maxPrice: Joi.number().positive(),
    search: Joi.string().trim().max(100),
    sort: Joi.string().valid('name', 'price', 'createdAt', '-name', '-price', '-createdAt').default('-createdAt')
  }),

  params: Joi.object({
    id: objectId.required()
  })
};

// Content schemas
const contentSchemas = {
  update: Joi.object({
    content: Joi.object({
      en: Joi.object().required(),
      ar: Joi.object().required()
    }).required()
  }),

  params: Joi.object({
    section: Joi.string()
      .valid('hero', 'about', 'nav', 'contact', 'collections', 'footer')
      .required()
      .messages({
        'any.only': 'Section must be one of: hero, about, nav, contact, collections, footer'
      })
  }),

  query: Joi.object({
    language: Joi.string().valid('en', 'ar').default('en')
  })
};

// Media schemas
const mediaSchemas = {
  upload: Joi.object({
    altEn: Joi.string().allow('').trim().max(200),
    altAr: Joi.string().allow('').trim().max(200),
    tags: Joi.string().allow('').trim().max(500), // comma-separated tags
    folder: Joi.string().allow('').trim().max(100)
  }).unknown(true), // Allow additional fields

  update: Joi.object({
    alt: Joi.object({
      en: Joi.string().allow('').trim().max(200),
      ar: Joi.string().allow('').trim().max(200)
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10)
  }).min(1),

  params: Joi.object({
    id: objectId.required()
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    tags: Joi.string().trim()
  })
};

// Order schemas
const orderSchemas = {
  create: Joi.object({
    items: Joi.array().items(
      Joi.object({
        product: objectId.required(),
        quantity: Joi.number().integer().min(1).max(10).required(),
        price: Joi.number().positive().precision(2).required()
      })
    ).min(1).max(20).required(),
    customerInfo: Joi.object({
      firstName: Joi.string().required().trim().min(1).max(50),
      lastName: Joi.string().required().trim().min(1).max(50),
      email: email.required(),
      phone: phone.required(),
      address: Joi.string().required().trim().min(5).max(200),
      city: Joi.string().required().trim().min(1).max(50),
      postalCode: Joi.string().required().trim().min(3).max(20),
      country: Joi.string().required().trim().min(2).max(50)
    }).required(),
    paymentMethod: Joi.string()
      .valid('paypal', 'card', 'bank_transfer')
      .required()
      .messages({
        'any.only': 'Payment method must be one of: paypal, card, bank_transfer'
      }),
    notes: Joi.string().allow('').trim().max(500)
  }),

  updateStatus: Joi.object({
    orderStatus: Joi.string()
      .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    paymentStatus: Joi.string()
      .valid('pending', 'completed', 'failed', 'refunded'),
    notes: Joi.string().allow('').trim().max(500)
  }).min(1),

  params: Joi.object({
    id: objectId.required()
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    orderStatus: Joi.string()
      .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    paymentStatus: Joi.string()
      .valid('pending', 'completed', 'failed', 'refunded'),
    customerEmail: email,
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    sort: Joi.string().valid('createdAt', '-createdAt', 'total', '-total').default('-createdAt')
  })
};

// Sample request schemas
const sampleSchemas = {
  create: Joi.object({
    customerInfo: Joi.object({
      firstName: Joi.string().required().trim().min(1).max(50),
      lastName: Joi.string().required().trim().min(1).max(50),
      email: email.required(),
      phone: phone.required(),
      address: Joi.string().required().trim().min(5).max(200),
      city: Joi.string().required().trim().min(1).max(50),
      postalCode: Joi.string().required().trim().min(3).max(20),
      country: Joi.string().required().trim().min(2).max(50)
    }).required(),
    requestedProducts: Joi.array().items(
      Joi.object({
        product: objectId.required(),
        notes: Joi.string().allow('').trim().max(200)
      })
    ).min(1).max(5).required(),
    notes: Joi.string().allow('').trim().max(500)
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'approved', 'shipped', 'delivered', 'rejected')
      .required(),
    adminNotes: Joi.string().allow('').trim().max(500)
  }),

  params: Joi.object({
    id: objectId.required()
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    status: Joi.string()
      .valid('pending', 'approved', 'shipped', 'delivered', 'rejected'),
    customerEmail: email,
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    sort: Joi.string().valid('createdAt', '-createdAt').default('-createdAt')
  })
};

// Contact message schemas
const contactSchemas = {
  create: Joi.object({
    customerInfo: Joi.object({
      firstName: Joi.string().required().trim().min(1).max(50).messages({
        'string.empty': 'الاسم الأول مطلوب',
        'any.required': 'الاسم الأول مطلوب',
        'string.min': 'الاسم الأول يجب أن يكون حرف واحد على الأقل',
        'string.max': 'الاسم الأول لا يمكن أن يزيد عن 50 حرف'
      }),
      lastName: Joi.string().required().trim().min(1).max(50).messages({
        'string.empty': 'الاسم الأخير مطلوب',
        'any.required': 'الاسم الأخير مطلوب',
        'string.min': 'الاسم الأخير يجب أن يكون حرف واحد على الأقل',
        'string.max': 'الاسم الأخير لا يمكن أن يزيد عن 50 حرف'
      }),
      email: email.required().messages({
        'string.email': 'يرجى إدخال بريد إلكتروني صحيح',
        'any.required': 'البريد الإلكتروني مطلوب',
        'string.empty': 'البريد الإلكتروني مطلوب'
      }),
      phone: phone.required().messages({
        'string.empty': 'رقم الهاتف مطلوب',
        'any.required': 'رقم الهاتف مطلوب',
        'string.pattern.base': 'رقم الهاتف غير صحيح. يرجى إدخال رقم صحيح'
      })
    }).required(),
    subject: Joi.string().allow('').trim().max(200).messages({
      'string.max': 'الموضوع لا يمكن أن يزيد عن 200 حرف'
    }),
    message: Joi.string().required().trim().min(1).max(5000).messages({
      'string.empty': 'نص الرسالة مطلوب',
      'any.required': 'نص الرسالة مطلوب',
      'string.min': 'الرسالة يجب أن تحتوي على حرف واحد على الأقل',
      'string.max': 'الرسالة لا يمكن أن تزيد عن 5000 حرف'
    }),
    category: Joi.string()
      .valid('general_inquiry', 'product_inquiry', 'support', 'complaint', 'suggestion', 'partnership')
      .default('general_inquiry'),
    priority: Joi.string()
      .valid('low', 'normal', 'high', 'urgent')
      .default('normal'),
    page: Joi.string().optional()
  }),

  params: Joi.object({
    id: objectId.required()
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    category: Joi.string()
      .valid('general', 'product_inquiry', 'order_support', 'partnership', 'complaint'),
    isRead: Joi.boolean(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    sort: Joi.string().valid('createdAt', '-createdAt').default('-createdAt')
  }),

  markAsRead: Joi.object({
    isRead: Joi.boolean().required()
  })
};

// File upload validation
const fileSchemas = {
  image: Joi.object({
    mimetype: Joi.string()
      .valid('image/jpeg', 'image/jpg', 'image/png', 'image/webp')
      .required()
      .messages({
        'any.only': 'Only JPEG, PNG, and WebP images are allowed'
      }),
    size: Joi.number()
      .max(5 * 1024 * 1024) // 5MB
      .required()
      .messages({
        'number.max': 'File size must not exceed 5MB'
      })
  })
};

module.exports = {
  authSchemas,
  productSchemas,
  contentSchemas,
  mediaSchemas,
  orderSchemas,
  sampleSchemas,
  contactSchemas,
  fileSchemas,
  // Common patterns for reuse
  objectId,
  email,
  password,
  phone,
  url,
  multilingualText,
  multilingualTextOptional,
  multilingualArray
};