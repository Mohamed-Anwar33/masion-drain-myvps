const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        return /^[a-zA-Z\u0600-\u06FF\s]+$/.test(value);
      },
      message: 'First name can only contain letters and spaces'
    }
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        return /^[a-zA-Z\u0600-\u06FF\s]+$/.test(value);
      },
      message: 'Last name can only contain letters and spaces'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(value) {
        // Support international phone formats
        return /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid phone number'
    }
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
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
      maxlength: [50, 'Country cannot exceed 50 characters']
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return value < new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    lowercase: true
  },
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    },
    favoriteCategories: [{
      type: String,
      trim: true
    }]
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points cannot be negative']
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  lastOrderDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active',
    lowercase: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one default address per customer
customerSchema.pre('save', function(next) {
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // Keep only the first default address
      this.addresses.forEach((addr, index) => {
        if (index > 0 && addr.isDefault) {
          addr.isDefault = false;
        }
      });
    } else if (defaultAddresses.length === 0 && this.addresses.length > 0) {
      // Set first address as default if no default is set
      this.addresses[0].isDefault = true;
    }
  }
  next();
});

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for default address
customerSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Virtual for customer tier based on total spent
customerSchema.virtual('tier').get(function() {
  if (this.totalSpent >= 10000) return 'platinum';
  if (this.totalSpent >= 5000) return 'gold';
  if (this.totalSpent >= 1000) return 'silver';
  return 'bronze';
});

// Virtual for customer lifetime value
customerSchema.virtual('lifetimeValue').get(function() {
  return {
    totalSpent: this.totalSpent,
    averageOrderValue: this.totalOrders > 0 ? this.totalSpent / this.totalOrders : 0,
    totalOrders: this.totalOrders,
    loyaltyPoints: this.loyaltyPoints
  };
});

// Static method to find customers with filters
customerSchema.statics.findWithFilters = function(filters = {}) {
  const query = {};
  
  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }
  
  // Search filter (name or email)
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ];
  }
  
  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.createdAt.$lte = new Date(filters.endDate);
    }
  }
  
  // Tier filter
  if (filters.tier) {
    const tierRanges = {
      bronze: { min: 0, max: 999 },
      silver: { min: 1000, max: 4999 },
      gold: { min: 5000, max: 9999 },
      platinum: { min: 10000, max: Infinity }
    };
    
    const range = tierRanges[filters.tier];
    if (range) {
      query.totalSpent = { $gte: range.min };
      if (range.max !== Infinity) {
        query.totalSpent.$lte = range.max;
      }
    }
  }
  
  return this.find(query);
};

// Static method to get customer statistics
customerSchema.statics.getCustomerStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) {
      matchStage.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      matchStage.createdAt.$lte = new Date(filters.endDate);
    }
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalRevenue: { $sum: '$totalSpent' },
        totalOrders: { $sum: '$totalOrders' },
        averageOrderValue: { $avg: '$totalSpent' },
        averageOrdersPerCustomer: { $avg: '$totalOrders' }
      }
    },
    {
      $project: {
        _id: 0,
        totalCustomers: 1,
        activeCustomers: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        totalOrders: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        averageOrdersPerCustomer: { $round: ['$averageOrdersPerCustomer', 2] }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    averageOrdersPerCustomer: 0
  };
};

// Instance method to update customer statistics
customerSchema.methods.updateStats = async function(orderData) {
  this.totalOrders += 1;
  this.totalSpent += orderData.total;
  this.lastOrderDate = new Date();
  
  // Award loyalty points (1 point per EGP spent)
  this.loyaltyPoints += Math.floor(orderData.total);
  
  return await this.save();
};

// Instance method to add address
customerSchema.methods.addAddress = function(addressData) {
  // If this is the first address or marked as default, set as default
  if (this.addresses.length === 0 || addressData.isDefault) {
    // Remove default from other addresses
    this.addresses.forEach(addr => {
      addr.isDefault = false;
    });
    addressData.isDefault = true;
  }
  
  this.addresses.push(addressData);
  return this.save();
};

// Instance method to update address
customerSchema.methods.updateAddress = function(addressId, addressData) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  // If setting as default, remove default from others
  if (addressData.isDefault) {
    this.addresses.forEach(addr => {
      if (addr._id.toString() !== addressId) {
        addr.isDefault = false;
      }
    });
  }
  
  Object.assign(address, addressData);
  return this.save();
};

// Instance method to remove address
customerSchema.methods.removeAddress = function(addressId) {
  const address = this.addresses.id(addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  const wasDefault = address.isDefault;
  this.addresses.pull(addressId);
  
  // If removed address was default, set first remaining as default
  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }
  
  return this.save();
};

// Indexes for better query performance
customerSchema.index({ email: 1 }, { unique: true });
customerSchema.index({ status: 1 });
customerSchema.index({ createdAt: -1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ totalOrders: -1 });
customerSchema.index({ firstName: 1, lastName: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;