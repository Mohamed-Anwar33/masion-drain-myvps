const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: function() { return this.role === 'customer'; },
    trim: true
  },
  lastName: {
    type: String,
    required: function() { return this.role === 'customer'; },
    trim: true
  },
  phone: {
    type: String,
    required: function() { return this.role === 'customer'; },
    trim: true
  },
  address: {
    type: String,
    required: function() { return this.role === 'customer'; },
    trim: true
  },
  city: {
    type: String,
    required: function() { return this.role === 'customer'; },
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin', 'customer'],
    default: 'customer'
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sessionTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    isActive: { type: Boolean, default: true }
  }],
  passwordChangedAt: {
    type: Date,
    default: Date.now
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
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Instance method to check password with account locking
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // If account is locked, don't allow password comparison
    if (this.isLocked) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    // If password matches, reset login attempts
    if (isMatch) {
      if (this.loginAttempts > 0) {
        this.loginAttempts = 0;
        this.lockUntil = undefined;
        await this.save();
      }
      return true;
    }
    
    // If password doesn't match, increment login attempts
    this.loginAttempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts >= 5) {
      this.lockUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
    }
    
    await this.save();
    return false;
  } catch (error) {
    throw new Error('Password comparison failed: ' + error.message);
  }
};

// Instance method to generate JWT tokens with session tracking
userSchema.methods.generateTokens = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    sessionId: new mongoose.Types.ObjectId().toString(),
    iat: Math.floor(Date.now() / 1000)
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '15m',
      issuer: 'maison-darin-api',
      audience: 'maison-darin-client'
    }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'maison-darin-api',
      audience: 'maison-darin-client'
    }
  );

  // Store session token for tracking
  this.sessionTokens.push({
    token: payload.sessionId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
    isActive: true
  });

  // Clean up old sessions (keep only last 5)
  if (this.sessionTokens.length > 5) {
    this.sessionTokens = this.sessionTokens.slice(-5);
  }

  return { accessToken, refreshToken };
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

// Static method to create user with validation
userSchema.statics.createUser = async function(userData) {
  const { email, password } = userData;

  // Check if user already exists
  const existingUser = await this.findOne({ email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Validate password strength
  if (!this.validatePassword(password)) {
    throw new Error('Password does not meet security requirements');
  }

  // Create and save user
  const user = new this(userData);
  return await user.save();
};

// Static method to validate password strength
userSchema.statics.validatePassword = function(password, role = 'customer') {
  // For customers: minimum 6 characters
  if (role === 'customer') {
    return password.length >= 6;
  }
  
  // For admins: stronger requirements
  // Password must be at least 8 characters long
  if (password.length < 8) return false;
  
  // Password must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Password must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Password must contain at least one number
  if (!/\d/.test(password)) return false;
  
  // Password must contain at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  
  return true;
};

// Index for active users
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;