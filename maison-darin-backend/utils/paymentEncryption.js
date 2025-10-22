const crypto = require('crypto');

class PaymentEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.saltLength = 32;
    
    // Get encryption key from environment or generate a default one
    this.masterKey = process.env.PAYMENT_ENCRYPTION_KEY || this.generateDefaultKey();
    
    if (this.masterKey.length < 32) {
      console.warn('Payment encryption key is too short. Using padded version.');
      this.masterKey = this.masterKey.padEnd(32, '0');
    }
  }

  // Generate a default key (should not be used in production)
  generateDefaultKey() {
    console.warn('Using default encryption key. Set PAYMENT_ENCRYPTION_KEY environment variable in production.');
    return 'default-payment-key-change-me-123456';
  }

  // Derive key from master key using PBKDF2
  deriveKey(salt) {
    return crypto.pbkdf2Sync(this.masterKey, salt, 100000, this.keyLength, 'sha256');
  }

  // Encrypt sensitive payment data
  encrypt(plaintext) {
    if (!plaintext) {
      return null;
    }

    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);
      
      // Derive key from master key and salt
      const key = this.deriveKey(salt);
      
      // Create cipher
      const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
      
      // Encrypt the plaintext
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine salt, iv, tag, and encrypted data
      const result = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'hex')
      ]);
      
      return result.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt payment data');
    }
  }

  // Decrypt sensitive payment data
  decrypt(encryptedData) {
    if (!encryptedData) {
      return null;
    }

    try {
      // Convert from base64
      const buffer = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = buffer.slice(0, this.saltLength);
      const iv = buffer.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = buffer.slice(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
      const encrypted = buffer.slice(this.saltLength + this.ivLength + this.tagLength);
      
      // Derive key from master key and salt
      const key = this.deriveKey(salt);
      
      // Create decipher
      const decipher = crypto.createDecipherGCM(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Hash sensitive data (one-way)
  hash(data, salt = null) {
    if (!data) {
      return null;
    }

    try {
      const actualSalt = salt || crypto.randomBytes(16);
      const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 32, 'sha256');
      
      if (salt) {
        return hash.toString('hex');
      } else {
        return actualSalt.toString('hex') + ':' + hash.toString('hex');
      }
    } catch (error) {
      console.error('Hashing error:', error);
      throw new Error('Failed to hash data');
    }
  }

  // Verify hashed data
  verifyHash(data, hashedData) {
    if (!data || !hashedData) {
      return false;
    }

    try {
      const parts = hashedData.split(':');
      if (parts.length !== 2) {
        return false;
      }

      const salt = Buffer.from(parts[0], 'hex');
      const originalHash = parts[1];
      const newHash = this.hash(data, salt);

      return crypto.timingSafeEqual(
        Buffer.from(originalHash, 'hex'),
        Buffer.from(newHash, 'hex')
      );
    } catch (error) {
      console.error('Hash verification error:', error);
      return false;
    }
  }

  // Generate secure random token
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure payment reference
  generatePaymentReference(prefix = 'PAY') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  // Mask sensitive data for logging/display
  maskCardNumber(cardNumber) {
    if (!cardNumber || cardNumber.length < 8) {
      return '****';
    }
    
    const cleaned = cardNumber.replace(/\D/g, '');
    const first4 = cleaned.substring(0, 4);
    const last4 = cleaned.substring(cleaned.length - 4);
    const middle = '*'.repeat(cleaned.length - 8);
    
    return `${first4}${middle}${last4}`;
  }

  // Mask phone number
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 6) {
      return '****';
    }
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    const first2 = cleaned.substring(0, 2);
    const last2 = cleaned.substring(cleaned.length - 2);
    const middle = '*'.repeat(cleaned.length - 4);
    
    return `${first2}${middle}${last2}`;
  }

  // Mask email address
  maskEmail(email) {
    if (!email || !email.includes('@')) {
      return '****@****.***';
    }
    
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : '**';
    
    const [domainName, extension] = domain.split('.');
    const maskedDomain = domainName.length > 2
      ? domainName.substring(0, 2) + '*'.repeat(domainName.length - 2)
      : '**';
    
    return `${maskedUsername}@${maskedDomain}.${extension}`;
  }

  // Validate encryption key strength
  validateEncryptionKey(key) {
    if (!key) {
      return { valid: false, message: 'Encryption key is required' };
    }

    if (key.length < 32) {
      return { valid: false, message: 'Encryption key must be at least 32 characters long' };
    }

    // Check for common weak patterns
    const weakPatterns = [
      /^(.)\1+$/, // All same character
      /^(012|123|234|345|456|567|678|789|890)+/, // Sequential numbers
      /^(abc|def|ghi|jkl|mno|pqr|stu|vwx|yz)+/i, // Sequential letters
      /^(password|secret|key|admin|test|demo)/i // Common words
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(key)) {
        return { valid: false, message: 'Encryption key contains weak patterns' };
      }
    }

    return { valid: true, message: 'Encryption key is valid' };
  }

  // Generate strong encryption key
  generateStrongKey(length = 64) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let key = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      key += charset[randomIndex];
    }
    
    return key;
  }

  // Secure comparison of strings (timing-safe)
  secureCompare(a, b) {
    if (!a || !b) {
      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(a, 'utf8'),
        Buffer.from(b, 'utf8')
      );
    } catch (error) {
      return false;
    }
  }

  // Generate checksum for data integrity
  generateChecksum(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Verify data integrity using checksum
  verifyChecksum(data, expectedChecksum) {
    const actualChecksum = this.generateChecksum(data);
    return this.secureCompare(actualChecksum, expectedChecksum);
  }
}

// Export singleton instance
module.exports = new PaymentEncryption();