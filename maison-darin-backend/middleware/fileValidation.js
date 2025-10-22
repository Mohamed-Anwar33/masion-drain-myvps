const multer = require('multer');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// File type validation
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

// File size limits (in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10; // Maximum number of files per request

/**
 * File filter function for multer
 */
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    logger.warn('Invalid file type uploaded', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      ip: req.ip
    });
    
    return cb(new AppError(
      `Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed`,
      400,
      'INVALID_FILE_TYPE'
    ), false);
  }

  // Check file extension matches mimetype
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  const validExtensions = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp']
  };

  if (!validExtensions[file.mimetype]?.includes(fileExtension)) {
    logger.warn('File extension does not match mimetype', {
      mimetype: file.mimetype,
      extension: fileExtension,
      originalname: file.originalname,
      ip: req.ip
    });
    
    return cb(new AppError(
      'File extension does not match file type',
      400,
      'INVALID_FILE_EXTENSION'
    ), false);
  }

  cb(null, true);
};

/**
 * Multer configuration for memory storage
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
    fieldSize: 1024 * 1024, // 1MB for form fields
    fieldNameSize: 100, // 100 bytes for field names
    fields: 20 // Maximum number of non-file fields
  }
});

/**
 * Enhanced file validation middleware
 */
const validateFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return next(new AppError('No file uploaded', 400, 'NO_FILE_UPLOADED'));
  }

  const files = req.files || [req.file];
  
  for (const file of files) {
    // Additional security checks
    
    // Check for null bytes (potential security risk)
    if (file.originalname.includes('\0')) {
      logger.warn('File with null bytes detected', {
        originalname: file.originalname,
        ip: req.ip
      });
      
      return next(new AppError(
        'Invalid filename detected',
        400,
        'INVALID_FILENAME'
      ));
    }

    // Check filename length
    if (file.originalname.length > 255) {
      return next(new AppError(
        'Filename too long (maximum 255 characters)',
        400,
        'FILENAME_TOO_LONG'
      ));
    }

    // Check for potentially dangerous filenames
    const dangerousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i  // Windows reserved names (with or without extension)
    ];

    if (dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
      logger.warn('Potentially dangerous filename detected', {
        originalname: file.originalname,
        ip: req.ip
      });
      
      return next(new AppError(
        'Invalid filename format',
        400,
        'INVALID_FILENAME_FORMAT'
      ));
    }

    // Basic file content validation (check magic numbers)
    if (file.buffer && file.buffer.length > 0) {
      const magicNumbers = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/webp': [0x52, 0x49, 0x46, 0x46] // RIFF header for WebP
      };

      const fileMagic = magicNumbers[file.mimetype];
      if (fileMagic) {
        const fileHeader = Array.from(file.buffer.slice(0, fileMagic.length));
        const isValidMagic = fileMagic.every((byte, index) => byte === fileHeader[index]);
        
        if (!isValidMagic) {
          logger.warn('File magic number validation failed', {
            mimetype: file.mimetype,
            originalname: file.originalname,
            expectedMagic: fileMagic,
            actualMagic: fileHeader,
            ip: req.ip
          });
          
          return next(new AppError(
            'File content does not match declared type',
            400,
            'INVALID_FILE_CONTENT'
          ));
        }
      }
    }
  }

  next();
};

/**
 * Middleware to handle multer errors
 */
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let code = 'FILE_UPLOAD_ERROR';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = `Too many files. Maximum is ${MAX_FILES} files`;
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many form fields';
        code = 'TOO_MANY_FIELDS';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        code = 'FIELD_NAME_TOO_LONG';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        code = 'FIELD_VALUE_TOO_LONG';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE_FIELD';
        break;
    }

    logger.warn('Multer error occurred', {
      code: error.code,
      message: error.message,
      field: error.field,
      ip: req.ip
    });

    return next(new AppError(message, 400, code));
  }

  next(error);
};

/**
 * Create upload middleware with specific field configuration
 */
const createUploadMiddleware = (fieldName = 'image', maxCount = 1) => {
  if (maxCount === 1) {
    return upload.single(fieldName);
  } else {
    return upload.array(fieldName, maxCount);
  }
};

module.exports = {
  upload,
  validateFile,
  handleMulterError,
  createUploadMiddleware,
  allowedMimeTypes,
  MAX_FILE_SIZE,
  MAX_FILES
};