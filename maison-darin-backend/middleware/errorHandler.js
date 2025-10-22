/**
 * Global Error Handling Middleware for Maison Darin Backend
 * Provides centralized error handling with proper logging and structured responses
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Development error response - includes stack trace
 */
const sendErrorDev = (err, req, res) => {
  const error = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      details: err.details || [],
      stack: err.stack
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };

  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    statusCode: err.statusCode || 500
  });

  res.status(err.statusCode || 500).json(error);
};

/**
 * Production error response - sanitized for security
 */
const sendErrorProd = (err, req, res) => {
  // Only send operational errors to client in production
  if (err.isOperational) {
    const error = {
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        details: err.details || []
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };

    logger.error('Operational error', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
      ip: req.ip,
      statusCode: err.statusCode
    });

    res.status(err.statusCode || 500).json(error);
  } else {
    // Programming or unknown errors - don't leak error details
    logger.error('Programming error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong'
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
};

/**
 * Handle MongoDB CastError (invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

/**
 * Handle MongoDB duplicate field error
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return new AppError(message, 409, 'DUPLICATE_FIELD');
};

/**
 * Handle MongoDB validation error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
    value: el.value
  }));
  
  const message = 'Invalid input data';
  return new AppError(message, 400, 'VALIDATION_ERROR', errors);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again', 401, 'TOKEN_EXPIRED');
};

/**
 * Handle Multer file upload errors
 */
const handleMulterError = (err) => {
  let message = 'File upload error';
  let details = [];

  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File too large';
      details = [{ field: 'file', message: 'File size exceeds limit' }];
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files';
      details = [{ field: 'files', message: 'File count exceeds limit' }];
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected file field';
      details = [{ field: err.field, message: 'Unexpected file field' }];
      break;
    default:
      message = err.message || 'File upload failed';
  }

  return new AppError(message, 400, 'FILE_UPLOAD_ERROR', details);
};

/**
 * Main error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle different error types
  let error = err;

  // MongoDB CastError
  if (err.name === 'CastError') error = handleCastErrorDB(error);
  
  // MongoDB duplicate key error
  if (err.code === 11000) error = handleDuplicateFieldsDB(error);
  
  // MongoDB validation error (not our custom ValidationError)
  if (err.name === 'ValidationError' && err.errors) error = handleValidationErrorDB(error);
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Multer errors
  if (err.name === 'MulterError') error = handleMulterError(error);

  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

/**
 * Async error wrapper - catches async errors and passes to error handler
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection', {
      error: err.message,
      stack: err.stack,
      promise: promise
    });
    
    // Close server gracefully
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
      error: err.message,
      stack: err.stack
    });
    
    // Exit immediately
    process.exit(1);
  });
};

/**
 * Handle graceful shutdown
 */
const handleGracefulShutdown = (server) => {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

module.exports = {
  globalErrorHandler,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException,
  handleGracefulShutdown
};