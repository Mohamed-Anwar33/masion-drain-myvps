const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Payment method name is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    ar: {
      type: String,
      required: [true, 'Arabic display name is required'],
      trim: true
    },
    en: {
      type: String,
      required: [true, 'English display name is required'],
      trim: true
    }
  },
  type: {
    type: String,
    required: [true, 'Payment method type is required'],
    enum: {
      values: ['card', 'mobile_wallet', 'bank_transfer', 'cash', 'digital_wallet'],
      message: 'Payment method type must be one of: card, mobile_wallet, bank_transfer, cash, digital_wallet'
    }
  },
  provider: {
    type: String,
    required: [true, 'Payment provider is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  configuration: {
    // Gateway specific configuration
    apiKey: {
      type: String,
      trim: true
    },
    secretKey: {
      type: String,
      trim: true
    },
    merchantId: {
      type: String,
      trim: true
    },
    webhookUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return /^https?:\/\/.+/.test(value);
        },
        message: 'Webhook URL must be a valid HTTP/HTTPS URL'
      }
    },
    // Environment settings
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox'
    },
    // Currency support
    supportedCurrencies: [{
      type: String,
      uppercase: true,
      enum: ['EGP', 'USD', 'EUR']
    }],
    // Minimum and maximum amounts
    minAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum amount cannot be negative']
    },
    maxAmount: {
      type: Number,
      default: 100000,
      min: [0, 'Maximum amount cannot be negative']
    }
  },
  fees: {
    // Fixed fee per transaction
    fixedFee: {
      type: Number,
      default: 0,
      min: [0, 'Fixed fee cannot be negative']
    },
    // Percentage fee
    percentageFee: {
      type: Number,
      default: 0,
      min: [0, 'Percentage fee cannot be negative'],
      max: [100, 'Percentage fee cannot exceed 100%']
    },
    // Currency for fixed fee
    feeCurrency: {
      type: String,
      default: 'EGP',
      enum: ['EGP', 'USD', 'EUR']
    }
  },
  // UI configuration
  ui: {
    icon: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return /^#[0-9A-F]{6}$/i.test(value);
        },
        message: 'Color must be a valid hex color code'
      }
    },
    description: {
      ar: {
        type: String,
        trim: true
      },
      en: {
        type: String,
        trim: true
      }
    },
    instructions: {
      ar: {
        type: String,
        trim: true
      },
      en: {
        type: String,
        trim: true
      }
    },
    // Display order in payment methods list
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  // Validation rules
  validation: {
    // Required fields for this payment method
    requiredFields: [{
      type: String,
      enum: ['cardNumber', 'expiryDate', 'cvv', 'cardholderName', 'phoneNumber', 'bankAccount', 'routingNumber', 'bankReference']
    }],
    // Custom validation patterns
    patterns: {
      phoneNumber: {
        type: String,
        default: '^01[0-9]{9}$' // Egyptian mobile number pattern
      },
      cardNumber: {
        type: String,
        default: '^[0-9]{13,19}$'
      }
    }
  },
  // Processing settings
  processing: {
    // Auto-capture or manual capture
    autoCapture: {
      type: Boolean,
      default: true
    },
    // Payment timeout in minutes
    timeoutMinutes: {
      type: Number,
      default: 30,
      min: [1, 'Timeout must be at least 1 minute'],
      max: [10080, 'Timeout cannot exceed 7 days']
    },
    // Retry settings
    maxRetries: {
      type: Number,
      default: 3,
      min: [0, 'Max retries cannot be negative'],
      max: [10, 'Max retries cannot exceed 10']
    },
    // Refund support
    supportsRefunds: {
      type: Boolean,
      default: true
    },
    // Partial refund support
    supportsPartialRefunds: {
      type: Boolean,
      default: true
    }
  },
  // Statistics
  statistics: {
    totalTransactions: {
      type: Number,
      default: 0
    },
    successfulTransactions: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    lastUsed: Date
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
paymentMethodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for success rate
paymentMethodSchema.virtual('successRate').get(function() {
  if (this.statistics.totalTransactions === 0) return 0;
  return (this.statistics.successfulTransactions / this.statistics.totalTransactions) * 100;
});

// Static method to get active payment methods
paymentMethodSchema.statics.getActivePaymentMethods = function(currency = 'EGP') {
  return this.find({
    isActive: true,
    'configuration.supportedCurrencies': currency
  }).sort({ 'ui.sortOrder': 1 });
};

// Static method to get payment method by name
paymentMethodSchema.statics.getByName = function(name) {
  return this.findOne({ name: name.toLowerCase(), isActive: true });
};

// Instance method to calculate fees for an amount
paymentMethodSchema.methods.calculateFees = function(amount, currency = 'EGP') {
  let fees = 0;
  
  // Add fixed fee
  if (this.fees.fixedFee > 0) {
    if (this.fees.feeCurrency === currency) {
      fees += this.fees.fixedFee;
    } else {
      // TODO: Implement currency conversion
      fees += this.fees.fixedFee;
    }
  }
  
  // Add percentage fee
  if (this.fees.percentageFee > 0) {
    fees += (amount * this.fees.percentageFee) / 100;
  }
  
  return Math.round(fees * 100) / 100; // Round to 2 decimal places
};

// Instance method to validate amount
paymentMethodSchema.methods.validateAmount = function(amount) {
  if (amount < this.configuration.minAmount) {
    return {
      valid: false,
      error: `Amount must be at least ${this.configuration.minAmount} ${this.configuration.supportedCurrencies[0]}`
    };
  }
  
  if (amount > this.configuration.maxAmount) {
    return {
      valid: false,
      error: `Amount cannot exceed ${this.configuration.maxAmount} ${this.configuration.supportedCurrencies[0]}`
    };
  }
  
  return { valid: true };
};

// Instance method to update statistics
paymentMethodSchema.methods.updateStatistics = async function(amount, success = true) {
  this.statistics.totalTransactions += 1;
  this.statistics.totalAmount += amount;
  this.statistics.lastUsed = new Date();
  
  if (success) {
    this.statistics.successfulTransactions += 1;
  }
  
  return await this.save();
};

// Instance method to check if method supports currency
paymentMethodSchema.methods.supportsCurrency = function(currency) {
  return this.configuration.supportedCurrencies.includes(currency.toUpperCase());
};

// Instance method to get display name by language
paymentMethodSchema.methods.getDisplayName = function(language = 'ar') {
  return this.displayName[language] || this.displayName.en;
};

// Instance method to get description by language
paymentMethodSchema.methods.getDescription = function(language = 'ar') {
  return this.ui.description[language] || this.ui.description.en || '';
};

// Instance method to get instructions by language
paymentMethodSchema.methods.getInstructions = function(language = 'ar') {
  return this.ui.instructions[language] || this.ui.instructions.en || '';
};

// Indexes for better query performance
paymentMethodSchema.index({ name: 1 }, { unique: true });
paymentMethodSchema.index({ isActive: 1 });
paymentMethodSchema.index({ type: 1 });
paymentMethodSchema.index({ 'ui.sortOrder': 1 });
paymentMethodSchema.index({ 'configuration.supportedCurrencies': 1 });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;