const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, 'English name is required'],
      trim: true,
      maxlength: [200, 'English name cannot exceed 200 characters']
    },
    ar: {
      type: String,
      required: [true, 'Arabic name is required'],
      trim: true,
      maxlength: [200, 'Arabic name cannot exceed 200 characters']
    }
  },
  description: {
    en: {
      type: String,
      required: [true, 'English description is required'],
      trim: true,
      maxlength: [1000, 'English description cannot exceed 1000 characters']
    },
    ar: {
      type: String,
      required: [true, 'Arabic description is required'],
      trim: true,
      maxlength: [1000, 'Arabic description cannot exceed 1000 characters']
    }
  },
  longDescription: {
    en: {
      type: String,
      trim: true,
      maxlength: [5000, 'English long description cannot exceed 5000 characters']
    },
    ar: {
      type: String,
      trim: true,
      maxlength: [5000, 'Arabic long description cannot exceed 5000 characters']
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    trim: true,
    validate: {
      validator: function(value) {
        // Validate size format (e.g., "50ml", "100ml", "3.4oz")
        return /^\d+(\.\d+)?(ml|oz|g)$/i.test(value);
      },
      message: 'Size must be in format like "50ml", "100ml", or "3.4oz"'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand'],
      message: 'Category must be one of: floral, oriental, fresh, woody, citrus, spicy, aquatic, gourmand'
    },
    lowercase: true
  },
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    cloudinaryId: {
      type: String,
      required: [true, 'Cloudinary ID is required']
    },
    alt: {
      en: {
        type: String,
        trim: true,
        maxlength: [200, 'English alt text cannot exceed 200 characters']
      },
      ar: {
        type: String,
        trim: true,
        maxlength: [200, 'Arabic alt text cannot exceed 200 characters']
      }
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Image order cannot be negative']
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 0;
      },
      message: 'Stock must be a non-negative integer'
    }
  },
  concentration: {
    en: {
      type: String,
      trim: true,
      maxlength: [100, 'English concentration cannot exceed 100 characters']
    },
    ar: {
      type: String,
      trim: true,
      maxlength: [100, 'Arabic concentration cannot exceed 100 characters']
    }
  },
  notes: {
    top: {
      en: [{
        type: String,
        trim: true,
        maxlength: [100, 'English top note cannot exceed 100 characters']
      }],
      ar: [{
        type: String,
        trim: true,
        maxlength: [100, 'Arabic top note cannot exceed 100 characters']
      }]
    },
    middle: {
      en: [{
        type: String,
        trim: true,
        maxlength: [100, 'English middle note cannot exceed 100 characters']
      }],
      ar: [{
        type: String,
        trim: true,
        maxlength: [100, 'Arabic middle note cannot exceed 100 characters']
      }]
    },
    base: {
      en: [{
        type: String,
        trim: true,
        maxlength: [100, 'English base note cannot exceed 100 characters']
      }],
      ar: [{
        type: String,
        trim: true,
        maxlength: [100, 'Arabic base note cannot exceed 100 characters']
      }]
    }
  },
  seo: {
    metaTitle: {
      en: {
        type: String,
        trim: true,
        maxlength: [60, 'English meta title cannot exceed 60 characters']
      },
      ar: {
        type: String,
        trim: true,
        maxlength: [60, 'Arabic meta title cannot exceed 60 characters']
      }
    },
    metaDescription: {
      en: {
        type: String,
        trim: true,
        maxlength: [160, 'English meta description cannot exceed 160 characters']
      },
      ar: {
        type: String,
        trim: true,
        maxlength: [160, 'Arabic meta description cannot exceed 160 characters']
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that inStock matches stock availability
productSchema.pre('save', function(next) {
  if (this.stock === 0) {
    this.inStock = false;
  }
  next();
});

// Instance method to update stock
productSchema.methods.updateStock = async function(quantity) {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
    throw new Error('Quantity must be an integer');
  }
  
  const newStock = this.stock + quantity;
  if (newStock < 0) {
    throw new Error('Insufficient stock');
  }
  
  this.stock = newStock;
  this.inStock = newStock > 0;
  return await this.save();
};

// Instance method to check availability
productSchema.methods.isAvailable = function(quantity = 1) {
  return this.inStock && this.stock >= quantity;
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category: category.toLowerCase() });
};

// Static method to find featured products
productSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ featured: true, inStock: true })
    .limit(limit)
    .sort({ createdAt: -1 });
};

// Static method to search products in both languages
productSchema.statics.searchProducts = function(query, language = 'en') {
  const searchRegex = new RegExp(query, 'i');
  
  if (language === 'ar') {
    return this.find({
      $or: [
        { 'name.ar': searchRegex },
        { 'description.ar': searchRegex },
        { 'longDescription.ar': searchRegex }
      ]
    });
  } else {
    return this.find({
      $or: [
        { 'name.en': searchRegex },
        { 'description.en': searchRegex },
        { 'longDescription.en': searchRegex }
      ]
    });
  }
};

// Static method to find products with filters
productSchema.statics.findWithFilters = function(filters = {}) {
  const query = {};
  
  // Category filter
  if (filters.category) {
    query.category = filters.category.toLowerCase();
  }
  
  // Price range filter
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== undefined) {
      query.price.$gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      query.price.$lte = filters.maxPrice;
    }
  }
  
  // Availability filter
  if (filters.inStock !== undefined) {
    query.inStock = filters.inStock;
  }
  
  // Featured filter
  if (filters.featured !== undefined) {
    query.featured = filters.featured;
  }
  
  return this.find(query);
};

// Static method to get all categories with translations
productSchema.statics.getCategories = function() {
  const categories = [
    {
      value: 'floral',
      label: {
        en: 'Floral',
        ar: 'زهري'
      }
    },
    {
      value: 'oriental',
      label: {
        en: 'Oriental',
        ar: 'شرقي'
      }
    },
    {
      value: 'fresh',
      label: {
        en: 'Fresh',
        ar: 'منعش'
      }
    },
    {
      value: 'woody',
      label: {
        en: 'Woody',
        ar: 'خشبي'
      }
    },
    {
      value: 'citrus',
      label: {
        en: 'Citrus',
        ar: 'حمضي'
      }
    },
    {
      value: 'spicy',
      label: {
        en: 'Spicy',
        ar: 'حار'
      }
    },
    {
      value: 'aquatic',
      label: {
        en: 'Aquatic',
        ar: 'مائي'
      }
    },
    {
      value: 'gourmand',
      label: {
        en: 'Gourmand',
        ar: 'حلو'
      }
    }
  ];
  
  return Promise.resolve(categories);
};

// Indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'name.en': 'text', 'description.en': 'text', 'longDescription.en': 'text' });
productSchema.index({ 'name.ar': 'text', 'description.ar': 'text', 'longDescription.ar': 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;