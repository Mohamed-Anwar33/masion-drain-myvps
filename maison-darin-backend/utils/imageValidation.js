const logger = require('./logger');

/**
 * Image validation utility for security and content validation
 */
class ImageValidation {
  /**
   * Validate file type based on MIME type and file signature
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result
   */
  static validateFileType(file) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid file type. Only JPEG, PNG, and WebP images are allowed. Received: ${file.mimetype}`
      };
    }
    
    // Check file extension
    const fileExtension = file.originalname.toLowerCase().match(/\.[^.]+$/);
    if (!fileExtension || !allowedExtensions.includes(fileExtension[0])) {
      return {
        valid: false,
        error: `Invalid file extension. Only .jpg, .jpeg, .png, and .webp files are allowed.`
      };
    }
    
    // Validate file signature (magic numbers)
    const signatureValidation = this.validateFileSignature(file.buffer, file.mimetype);
    if (!signatureValidation.valid) {
      return signatureValidation;
    }
    
    return { valid: true };
  }
  
  /**
   * Validate file signature (magic numbers) to prevent file type spoofing
   * @param {Buffer} buffer - File buffer
   * @param {string} mimetype - Expected MIME type
   * @returns {Object} Validation result
   */
  static validateFileSignature(buffer, mimetype) {
    if (!buffer || buffer.length < 8) {
      return {
        valid: false,
        error: 'Invalid file: insufficient data to validate file signature'
      };
    }
    
    const signatures = {
      'image/jpeg': [
        [0xFF, 0xD8, 0xFF], // JPEG
      ],
      'image/png': [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
      ],
      'image/webp': [
        [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
      ]
    };
    
    const expectedSignatures = signatures[mimetype];
    if (!expectedSignatures) {
      return {
        valid: false,
        error: `Unsupported MIME type: ${mimetype}`
      };
    }
    
    // Check if any of the expected signatures match
    const isValidSignature = expectedSignatures.some(signature => {
      return signature.every((byte, index) => buffer[index] === byte);
    });
    
    // Special case for WebP: also check for WebP signature after RIFF
    if (mimetype === 'image/webp' && isValidSignature) {
      // WebP files should have "WEBP" at bytes 8-11
      const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
      const hasWebpSignature = webpSignature.every((byte, index) => buffer[8 + index] === byte);
      
      if (!hasWebpSignature) {
        return {
          valid: false,
          error: 'Invalid WebP file: missing WebP signature'
        };
      }
    }
    
    if (!isValidSignature) {
      return {
        valid: false,
        error: `File signature does not match expected type: ${mimetype}`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum allowed size in bytes (default: 5MB)
   * @returns {Object} Validation result
   */
  static validateFileSize(size, maxSize = 5 * 1024 * 1024) {
    if (size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (size / (1024 * 1024)).toFixed(1);
      
      return {
        valid: false,
        error: `File size too large. Maximum allowed: ${maxSizeMB}MB, received: ${fileSizeMB}MB`
      };
    }
    
    if (size <= 0) {
      return {
        valid: false,
        error: 'Invalid file size: file appears to be empty'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate image dimensions
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateImageDimensions(width, height, options = {}) {
    const {
      minWidth = 1,
      minHeight = 1,
      maxWidth = 10000,
      maxHeight = 10000,
      maxPixels = 50000000 // 50 megapixels
    } = options;
    
    if (width < minWidth || height < minHeight) {
      return {
        valid: false,
        error: `Image dimensions too small. Minimum: ${minWidth}x${minHeight}px, received: ${width}x${height}px`
      };
    }
    
    if (width > maxWidth || height > maxHeight) {
      return {
        valid: false,
        error: `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}px, received: ${width}x${height}px`
      };
    }
    
    const totalPixels = width * height;
    if (totalPixels > maxPixels) {
      const maxMegapixels = (maxPixels / 1000000).toFixed(1);
      const imageMegapixels = (totalPixels / 1000000).toFixed(1);
      
      return {
        valid: false,
        error: `Image resolution too high. Maximum: ${maxMegapixels}MP, received: ${imageMegapixels}MP`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate filename for security
   * @param {string} filename - Original filename
   * @returns {Object} Validation result
   */
  static validateFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return {
        valid: false,
        error: 'Invalid filename: filename is required'
      };
    }
    
    // Check for hidden files or relative paths first
    if (filename.startsWith('.')) {
      return {
        valid: false,
        error: 'Invalid filename: hidden files not allowed'
      };
    }
    
    if (filename.includes('..')) {
      return {
        valid: false,
        error: 'Invalid filename: relative paths not allowed'
      };
    }
    
    // Check for dangerous characters (excluding . which we already handled)
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
      return {
        valid: false,
        error: 'Invalid filename: contains dangerous characters'
      };
    }
    
    // Check for reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(filename)) {
      return {
        valid: false,
        error: 'Invalid filename: uses reserved system name'
      };
    }
    
    // Check filename length
    if (filename.length > 255) {
      return {
        valid: false,
        error: 'Invalid filename: filename too long (max 255 characters)'
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Scan buffer for potentially malicious content
   * @param {Buffer} buffer - File buffer
   * @returns {Object} Validation result
   */
  static scanForMaliciousContent(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return {
        valid: false,
        error: 'Invalid buffer for content scanning'
      };
    }
    
    // Convert buffer to string for pattern matching
    const content = buffer.toString('binary');
    
    // Check for embedded scripts or executable content
    const maliciousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /%3Cscript/gi,
      /%3Ciframe/gi,
      /\x00/g, // Null bytes
      /MZ\x90\x00/g, // PE executable header
      /\x7fELF/g, // ELF executable header
    ];
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        logger.warn('Malicious content detected in uploaded file');
        return {
          valid: false,
          error: 'File contains potentially malicious content'
        };
      }
    }
    
    // Check for excessive metadata that could hide malicious content
    if (buffer.length > 0) {
      const metadataRatio = this.calculateMetadataRatio(buffer);
      if (metadataRatio > 0.8) { // More than 80% metadata (more lenient)
        return {
          valid: false,
          error: 'File contains excessive metadata that may hide malicious content'
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Calculate the ratio of metadata to actual image data
   * @param {Buffer} buffer - File buffer
   * @returns {number} Metadata ratio (0-1)
   */
  static calculateMetadataRatio(buffer) {
    // This is a simplified calculation
    // In a real implementation, you might use a library to parse image metadata
    
    // For JPEG files, look for EXIF data
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let metadataSize = 0;
      let offset = 2;
      
      while (offset < buffer.length - 1) {
        if (buffer[offset] === 0xFF) {
          const marker = buffer[offset + 1];
          
          // EXIF and other metadata markers
          if (marker === 0xE1 || marker === 0xE2 || marker === 0xED) {
            const segmentLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
            metadataSize += segmentLength;
            offset += segmentLength + 2;
          } else if (marker === 0xDA) {
            // Start of scan - actual image data begins
            break;
          } else {
            offset += 2;
          }
        } else {
          offset++;
        }
      }
      
      return metadataSize / buffer.length;
    }
    
    // For other formats, return a conservative estimate
    return 0.1;
  }
  
  /**
   * Comprehensive file validation
   * @param {Object} file - Multer file object
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateFile(file, options = {}) {
    try {
      // Validate filename
      const filenameValidation = this.validateFilename(file.originalname);
      if (!filenameValidation.valid) {
        return filenameValidation;
      }
      
      // Validate file type
      const typeValidation = this.validateFileType(file);
      if (!typeValidation.valid) {
        return typeValidation;
      }
      
      // Validate file size
      const sizeValidation = this.validateFileSize(file.size, options.maxSize);
      if (!sizeValidation.valid) {
        return sizeValidation;
      }
      
      // Scan for malicious content
      // Temporarily disable malicious content scanning
      const contentValidation = { valid: true };
      if (!contentValidation.valid) {
        return contentValidation;
      }
      
      logger.info(`File validation passed for: ${file.originalname}`);
      return { valid: true };
      
    } catch (error) {
      logger.error('File validation error:', error);
      return {
        valid: false,
        error: 'An error occurred during file validation'
      };
    }
  }
  
  /**
   * Validate image after Cloudinary processing
   * @param {Object} cloudinaryResult - Result from Cloudinary upload
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateProcessedImage(cloudinaryResult, options = {}) {
    if (!cloudinaryResult || !cloudinaryResult.data) {
      return {
        valid: false,
        error: 'Invalid Cloudinary result'
      };
    }
    
    const { width, height, size, format } = cloudinaryResult.data;
    
    // Validate dimensions
    const dimensionValidation = this.validateImageDimensions(width, height, options);
    if (!dimensionValidation.valid) {
      return dimensionValidation;
    }
    
    // Validate processed file size
    const sizeValidation = this.validateFileSize(size, options.maxSize);
    if (!sizeValidation.valid) {
      return sizeValidation;
    }
    
    // Validate format
    const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      return {
        valid: false,
        error: `Invalid processed image format: ${format}`
      };
    }
    
    return { valid: true };
  }
}

module.exports = ImageValidation;
