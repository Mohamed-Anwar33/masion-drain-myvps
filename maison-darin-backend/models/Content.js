const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: {
      values: ['hero', 'about', 'nav', 'contact', 'collections', 'footer'],
      message: 'Section must be one of: hero, about, nav, contact, collections, footer'
    },
    index: true
  },
  content: {
    en: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'English content is required'],
      validate: {
        validator: function(value) {
          return value && typeof value === 'object';
        },
        message: 'English content must be a valid object'
      }
    },
    ar: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Arabic content is required'],
      validate: {
        validator: function(value) {
          return value && typeof value === 'object';
        },
        message: 'Arabic content must be a valid object'
      }
    }
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by user is required']
  },
  changeLog: {
    type: String,
    maxlength: [500, 'Change log cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient queries
contentSchema.index({ section: 1, isActive: 1 });
contentSchema.index({ section: 1, version: -1 });

// Pre-save middleware to update version and timestamp
contentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.version += 1;
  }
  this.updatedAt = new Date();
  next();
});

// Static method to get latest active content by section
contentSchema.statics.getLatestBySection = function(section) {
  return this.findOne({ 
    section, 
    isActive: true 
  }).sort({ version: -1 });
};

// Static method to get content history for a section
contentSchema.statics.getHistory = function(section, limit = 10) {
  return this.find({ section })
    .sort({ version: -1 })
    .limit(limit)
    .populate('updatedBy', 'email')
    .select('version isActive updatedAt updatedBy changeLog');
};

// Static method to create new version
contentSchema.statics.createVersion = function(section, content, updatedBy, changeLog) {
  // First, deactivate all previous versions
  return this.updateMany(
    { section },
    { isActive: false }
  ).then(() => {
    // Create new active version
    return this.create({
      section,
      content,
      updatedBy,
      changeLog,
      isActive: true
    });
  });
};

// Instance method to rollback to this version
contentSchema.methods.rollback = function(updatedBy, changeLog = 'Rolled back to previous version') {
  const Content = this.constructor;
  
  return Content.updateMany(
    { section: this.section },
    { isActive: false }
  ).then(() => {
    return Content.create({
      section: this.section,
      content: this.content,
      updatedBy,
      changeLog,
      isActive: true
    });
  });
};

// Virtual for formatted update date
contentSchema.virtual('formattedUpdatedAt').get(function() {
  return this.updatedAt.toISOString();
});

// Method to validate content structure based on section
contentSchema.methods.validateContentStructure = function() {
  const sectionValidators = {
    hero: (content) => {
      if (!content) return false;
      const required = ['title', 'subtitle', 'buttonText'];
      return required.every(field => content[field]);
    },
    about: (content) => {
      if (!content) return false;
      const required = ['title', 'description'];
      return required.every(field => content[field]);
    },
    nav: (content) => {
      if (!content) return false;
      return content.items && Array.isArray(content.items);
    },
    contact: (content) => {
      if (!content) return false;
      const required = ['title', 'address', 'phone', 'email'];
      return required.every(field => content[field]);
    },
    collections: (content) => {
      if (!content) return false;
      return Boolean(content.title && content.description);
    },
    footer: (content) => {
      if (!content) return false;
      const required = ['copyright', 'links'];
      return required.every(field => content[field]);
    }
  };

  const validator = sectionValidators[this.section];
  if (!validator) return true;

  const enValid = validator(this.content.en);
  const arValid = validator(this.content.ar);

  return Boolean(enValid && arValid);
};

// Pre-validate hook to check content structure
contentSchema.pre('validate', function(next) {
  if (!this.validateContentStructure()) {
    return next(new Error(`Invalid content structure for section: ${this.section}`));
  }
  next();
});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;