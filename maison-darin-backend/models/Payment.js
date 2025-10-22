const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: [true, 'Payment ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order reference is required']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer reference is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Amount must be a valid positive number'
    }
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: {
      values: ['EGP', 'USD', 'EUR'],
      message: 'Currency must be one of: EGP, USD, EUR'
    },
    default: 'EGP',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['visa', 'mastercard', 'vodafone_cash', 'cash_on_delivery', 'bank_transfer'],
      message: 'Payment method must be one of: visa, mastercard, vodafone_cash, cash_on_delivery, bank_transfer'
    },
    lowercase: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: {
      values: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      message: 'Payment status must be one of: pending, processing, completed, failed, cancelled, refunded, partially_refunded'
    },
    lowercase: true
  },
  // Encrypted payment details
  paymentDetails: {
    // For card payments
    cardLast4: {
      type: String,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return /^\d{4}$/.test(value);
        },
        message: 'Card last 4 digits must be exactly 4 digits'
      }
    },
    cardType: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover'],
      lowercase: true
    },
    // For Vodafone Cash
    vodafoneNumber: {
      type: String,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return /^01[0-9]{9}$/.test(value);
        },
        message: 'Vodafone number must be a valid Egyptian mobile number'
      }
    },
    // For bank transfer
    bankReference: {
      type: String,
      trim: true,
      maxlength: [50, 'Bank reference cannot exceed 50 characters']
    },
    // Gateway transaction ID
    gatewayTransactionId: {
      type: String,
      trim: true,
      maxlength: [100, 'Gateway transaction ID cannot exceed 100 characters']
    }
  },
  // Payment gateway information
  gateway: {
    provider: {
      type: String,
      enum: ['paymob', 'fawry', 'paypal', 'stripe', 'internal'],
      default: 'internal'
    },
    transactionId: {
      type: String,
      trim: true
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed // Store gateway response data
    }
  },
  // Fees and charges
  fees: {
    gatewayFee: {
      type: Number,
      default: 0,
      min: [0, 'Gateway fee cannot be negative']
    },
    processingFee: {
      type: Number,
      default: 0,
      min: [0, 'Processing fee cannot be negative']
    },
    totalFees: {
      type: Number,
      default: 0,
      min: [0, 'Total fees cannot be negative']
    }
  },
  // Refund information
  refunds: [{
    refundId: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Refund amount cannot be negative']
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Refund reason cannot exceed 200 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    processedAt: Date,
    gatewayRefundId: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Payment attempts and retries
  attempts: [{
    attemptNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      required: true
    },
    errorCode: String,
    errorMessage: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    attemptedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Security and audit
  ipAddress: {
    type: String,
    validate: {
      validator: function(value) {
        if (!value) return true;
        // Basic IP validation (IPv4 and IPv6)
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(value);
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      // Payment expires in 30 minutes by default
      return new Date(Date.now() + 30 * 60 * 1000);
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
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total fees before saving
paymentSchema.pre('save', function(next) {
  if (this.fees) {
    this.fees.totalFees = (this.fees.gatewayFee || 0) + (this.fees.processingFee || 0);
  }
  next();
});

// Static method to generate unique payment ID
paymentSchema.statics.generatePaymentId = async function() {
  const prefix = 'PAY';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  let paymentId = `${prefix}${timestamp}${random}`;
  
  // Ensure uniqueness
  let counter = 0;
  while (await this.findOne({ paymentId })) {
    counter++;
    paymentId = `${prefix}${timestamp}${random}${counter.toString().padStart(2, '0')}`;
    
    if (counter > 99) {
      throw new Error('Unable to generate unique payment ID');
    }
  }
  
  return paymentId;
};

// Static method to find payments with filters
paymentSchema.statics.findWithFilters = function(filters = {}) {
  const query = {};
  
  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }
  
  // Payment method filter
  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
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
  
  // Amount range filter
  if (filters.minAmount || filters.maxAmount) {
    query.amount = {};
    if (filters.minAmount) {
      query.amount.$gte = filters.minAmount;
    }
    if (filters.maxAmount) {
      query.amount.$lte = filters.maxAmount;
    }
  }
  
  // Customer filter
  if (filters.customerId) {
    query.customer = filters.customerId;
  }
  
  // Order filter
  if (filters.orderId) {
    query.order = filters.orderId;
  }
  
  return this.find(query);
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(filters = {}) {
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
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        completedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        refundedAmount: {
          $sum: { $cond: [{ $in: ['$status', ['refunded', 'partially_refunded']] }, '$amount', 0] }
        },
        averageAmount: { $avg: '$amount' },
        paymentMethods: { $push: '$paymentMethod' }
      }
    },
    {
      $project: {
        _id: 0,
        totalPayments: 1,
        totalAmount: { $round: ['$totalAmount', 2] },
        completedPayments: 1,
        completedAmount: { $round: ['$completedAmount', 2] },
        failedPayments: 1,
        refundedAmount: { $round: ['$refundedAmount', 2] },
        averageAmount: { $round: ['$averageAmount', 2] },
        successRate: {
          $round: [
            { $multiply: [{ $divide: ['$completedPayments', '$totalPayments'] }, 100] },
            2
          ]
        },
        paymentMethods: 1
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    completedAmount: 0,
    failedPayments: 0,
    refundedAmount: 0,
    averageAmount: 0,
    successRate: 0,
    paymentMethods: []
  };
};

// Instance method to update payment status
paymentSchema.methods.updateStatus = async function(newStatus, gatewayData = {}) {
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid payment status: ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  // Update gateway information if provided
  if (gatewayData.transactionId) {
    this.gateway.transactionId = gatewayData.transactionId;
  }
  
  if (gatewayData.response) {
    this.gateway.gatewayResponse = gatewayData.response;
  }
  
  // Add attempt record
  this.attempts.push({
    attemptNumber: this.attempts.length + 1,
    status: newStatus,
    errorCode: gatewayData.errorCode,
    errorMessage: gatewayData.errorMessage,
    gatewayResponse: gatewayData.response
  });
  
  return await this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = async function(amount, reason, gatewayRefundId = null) {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed payments');
  }
  
  const totalRefunded = this.refunds.reduce((sum, refund) => {
    return refund.status === 'completed' ? sum + refund.amount : sum;
  }, 0);
  
  if (totalRefunded + amount > this.amount) {
    throw new Error('Refund amount exceeds payment amount');
  }
  
  const refundId = await this.constructor.generatePaymentId();
  
  this.refunds.push({
    refundId,
    amount,
    reason,
    status: 'pending',
    gatewayRefundId
  });
  
  // Update payment status
  const newTotalRefunded = totalRefunded + amount;
  if (newTotalRefunded >= this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }
  
  return await this.save();
};

// Instance method to check if payment is expired
paymentSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt && this.status === 'pending';
};

// Instance method to extend expiration
paymentSchema.methods.extendExpiration = function(minutes = 30) {
  if (this.status === 'pending') {
    this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    return this.save();
  }
  throw new Error('Can only extend expiration for pending payments');
};

// Instance method to calculate net amount (after fees)
paymentSchema.methods.getNetAmount = function() {
  return this.amount - (this.fees.totalFees || 0);
};

// Instance method to get refunded amount
paymentSchema.methods.getRefundedAmount = function() {
  return this.refunds.reduce((sum, refund) => {
    return refund.status === 'completed' ? sum + refund.amount : sum;
  }, 0);
};

// Instance method to get remaining refundable amount
paymentSchema.methods.getRefundableAmount = function() {
  if (this.status !== 'completed') return 0;
  return this.amount - this.getRefundedAmount();
};

// Indexes for better query performance
paymentSchema.index({ paymentId: 1 }, { unique: true });
paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ 'gateway.transactionId': 1 });
paymentSchema.index({ expiresAt: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;