/**
 * Production CORS Configuration
 * This file contains CORS settings optimized for production deployment
 */

const corsProductionConfig = {
  // Production origins - update these with actual domain names
  origin: function (origin, callback) {
    const allowedOrigins = [
      // Production domains
      'https://maisondarin.com',
      'https://www.maisondarin.com',
      
      // Staging domains
      'https://staging.maisondarin.com',
      'https://staging-admin.maisondarin.com',
      
      // Development (only if needed in production)
      ...(process.env.NODE_ENV !== 'production' ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:55802' // Browser preview proxy
      ] : [])
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  
  // Enable credentials for authentication
  credentials: true,
  
  // Preflight response status
  optionsSuccessStatus: 200,
  
  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Total-Count',
    'X-API-Version'
  ],
  
  // Exposed headers (headers that the client can access)
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-API-Version',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  
  // Preflight cache duration (24 hours)
  maxAge: 86400
};

// Development CORS configuration (more permissive)
const corsDevConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:55802' // Browser preview proxy
    ];
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check regex patterns for any localhost or 127.0.0.1 with any port
    const localhostPattern = /^http:\/\/localhost:\d+$/;
    const ipPattern = /^http:\/\/127\.0\.0\.1:\d+$/;
    
    if (localhostPattern.test(origin) || ipPattern.test(origin)) {
      return callback(null, true);
    }
    
    console.warn(`CORS allowing request from origin: ${origin} (development mode)`);
    callback(null, true); // Allow all in development for now
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Total-Count',
    'X-API-Version'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-API-Version',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ]
};

// Export appropriate configuration based on environment
const getCorsConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    return corsProductionConfig;
  } else if (process.env.NODE_ENV === 'staging') {
    return {
      ...corsProductionConfig,
      origin: function (origin, callback) {
        const allowedOrigins = [
          'https://staging.maisondarin.com',
          'https://staging-admin.maisondarin.com',
          'http://localhost:3000',
          'http://localhost:3001'
        ];
        
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      }
    };
  } else {
    return corsDevConfig;
  }
};

module.exports = {
  corsProductionConfig,
  corsDevConfig,
  getCorsConfig
};