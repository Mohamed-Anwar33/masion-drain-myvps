const Joi = require('joi');
const mongoose = require('mongoose');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown properties
      convert: true // Convert strings to numbers, etc.
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: 'VALIDATION_ERROR'
      }));

      logger.warn('Validation failed', {
        property,
        errors: details,
        originalData: req[property]
      });

      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
    }

    // Replace the original data with the validated and sanitized data
    req[property] = value;
    next();
  };
};

/**
 * Sanitize input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
};

/**
 * XSS sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * MongoDB injection prevention middleware
 */
const preventMongoInjection = (req, res, next) => {
  const checkForInjection = (obj) => {
    if (obj === null || obj === undefined) return false;
    
    if (typeof obj === 'string') {
      // Check for MongoDB operators
      return /^\$/.test(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkForInjection);
    }
    
    if (typeof obj === 'object') {
      // Check for MongoDB operators in keys
      for (const key of Object.keys(obj)) {
        if (/^\$/.test(key) || checkForInjection(obj[key])) {
          return true;
        }
      }
    }
    
    return false;
  };

  const hasInjection = checkForInjection(req.body) || 
                     checkForInjection(req.query) || 
                     checkForInjection(req.params);

  if (hasInjection) {
    logger.warn('MongoDB injection attempt detected', {
      ip: req.ip,
      userAgent: req.get ? req.get('User-Agent') : 'unknown',
      body: req.body,
      query: req.query,
      params: req.params
    });

    return next(new AppError('Invalid request format', 400, 'INVALID_REQUEST'));
  }

  next();
};

module.exports = {
  validate,
  sanitizeInput,
  preventMongoInjection,
  sanitizeString,
  /**
   * Validate Mongo ObjectId in :id param
   */
  validateObjectId: (req, res, next) => {
    const { id } = req.params || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OBJECT_ID',
          message: 'Invalid ID format'
        }
      });
    }
    return next();
  }
};