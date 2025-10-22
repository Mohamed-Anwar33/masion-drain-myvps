const { body, validationResult } = require('express-validator');

// Validation middleware for payment data
const validatePaymentData = [
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required')
    .isLength({ min: 10, max: 50 })
    .withMessage('Payment ID must be between 10 and 50 characters')
    .matches(/^PAY[A-Z0-9_]+$/)
    .withMessage('Invalid payment ID format'),

  // Card payment validation
  body('cardDetails.cardNumber')
    .optional()
    .isLength({ min: 13, max: 19 })
    .withMessage('Card number must be between 13 and 19 digits')
    .matches(/^[0-9\s]+$/)
    .withMessage('Card number can only contain digits and spaces')
    .custom((value) => {
      // Basic Luhn algorithm validation
      if (!value) return true;
      
      const digits = value.replace(/\s/g, '');
      let sum = 0;
      let isEven = false;
      
      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);
        
        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        
        sum += digit;
        isEven = !isEven;
      }
      
      if (sum % 10 !== 0) {
        throw new Error('Invalid card number');
      }
      
      return true;
    }),

  body('cardDetails.expiryDate')
    .optional()
    .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)
    .withMessage('Expiry date must be in MM/YY format')
    .custom((value) => {
      if (!value) return true;
      
      const [month, year] = value.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const now = new Date();
      
      if (expiry < now) {
        throw new Error('Card has expired');
      }
      
      return true;
    }),

  body('cardDetails.cvv')
    .optional()
    .matches(/^[0-9]{3,4}$/)
    .withMessage('CVV must be 3 or 4 digits'),

  body('cardDetails.cardholderName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Cardholder name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/)
    .withMessage('Cardholder name can only contain letters and spaces'),

  // Vodafone Cash validation
  body('phoneNumber')
    .optional()
    .matches(/^01[0-9]{9}$/)
    .withMessage('Phone number must be a valid Egyptian mobile number (01xxxxxxxxx)'),

  // Bank transfer validation
  body('bankReference')
    .optional()
    .isLength({ min: 5, max: 50 })
    .withMessage('Bank reference must be between 5 and 50 characters')
    .matches(/^[A-Z0-9\-_]+$/i)
    .withMessage('Bank reference can only contain letters, numbers, hyphens, and underscores'),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

// Validation middleware for refund data
const validateRefundData = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0')
    .custom((value, { req }) => {
      // Additional validation can be added here
      // For example, checking against maximum refundable amount
      return true;
    }),

  body('reason')
    .notEmpty()
    .withMessage('Refund reason is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Refund reason must be between 10 and 200 characters')
    .trim()
    .escape(),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

// Validation middleware for payment method configuration (admin)
const validatePaymentMethodConfig = [
  body('name')
    .notEmpty()
    .withMessage('Payment method name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-z_]+$/)
    .withMessage('Name can only contain lowercase letters and underscores'),

  body('displayName.ar')
    .notEmpty()
    .withMessage('Arabic display name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Arabic display name must be between 2 and 100 characters'),

  body('displayName.en')
    .notEmpty()
    .withMessage('English display name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('English display name must be between 2 and 100 characters'),

  body('type')
    .isIn(['card', 'mobile_wallet', 'bank_transfer', 'cash', 'digital_wallet'])
    .withMessage('Invalid payment method type'),

  body('provider')
    .notEmpty()
    .withMessage('Provider is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Provider must be between 2 and 50 characters'),

  body('configuration.minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be 0 or greater'),

  body('configuration.maxAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Maximum amount must be greater than 0')
    .custom((value, { req }) => {
      const minAmount = req.body.configuration?.minAmount || 0;
      if (value <= minAmount) {
        throw new Error('Maximum amount must be greater than minimum amount');
      }
      return true;
    }),

  body('fees.fixedFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed fee must be 0 or greater'),

  body('fees.percentageFee')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage fee must be between 0 and 100'),

  body('ui.color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

// Validation middleware for payment initialization
const validatePaymentInitialization = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['visa', 'mastercard', 'vodafone_cash', 'cash_on_delivery', 'bank_transfer'])
    .withMessage('Invalid payment method'),

  body('customerData.customerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID format'),

  body('customerData.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('customerData.phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format'),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

// Rate limiting for payment attempts
const paymentRateLimit = (req, res, next) => {
  // This would typically use Redis or similar for distributed rate limiting
  // For now, we'll implement a simple in-memory rate limiter
  
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  // Initialize rate limit storage if not exists
  if (!global.paymentRateLimit) {
    global.paymentRateLimit = new Map();
  }

  const clientData = global.paymentRateLimit.get(clientId) || { attempts: 0, resetTime: now + windowMs };

  // Reset if window has expired
  if (now > clientData.resetTime) {
    clientData.attempts = 0;
    clientData.resetTime = now + windowMs;
  }

  // Check if limit exceeded
  if (clientData.attempts >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many payment attempts. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }

  // Increment attempts
  clientData.attempts++;
  global.paymentRateLimit.set(clientId, clientData);

  next();
};

// Security headers for payment endpoints
const paymentSecurityHeaders = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  
  next();
};

module.exports = {
  validatePaymentData,
  validateRefundData,
  validatePaymentMethodConfig,
  validatePaymentInitialization,
  paymentRateLimit,
  paymentSecurityHeaders
};