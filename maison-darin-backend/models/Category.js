const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, 'English name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    ar: {
      type: String,
      required: [true, 'Arabic name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    }
  },
  description: {
    en: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    ar: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    url: String,
    cloudinaryId: String,
    alt: {
      en: String,
      ar: String
    }
  },
  seo: {
    metaTitle: {
      en: String,
      ar: String
    },
    metaDescription: {
      en: String,
      ar: String
    }
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for product count
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Index for better performance
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ 'name.en': 'text', 'name.ar': 'text' });

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name.en') && !this.slug) {
    this.slug = this.name.en
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Static method to get active categories
categorySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, 'name.en': 1 });
};

// Static method to get category with product count
categorySchema.statics.getWithProductCount = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'category',
        as: 'products'
      }
    },
    {
      $addFields: {
        productCount: { $size: '$products' },
        activeProductCount: {
          $size: {
            $filter: {
              input: '$products',
              cond: { $and: [{ $eq: ['$$this.isActive', true] }, { $eq: ['$$this.inStock', true] }] }
            }
          }
        }
      }
    },
    {
      $project: {
        products: 0
      }
    },
    {
      $sort: { sortOrder: 1, 'name.en': 1 }
    }
  ]);
};

// Instance method to get products in this category
categorySchema.methods.getProducts = function(options = {}) {
  const Product = mongoose.model('Product');
  const query = { category: this._id };
  
  if (options.inStock) {
    query.inStock = true;
  }
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  return Product.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0);
};

// Instance method to update product count cache
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: this._id });
  this.productCount = count;
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema);