/**
 * Custom Error Classes for Maison Darin Backend
 * Provides structured error handling with proper status codes and error details
 */

/**
 * Base Application Error class
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, details = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || this.constructor.name.toUpperCase();
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      },
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation Error - 400 Bad Request
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication Error - 401 Unauthorized
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error - 403 Forbidden
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error - 404 Not Found
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict Error - 409 Conflict
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Database Error - 500 Internal Server Error
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * External Service Error - 502 Bad Gateway
 */
class ExternalServiceError extends AppError {
  constructor(message = 'External service unavailable', service = null) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * File Upload Error - 400 Bad Request
 */
class FileUploadError extends AppError {
  constructor(message = 'File upload failed', details = []) {
    super(message, 400, 'FILE_UPLOAD_ERROR', details);
  }
}

/**
 * Business Logic Error - 422 Unprocessable Entity
 */
class BusinessLogicError extends AppError {
  constructor(message = 'Business rule violation') {
    super(message, 422, 'BUSINESS_LOGIC_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  FileUploadError,
  BusinessLogicError
};