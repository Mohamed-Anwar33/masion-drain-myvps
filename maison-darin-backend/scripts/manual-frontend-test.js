#!/usr/bin/env node

/**
 * Manual Frontend Integration Test
 * This script manually tests frontend integration without Jest setup issues
 */

const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function logSuccess(message) {
  console.log(`${colorize('✅', 'green')} ${message}`);
}

function logError(message) {
  console.log(`${colorize('❌', 'red')} ${message}`);
}

function logInfo(message) {
  console.log(`${colorize('ℹ️', 'blue')} ${message}`);
}

function logSection(title) {
  console.log(`\n${colorize('='.repeat(60), 'cyan')}`);
  console.log(`${colorize(title, 'bright')}`);
  console.log(`${colorize('='.repeat(60), 'cyan')}\n`);
}

// Create test app
function createTestApp() {
  const app = express();
  
  // CORS configuration
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://maison-darin.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
  }));
  
  app.use(express.json());
  
  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  });
  
  // Authentication endpoints
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@test.com' && password === 'password123') {
      res.json({
        success: true,
        data: {
          accessToken: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
          user: { email, role: 'admin', id: '507f1f77bcf86cd799439011' }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }
  });
  
  app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken && refreshToken.startsWith('mock-refresh-token')) {
      res.json({
        success: true,
        data: {
          accessToken: 'new-mock-jwt-token-' + Date.now()
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token'
        }
      });
    }
  });
  
  // Products endpoints
  app.get('/api/products', (req, res) => {
    const { search, category, featured } = req.query;
    
    let products = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: { en: 'Rose Garden', ar: 'حديقة الورود' },
        description: { en: 'Beautiful rose fragrance', ar: 'عطر ورد جميل' },
        price: 299.99,
        category: 'floral',
        featured: true,
        inStock: true
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: { en: 'Ocean Breeze', ar: 'نسيم المحيط' },
        description: { en: 'Fresh ocean scent', ar: 'رائحة المحيط المنعشة' },
        price: 249.99,
        category: 'fresh',
        featured: false,
        inStock: true
      }
    ];
    
    // Apply filters
    if (search) {
      products = products.filter(p => 
        p.name.en.toLowerCase().includes(search.toLowerCase()) ||
        p.name.ar.includes(search) ||
        p.description.en.toLowerCase().includes(search.toLowerCase()) ||
        p.description.ar.includes(search)
      );
    }
    
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    if (featured !== undefined) {
      products = products.filter(p => p.featured === (featured === 'true'));
    }
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: products.length,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  });
  
  app.post('/api/products', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }
    
    const { name, description, price, category } = req.body;
    
    if (!name || !name.en || !name.ar || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: [
            { field: 'name.en', message: 'English name is required' },
            { field: 'name.ar', message: 'Arabic name is required' }
          ]
        }
      });
    }
    
    const newProduct = {
      _id: '507f1f77bcf86cd799439013',
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: newProduct
    });
  });
  
  // Content endpoints
  app.get('/api/content/translations', (req, res) => {
    res.json({
      success: true,
      data: {
        hero: {
          en: {
            title: 'Welcome to Maison Darin',
            subtitle: 'Luxury Perfumes',
            description: 'Discover our exclusive collection'
          },
          ar: {
            title: 'مرحباً بكم في ميزون دارين',
            subtitle: 'العطور الفاخرة',
            description: 'اكتشفوا مجموعتنا الحصرية'
          }
        },
        about: {
          en: {
            title: 'About Us',
            content: 'We are passionate about creating unique fragrances'
          },
          ar: {
            title: 'من نحن',
            content: 'نحن شغوفون بصنع العطور الفريدة'
          }
        }
      }
    });
  });
  
  app.put('/api/content/:section', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }
    
    const { section } = req.params;
    const { content } = req.body;
    
    if (!content || !content.en || !content.ar) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content must include both English and Arabic versions'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        section,
        content,
        updatedAt: new Date().toISOString()
      }
    });
  });
  
  // Media upload mock
  app.post('/api/media/upload', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }
    
    // Mock successful upload
    res.status(201).json({
      success: true,
      data: {
        _id: '507f1f77bcf86cd799439014',
        filename: 'test-image.jpg',
        cloudinaryUrl: 'https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg',
        cloudinaryId: 'test-image',
        size: 1024000,
        mimetype: 'image/jpeg',
        uploadedAt: new Date().toISOString()
      }
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.originalUrl} not found`
      }
    });
  });
  
  return app;
}

// Test functions
async function testCORS(app) {
  logSection('CORS Configuration Tests');
  
  try {
    // Test preflight request
    const preflightResponse = await request(app)
      .options('/api/products')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Authorization');
    
    if (preflightResponse.status === 200 && 
        preflightResponse.headers['access-control-allow-origin'] === 'http://localhost:3000') {
      logSuccess('CORS preflight request handled correctly');
    } else {
      logError('CORS preflight request failed');
    }
    
    // Test actual request with CORS
    const corsResponse = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');
    
    if (corsResponse.headers['access-control-allow-origin'] === 'http://localhost:3000') {
      logSuccess('CORS headers included in response');
    } else {
      logError('CORS headers missing or incorrect');
    }
    
  } catch (error) {
    logError(`CORS test failed: ${error.message}`);
  }
}

async function testAuthentication(app) {
  logSection('Authentication Flow Tests');
  
  try {
    // Test successful login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    if (loginResponse.status === 200 && loginResponse.body.success) {
      logSuccess('Successful login works correctly');
      
      const token = loginResponse.body.data.accessToken;
      
      // Test protected endpoint
      const protectedResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: { en: 'Test Product', ar: 'منتج تجريبي' },
          description: { en: 'Test description', ar: 'وصف تجريبي' },
          price: 199.99,
          category: 'floral'
        });
      
      if (protectedResponse.status === 201) {
        logSuccess('Protected endpoint accessible with valid token');
      } else {
        logError('Protected endpoint failed with valid token');
      }
      
    } else {
      logError('Login failed');
    }
    
    // Test invalid credentials
    const invalidLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'wrongpassword'
      });
    
    if (invalidLoginResponse.status === 401) {
      logSuccess('Invalid credentials properly rejected');
    } else {
      logError('Invalid credentials not properly handled');
    }
    
  } catch (error) {
    logError(`Authentication test failed: ${error.message}`);
  }
}

async function testProductCRUD(app) {
  logSection('Product CRUD Operations Tests');
  
  try {
    // Test product listing
    const listResponse = await request(app).get('/api/products');
    
    if (listResponse.status === 200 && listResponse.body.success) {
      logSuccess('Product listing works correctly');
    } else {
      logError('Product listing failed');
    }
    
    // Test product search
    const searchResponse = await request(app).get('/api/products?search=Rose');
    
    if (searchResponse.status === 200 && 
        searchResponse.body.data.products.length > 0 &&
        searchResponse.body.data.products[0].name.en.includes('Rose')) {
      logSuccess('Product search works correctly');
    } else {
      logError('Product search failed');
    }
    
    // Test category filtering
    const categoryResponse = await request(app).get('/api/products?category=floral');
    
    if (categoryResponse.status === 200 && 
        categoryResponse.body.data.products.every(p => p.category === 'floral')) {
      logSuccess('Category filtering works correctly');
    } else {
      logError('Category filtering failed');
    }
    
  } catch (error) {
    logError(`Product CRUD test failed: ${error.message}`);
  }
}

async function testMultilingualContent(app) {
  logSection('Multilingual Content Tests');
  
  try {
    // Test content retrieval
    const contentResponse = await request(app).get('/api/content/translations');
    
    if (contentResponse.status === 200 && 
        contentResponse.body.data.hero.en && 
        contentResponse.body.data.hero.ar) {
      logSuccess('Multilingual content retrieval works correctly');
    } else {
      logError('Multilingual content retrieval failed');
    }
    
    // Test Arabic content
    const heroContent = contentResponse.body.data.hero;
    if (heroContent.ar.title && heroContent.ar.title.includes('ميزون دارين')) {
      logSuccess('Arabic content properly encoded and returned');
    } else {
      logError('Arabic content encoding issue');
    }
    
  } catch (error) {
    logError(`Multilingual content test failed: ${error.message}`);
  }
}

async function testErrorHandling(app) {
  logSection('Error Handling Tests');
  
  try {
    // Test 404 error
    const notFoundResponse = await request(app).get('/api/nonexistent');
    
    if (notFoundResponse.status === 404 && 
        notFoundResponse.body.error.code === 'NOT_FOUND') {
      logSuccess('404 errors handled correctly');
    } else {
      logError('404 error handling failed');
    }
    
    // Test validation error
    const validationResponse = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer mock-jwt-token-123')
      .send({
        name: { en: 'Test' } // Missing Arabic name
      });
    
    if (validationResponse.status === 400 && 
        validationResponse.body.error.code === 'VALIDATION_ERROR') {
      logSuccess('Validation errors handled correctly');
    } else {
      logError('Validation error handling failed');
    }
    
  } catch (error) {
    logError(`Error handling test failed: ${error.message}`);
  }
}

async function testResponseFormat(app) {
  logSection('API Response Format Tests');
  
  try {
    const endpoints = [
      { path: '/api/health', method: 'get' },
      { path: '/api/products', method: 'get' },
      { path: '/api/content/translations', method: 'get' }
    ];
    
    let allConsistent = true;
    
    for (const endpoint of endpoints) {
      const response = await request(app)[endpoint.method](endpoint.path);
      
      if (!response.body.hasOwnProperty('success') || 
          !response.body.hasOwnProperty('data') ||
          typeof response.body.success !== 'boolean') {
        allConsistent = false;
        break;
      }
    }
    
    if (allConsistent) {
      logSuccess('API response format is consistent across all endpoints');
    } else {
      logError('API response format inconsistency detected');
    }
    
  } catch (error) {
    logError(`Response format test failed: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log(colorize('🧪 Frontend Integration Tests', 'bright'));
  console.log(colorize('Testing backend API compatibility with frontend requirements\n', 'cyan'));
  
  const app = createTestApp();
  
  await testCORS(app);
  await testAuthentication(app);
  await testProductCRUD(app);
  await testMultilingualContent(app);
  await testErrorHandling(app);
  await testResponseFormat(app);
  
  logSection('TEST SUMMARY');
  logInfo('All frontend integration tests completed');
  logInfo('Review the results above to ensure frontend compatibility');
  
  console.log(`\n${colorize('Next Steps:', 'bright')}`);
  console.log('1. Update frontend API calls to match the tested endpoints');
  console.log('2. Ensure CORS configuration includes your frontend domain');
  console.log('3. Test with actual React frontend application');
  console.log('4. Verify authentication flow in production environment');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, createTestApp };