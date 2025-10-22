const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  // Original file information
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  
  // Cloudinary information
  cloudinaryUrl: {
    type: String,
    required: [true, 'Cloudinary URL is required'],
    validate: {
      validator: function(url) {
        return /^https:\/\/res\.cloudinary\.com\//.test(url);
      },
      message: 'Invalid Cloudinary URL format'
    }
  },
  cloudinaryId: {
    type: String,
    required: [true, 'Cloudinary public ID is required'],
    trim: true
  },
  
  // File metadata
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: {
      values: ['image/jpeg', 'image/png', 'image/webp'],
      message: 'Only JPEG, PNG, and WebP images are allowed'
    }
  },
  
  // Image dimensions
  width: {
    type: Number,
    min: [1, 'Width must be positive'],
    validate: {
      validator: Number.isInteger,
      message: 'Width must be an integer'
    }
  },
  height: {
    type: Number,
    min: [1, 'Height must be positive'],
    validate: {
      validator: Number.isInteger,
      message: 'Height must be an integer'
    }
  },
  
  // Organization and metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Multilingual alt text
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
  
  // Usage tracking
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  
  // Optimization variants URLs
  variants: {
    thumbnail: {
      type: String,
      validate: {
        validator: function(url) {
          return !url || /^https:\/\/res\.cloudinary\.com\//.test(url);
        },
        message: 'Invalid thumbnail URL format'
      }
    },
    medium: {
      type: String,
      validate: {
        validator: function(url) {
          return !url || /^https:\/\/res\.cloudinary\.com\//.test(url);
        },
        message: 'Invalid medium URL format'
      }
    },
    large: {
      type: String,
      validate: {
        validator: function(url) {
          return !url || /^https:\/\/res\.cloudinary\.com\//.test(url);
        },
        message: 'Invalid large URL format'
      }
    },
    extraLarge: {
      type: String,
      validate: {
        validator: function(url) {
          return !url || /^https:\/\/res\.cloudinary\.com\//.test(url);
        },
        message: 'Invalid extra large URL format'
      }
    }
  },
  
  // Upload information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  // Status and flags
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
mediaSchema.index({ cloudinaryId: 1 }, { unique: true });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ uploadedAt: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ mimetype: 1 });
mediaSchema.index({ isActive: 1 });
mediaSchema.index({ 'alt.en': 'text', 'alt.ar': 'text' });

// Virtual for file size in human readable format
mediaSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for aspect ratio
mediaSchema.virtual('aspectRatio').get(function() {
  if (!this.width || !this.height) return null;
  return (this.width / this.height).toFixed(2);
});

// Pre-save middleware to update timestamps
mediaSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-save validation for image dimensions
mediaSchema.pre('save', function(next) {
  if (this.mimetype && this.mimetype.startsWith('image/')) {
    if (!this.width || !this.height) {
      return next(new Error('Width and height are required for images'));
    }
  }
  next();
});

// Static method to find by Cloudinary ID
mediaSchema.statics.findByCloudinaryId = function(cloudinaryId) {
  return this.findOne({ cloudinaryId, isActive: true });
};

// Static method to find by uploader
mediaSchema.statics.findByUploader = function(uploaderId, options = {}) {
  const query = { uploadedBy: uploaderId, isActive: true };
  
  if (options.mimetype) {
    query.mimetype = options.mimetype;
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  return this.find(query)
    .sort({ uploadedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to search media
mediaSchema.statics.searchMedia = function(searchTerm, options = {}) {
  const query = { isActive: true };
  
  if (searchTerm) {
    query.$or = [
      { filename: { $regex: searchTerm, $options: 'i' } },
      { originalName: { $regex: searchTerm, $options: 'i' } },
      { 'alt.en': { $regex: searchTerm, $options: 'i' } },
      { 'alt.ar': { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ];
  }
  
  if (options.mimetype) {
    query.mimetype = options.mimetype;
  }
  
  if (options.uploadedBy) {
    query.uploadedBy = options.uploadedBy;
  }
  
  return this.find(query)
    .populate('uploadedBy', 'email')
    .sort({ uploadedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Instance method to increment usage count
mediaSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Instance method to add tags
mediaSchema.methods.addTags = function(newTags) {
  if (!Array.isArray(newTags)) {
    newTags = [newTags];
  }
  
  const uniqueTags = [...new Set([...this.tags, ...newTags.map(tag => tag.toLowerCase().trim())])];
  this.tags = uniqueTags;
  return this.save();
};

// Instance method to remove tags
mediaSchema.methods.removeTags = function(tagsToRemove) {
  if (!Array.isArray(tagsToRemove)) {
    tagsToRemove = [tagsToRemove];
  }
  
  this.tags = this.tags.filter(tag => !tagsToRemove.includes(tag));
  return this.save();
};

// Instance method to soft delete
mediaSchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to get optimized URL for specific size
mediaSchema.methods.getOptimizedUrl = function(size = 'medium') {
  const validSizes = ['thumbnail', 'medium', 'large', 'extraLarge'];
  
  if (!validSizes.includes(size)) {
    return this.cloudinaryUrl;
  }
  
  return this.variants[size] || this.cloudinaryUrl;
};

// Instance method to update alt text
mediaSchema.methods.updateAltText = function(altText) {
  if (altText.en) {
    this.alt.en = altText.en;
  }
  if (altText.ar) {
    this.alt.ar = altText.ar;
  }
  return this.save();
};

// Validation for at least one alt text
mediaSchema.pre('validate', function(next) {
  if (!this.alt.en && !this.alt.ar) {
    return next(new Error('At least one alt text (English or Arabic) is required'));
  }
  next();
});

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;