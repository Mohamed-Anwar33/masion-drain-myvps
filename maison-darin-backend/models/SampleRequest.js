const mongoose = require('mongoose');

const sampleRequestSchema = new mongoose.Schema({
  // Customer Information
  customerInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
        maxlength: [200, 'Street address cannot exceed 200 characters']
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters']
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
        maxlength: [20, 'Postal code cannot exceed 20 characters']
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        maxlength: [100, 'Country cannot exceed 100 characters']
      }
    }
  },

  // Requested Products
  requestedProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    productName: {
      en: { type: String, required: true },
      ar: { type: String, required: true }
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [5, 'Maximum 5 samples per product allowed']
    },
    sampleSize: {
      type: String,
      enum: ['1ml', '2ml', '5ml'],
      default: '2ml'
    }
  }],

  // Request Details
  requestNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'shipped', 'delivered'],
    default: 'pending'
  },

  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },

  // Additional Information
  message: {
    type: String,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    trim: true
  },

  preferredLanguage: {
    type: String,
    enum: ['en', 'ar'],
    default: 'en'
  },

  // Admin Notes and Processing
  adminNotes: [{
    note: {
      type: String,
      required: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status History
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      maxlength: [200, 'Reason cannot exceed 200 characters']
    }
  }],

  // Shipping Information (when approved)
  shippingInfo: {
    trackingNumber: {
      type: String,
      trim: true
    },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard'
    },
    estimatedDelivery: {
      type: Date
    },
    shippedAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    }
  },

  // Duplicate Prevention
  duplicateCheckHash: {
    type: String,
    index: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Indexes for performance
sampleRequestSchema.index({ 'customerInfo.email': 1, createdAt: -1 });
sampleRequestSchema.index({ status: 1, createdAt: -1 });
sampleRequestSchema.index({ createdAt: -1 });

// Pre-save middleware to generate request number
sampleRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate unique request number
    const count = await this.constructor.countDocuments();
    this.requestNumber = `SR${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
    
    // Generate duplicate check hash
    this.duplicateCheckHash = this.generateDuplicateHash();
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  
  this.updatedAt = new Date();
  next();
});

// Instance Methods
sampleRequestSchema.methods.generateDuplicateHash = function() {
  const crypto = require('crypto');
  const productIds = this.requestedProducts.map(p => p.product.toString()).sort().join(',');
  const hashString = `${this.customerInfo.email}:${productIds}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
};

sampleRequestSchema.methods.updateStatus = function(newStatus, userId, reason) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    reason: reason
  });
  
  // Update shipping timestamps based on status
  if (newStatus === 'shipped' && !this.shippingInfo.shippedAt) {
    this.shippingInfo.shippedAt = new Date();
  } else if (newStatus === 'delivered' && !this.shippingInfo.deliveredAt) {
    this.shippingInfo.deliveredAt = new Date();
  }
  
  return this.save();
};

sampleRequestSchema.methods.addAdminNote = function(note, userId) {
  this.adminNotes.push({
    note: note,
    addedBy: userId,
    addedAt: new Date()
  });
  return this.save();
};

sampleRequestSchema.methods.checkForDuplicates = async function() {
  const duplicateHash = this.generateDuplicateHash();
  
  // Check for recent requests (within last 30 days) with same hash
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const existingRequest = await this.constructor.findOne({
    duplicateCheckHash: duplicateHash,
    createdAt: { $gte: thirtyDaysAgo },
    isDeleted: false,
    _id: { $ne: this._id }
  });
  
  return existingRequest;
};

// Static Methods
sampleRequestSchema.statics.findByEmail = function(email, options = {}) {
  const query = {
    'customerInfo.email': email.toLowerCase(),
    isDeleted: false
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateRange) {
    query.createdAt = {
      $gte: options.dateRange.start,
      $lte: options.dateRange.end
    };
  }
  
  return this.find(query)
    .populate('requestedProducts.product', 'name price category')
    .sort({ createdAt: -1 });
};

sampleRequestSchema.statics.findByStatus = function(status, options = {}) {
  const query = { status, isDeleted: false };
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  return this.find(query)
    .populate('requestedProducts.product', 'name price category images')
    .populate('adminNotes.addedBy', 'email')
    .populate('statusHistory.changedBy', 'email')
    .sort({ createdAt: -1 });
};

sampleRequestSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: {
          $avg: {
            $subtract: ['$updatedAt', '$createdAt']
          }
        }
      }
    }
  ]);
  
  const totalRequests = await this.countDocuments({ isDeleted: false });
  
  return {
    totalRequests,
    byStatus: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgProcessingTime: stat.avgProcessingTime
      };
      return acc;
    }, {})
  };
};

// Virtual for total requested samples
sampleRequestSchema.virtual('totalSamples').get(function() {
  return this.requestedProducts.reduce((total, product) => total + product.quantity, 0);
});

// Virtual for processing time
sampleRequestSchema.virtual('processingTime').get(function() {
  if (this.status === 'pending') return null;
  
  const lastStatusChange = this.statusHistory[this.statusHistory.length - 1];
  return lastStatusChange ? lastStatusChange.changedAt - this.createdAt : null;
});

// Ensure virtuals are included in JSON output
sampleRequestSchema.set('toJSON', { virtuals: true });
sampleRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SampleRequest', sampleRequestSchema);