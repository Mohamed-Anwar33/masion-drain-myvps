const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
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
      match: [/^[\+]?[0-9\s\-\(\)]{7,20}$/, 'Please enter a valid phone number']
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    }
  },

  // Message Details
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },

  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'general_inquiry',
      'product_question',
      'order_support',
      'sample_request',
      'partnership',
      'complaint',
      'compliment',
      'technical_support',
      'wholesale_inquiry',
      'media_press',
      'other'
    ],
    default: 'general_inquiry'
  },

  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  preferredLanguage: {
    type: String,
    enum: ['en', 'ar'],
    default: 'en'
  },

  // Status and Processing
  status: {
    type: String,
    enum: ['new', 'read', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },

  // Message Tracking
  messageNumber: {
    type: String,
    unique: true
  },

  // Admin Processing
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

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
    },
    isInternal: {
      type: Boolean,
      default: true
    }
  }],

  // Response Tracking
  responses: [{
    message: {
      type: String,
      required: true,
      maxlength: [2000, 'Response cannot exceed 2000 characters']
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['email', 'phone', 'internal'],
      default: 'email'
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

  // Spam Detection
  spamScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  isSpam: {
    type: Boolean,
    default: false
  },

  spamReasons: [{
    type: String,
    enum: [
      'duplicate_content',
      'suspicious_email',
      'blacklisted_domain',
      'excessive_links',
      'suspicious_keywords',
      'rate_limit_exceeded',
      'manual_flag'
    ]
  }],

  // Customer Interaction History
  customerInteractionCount: {
    type: Number,
    default: 1
  },

  relatedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContactMessage'
  }],

  // Source Information
  source: {
    type: String,
    enum: ['website_form', 'email', 'phone', 'social_media', 'admin_panel'],
    default: 'website_form'
  },

  sourceDetails: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    page: String
  },

  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false
  },

  followUpDate: {
    type: Date
  },

  // Resolution
  resolution: {
    summary: {
      type: String,
      maxlength: [500, 'Resolution summary cannot exceed 500 characters']
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    },
    customerSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    }
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
contactMessageSchema.index({ 'customerInfo.email': 1, createdAt: -1 });
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ category: 1, createdAt: -1 });
contactMessageSchema.index({ assignedTo: 1, status: 1 });
contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ isSpam: 1, spamScore: -1 });
contactMessageSchema.index({ followUpRequired: 1, followUpDate: 1 });

// Pre-save middleware
contactMessageSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate unique message number
    const count = await this.constructor.countDocuments();
    this.messageNumber = `CM${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });

    // Check for spam
    await this.checkSpam();
  }
  
  this.updatedAt = new Date();
  next();
});

// Instance Methods
contactMessageSchema.methods.updateStatus = function(newStatus, userId, reason) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    reason: reason
  });

  // Auto-assign resolution timestamp
  if (newStatus === 'resolved' && !this.resolution.resolvedAt) {
    this.resolution.resolvedAt = new Date();
    this.resolution.resolvedBy = userId;
  }

  return this.save();
};

contactMessageSchema.methods.addAdminNote = function(note, userId, isInternal = true) {
  this.adminNotes.push({
    note: note,
    addedBy: userId,
    addedAt: new Date(),
    isInternal: isInternal
  });
  return this.save();
};

contactMessageSchema.methods.addResponse = function(message, userId, method = 'email') {
  this.responses.push({
    message: message,
    sentBy: userId,
    sentAt: new Date(),
    method: method
  });

  // Update status to in_progress if it's new or read
  if (this.status === 'new' || this.status === 'read') {
    this.status = 'in_progress';
    this.statusHistory.push({
      status: 'in_progress',
      changedBy: userId,
      changedAt: new Date(),
      reason: 'Response sent to customer'
    });
  }

  return this.save();
};

contactMessageSchema.methods.assignTo = function(userId, assignedBy) {
  this.assignedTo = userId;
  
  this.adminNotes.push({
    note: `Message assigned to user ${userId}`,
    addedBy: assignedBy,
    addedAt: new Date(),
    isInternal: true
  });

  return this.save();
};

contactMessageSchema.methods.markAsSpam = function(userId, reasons = []) {
  this.isSpam = true;
  this.spamScore = 100;
  this.spamReasons = reasons.length > 0 ? reasons : ['manual_flag'];
  this.status = 'closed';

  this.statusHistory.push({
    status: 'closed',
    changedBy: userId,
    changedAt: new Date(),
    reason: 'Marked as spam'
  });

  return this.save();
};

contactMessageSchema.methods.checkSpam = async function() {
  let spamScore = 0;
  const spamReasons = [];

  // Check for duplicate content (within last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicateMessage = await this.constructor.findOne({
    'customerInfo.email': this.customerInfo.email,
    message: this.message,
    createdAt: { $gte: yesterday },
    _id: { $ne: this._id }
  });

  if (duplicateMessage) {
    spamScore += 30;
    spamReasons.push('duplicate_content');
  }

  // Check email domain
  const suspiciousDomains = [
    'tempmail.org', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email'
  ];
  const emailDomain = this.customerInfo.email.split('@')[1];
  if (suspiciousDomains.includes(emailDomain)) {
    spamScore += 40;
    spamReasons.push('suspicious_email');
  }

  // Check for excessive links
  const linkCount = (this.message.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    spamScore += 25;
    spamReasons.push('excessive_links');
  }

  // Check for suspicious keywords
  const spamKeywords = [
    'viagra', 'casino', 'lottery', 'winner', 'congratulations',
    'urgent', 'act now', 'limited time', 'free money', 'guaranteed'
  ];
  const messageText = this.message.toLowerCase();
  const keywordMatches = spamKeywords.filter(keyword => 
    messageText.includes(keyword)
  ).length;
  
  if (keywordMatches > 0) {
    spamScore += keywordMatches * 15;
    spamReasons.push('suspicious_keywords');
  }

  // Check rate limiting (more than 5 messages in last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentMessageCount = await this.constructor.countDocuments({
    'customerInfo.email': this.customerInfo.email,
    createdAt: { $gte: oneHourAgo }
  });

  if (recentMessageCount > 5) {
    spamScore += 50;
    spamReasons.push('rate_limit_exceeded');
  }

  // Update spam score and reasons
  this.spamScore = Math.min(spamScore, 100);
  this.spamReasons = spamReasons;
  this.isSpam = spamScore >= 70; // Threshold for automatic spam detection

  if (this.isSpam) {
    this.status = 'closed';
  }
};

contactMessageSchema.methods.findRelatedMessages = async function() {
  const relatedMessages = await this.constructor.find({
    'customerInfo.email': this.customerInfo.email,
    _id: { $ne: this._id },
    isDeleted: false
  }).sort({ createdAt: -1 }).limit(10);

  this.relatedMessages = relatedMessages.map(msg => msg._id);
  this.customerInteractionCount = relatedMessages.length + 1;

  return this.save();
};

// Static Methods
contactMessageSchema.statics.findByEmail = function(email, options = {}) {
  const query = {
    'customerInfo.email': email.toLowerCase(),
    isDeleted: false
  };

  if (options.status) {
    query.status = options.status;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.dateRange) {
    query.createdAt = {
      $gte: options.dateRange.start,
      $lte: options.dateRange.end
    };
  }

  return this.find(query)
    .populate('assignedTo', 'email')
    .populate('adminNotes.addedBy', 'email')
    .populate('responses.sentBy', 'email')
    .sort({ createdAt: -1 });
};

contactMessageSchema.statics.findByStatus = function(status, options = {}) {
  const query = { status, isDeleted: false };

  if (options.assignedTo) {
    query.assignedTo = options.assignedTo;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.priority) {
    query.priority = options.priority;
  }

  return this.find(query)
    .populate('assignedTo', 'email')
    .populate('adminNotes.addedBy', 'email')
    .populate('responses.sentBy', 'email')
    .sort({ createdAt: -1 });
};

contactMessageSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: {
          $avg: {
            $cond: {
              if: { $gt: [{ $size: '$responses' }, 0] },
              then: {
                $subtract: [
                  { $arrayElemAt: ['$responses.sentAt', 0] },
                  '$createdAt'
                ]
              },
              else: null
            }
          }
        }
      }
    }
  ]);

  const totalMessages = await this.countDocuments({ isDeleted: false });
  const spamCount = await this.countDocuments({ isSpam: true, isDeleted: false });

  return {
    totalMessages,
    spamCount,
    spamPercentage: totalMessages > 0 ? (spamCount / totalMessages) * 100 : 0,
    byStatus: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgResponseTime: stat.avgResponseTime
      };
      return acc;
    }, {})
  };
};

contactMessageSchema.statics.getFollowUpMessages = function() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return this.find({
    followUpRequired: true,
    followUpDate: { $lte: today },
    status: { $nin: ['resolved', 'closed'] },
    isDeleted: false
  })
    .populate('assignedTo', 'email')
    .sort({ followUpDate: 1 });
};

// Virtual for response time
contactMessageSchema.virtual('responseTime').get(function() {
  if (this.responses && this.responses.length > 0) {
    return this.responses[0].sentAt - this.createdAt;
  }
  return null;
});

// Virtual for full customer name
contactMessageSchema.virtual('customerFullName').get(function() {
  return `${this.customerInfo.firstName} ${this.customerInfo.lastName}`;
});

// Virtual for days since creation
contactMessageSchema.virtual('daysSinceCreation').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON output
contactMessageSchema.set('toJSON', { virtuals: true });
contactMessageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);