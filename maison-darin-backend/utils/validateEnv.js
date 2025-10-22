const Joi = require('joi');

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .port()
    .default(5000),
  
  MONGODB_URI: Joi.string()
    .uri()
    .required()
    .messages({
      'any.required': 'MONGODB_URI is required',
      'string.uri': 'MONGODB_URI must be a valid URI'
    }),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'JWT_SECRET is required',
      'string.min': 'JWT_SECRET must be at least 32 characters long'
    }),
  
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'JWT_REFRESH_SECRET is required',
      'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters long'
    }),
  
  JWT_EXPIRE: Joi.string()
    .default('15m'),
  
  JWT_REFRESH_EXPIRE: Joi.string()
    .default('7d'),
  
  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:3000'),
  
  CLOUDINARY_CLOUD_NAME: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  CLOUDINARY_API_KEY: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  CLOUDINARY_API_SECRET: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  BCRYPT_SALT_ROUNDS: Joi.number()
    .integer()
    .min(10)
    .max(15)
    .default(12),
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(60000) // minimum 1 minute
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100),
  
  MAX_FILE_SIZE: Joi.number()
    .integer()
    .min(1024) // minimum 1KB
    .default(5242880), // 5MB
  
}).unknown(); // Allow unknown environment variables

/**
 * Validate environment variables
 * @returns {Object} Validated environment variables
 * @throws {Error} If validation fails
 */
function validateEnv() {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    const errorMessage = error.details
      .map(detail => detail.message)
      .join(', ');
    
    throw new Error(`Environment validation failed: ${errorMessage}`);
  }
  
  return value;
}

/**
 * Get validated environment configuration
 * @returns {Object} Environment configuration object
 */
function getConfig() {
  const env = validateEnv();
  
  return {
    server: {
      port: env.PORT,
      nodeEnv: env.NODE_ENV,
    },
    database: {
      uri: env.MONGODB_URI,
      name: env.DB_NAME || 'maison-darin',
    },
    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_EXPIRE,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRE,
    },
    cloudinary: {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
    },
    security: {
      bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
      rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
      maxFileSize: env.MAX_FILE_SIZE,
    },
    frontend: {
      url: env.FRONTEND_URL,
    },
  };
}

module.exports = {
  validateEnv,
  getConfig,
};