/**
 * Error Handler Utilities
 * Re-exports error classes for backward compatibility
 */

const { 
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
} = require('./errors');

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