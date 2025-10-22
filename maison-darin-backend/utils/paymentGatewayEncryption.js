const crypto = require('crypto');

/**
 * Secure encryption utility for payment gateway credentials
 * Uses AES-256-GCM for authenticated encryption
 */
class PaymentGatewayEncryption {
  constructor() {
    // Use environment variable or generate a key
    const envKey = process.env.PAYMENT_GATEWAY_ENCRYPTION_KEY || process.env.PAYMENT_ENCRYPTION_KEY;
    
    if (!envKey || envKey.length < 32) {
      console.warn('WARNING: PAYMENT_GATEWAY_ENCRYPTION_KEY is not set or too short. Using default key (NOT SECURE FOR PRODUCTION)');
      this.encryptionKey = 'default-32-character-key-change!!';
    } else {
      this.encryptionKey = envKey;
    }
    
    // Derive a 256-bit key from the encryption key
    this.key = crypto.scryptSync(this.encryptionKey, 'payment-gateway-salt', 32);
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   * @param {string} text - Text to encrypt
   * @returns {string|null} - Encrypted text in format: iv:authTag:encryptedData
   */
  encrypt(text) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return null;
    }

    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher with AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag();
      
      // Return format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  /**
   * Decrypt encrypted data
   * @param {string} encryptedText - Encrypted text in format: iv:authTag:encryptedData
   * @returns {string|null} - Decrypted text or null if decryption fails
   */
  decrypt(encryptedText) {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return null;
    }

    try {
      // Split the encrypted text into components
      const parts = encryptedText.split(':');
      
      if (parts.length !== 3) {
        console.error('Invalid encrypted text format');
        return null;
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Check if a value is encrypted (basic check)
   * @param {string} value - Value to check
   * @returns {boolean} - True if value appears to be encrypted
   */
  isEncrypted(value) {
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    // Check if it matches the encrypted format (hex:hex:hex)
    const encryptedPattern = /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i;
    return encryptedPattern.test(value);
  }

  /**
   * Encrypt an object's sensitive fields
   * @param {Object} obj - Object containing sensitive fields
   * @param {Array} sensitiveFields - Array of field names to encrypt
   * @returns {Object} - Object with encrypted fields
   */
  encryptFields(obj, sensitiveFields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const encrypted = { ...obj };
    
    for (const field of sensitiveFields) {
      if (encrypted[field] && !this.isEncrypted(encrypted[field])) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt an object's sensitive fields
   * @param {Object} obj - Object containing encrypted fields
   * @param {Array} sensitiveFields - Array of field names to decrypt
   * @returns {Object} - Object with decrypted fields
   */
  decryptFields(obj, sensitiveFields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const decrypted = { ...obj };
    
    for (const field of sensitiveFields) {
      if (decrypted[field] && this.isEncrypted(decrypted[field])) {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    }
    
    return decrypted;
  }

  /**
   * Generate a secure random token
   * @param {number} length - Length in bytes (default: 32)
   * @returns {string} - Hex-encoded random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a value (one-way)
   * @param {string} value - Value to hash
   * @returns {string} - SHA-256 hash
   */
  hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Mask sensitive data for display (show only last 4 characters)
   * @param {string} value - Value to mask
   * @param {number} visibleChars - Number of characters to show (default: 4)
   * @returns {string} - Masked value
   */
  mask(value, visibleChars = 4) {
    if (!value || value.length <= visibleChars) {
      return '****';
    }
    
    const masked = '*'.repeat(value.length - visibleChars);
    return masked + value.slice(-visibleChars);
  }
}

// Export singleton instance
const paymentGatewayEncryption = new PaymentGatewayEncryption();

module.exports = paymentGatewayEncryption;
