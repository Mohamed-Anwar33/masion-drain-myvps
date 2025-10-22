const request = require('supertest');
const app = require('../../test-server');
const { connectTestDB, clearTestDB, closeTestDB } = require('../helpers/database');
const { createUser, createProduct, createContent } = require('../factories');
const fs = require('fs');
const path = require('path');

describe('Frontend Integration Tests', () => {
  let authToken;
  let adminUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create admin user and get auth token
    adminUser = await createUser({ role: 'admin' });
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: 'password123'
      });
    
    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('Authentication Flow Integration', () => {
    test('should handle complete admin authentication workflow', async () => {
      // Test login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminUser.email,
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.accessToken).toBeDefined();
      expect(loginResponse.body.data.refreshToken).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe(adminUser.email);

      const newToken = loginResponse.body.data.accessToken;

      // Test protected route access
      const protectedResponse = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(protectedResponse.body.success).toBe(true);

      // Test token refresh
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken
        })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();

      // Test logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Test access after logout (should fail)
      await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(401);
    });

    test('should handle invalid credentials properly', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should handle expired token scenarios', async () => {
      // This would require mocking JWT expiration or using a very short-lived token
      // For now, we'll test with an invalid token format
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Product CRUD Operations Integration', () => {
    test('should handle complete product management workflow', async () => {
      // Create product
      const productData = {
        name: {
          en: 'Test Perfume',
          ar: 'عطر تجريبي'
        },
        description: {
          en: 'A beautiful test fragrance',
          ar: 'عطر جميل للاختبار'
        },
        price: 299.99,
        size: '100ml',
        category: 'floral',
        featured: true,
        inStock: true,
        stock: 50,
        concentration: {
          en: 'Eau de Parfum',
          ar: 'أو دو بارفان'
        },
        notes: {
          top: {
            en: ['Rose', 'Jasmine'],
            ar: ['ورد', 'ياسمين']
          },
          middle: {
            en: ['Sandalwood'],
            ar: ['صندل']
          },
          base: {
            en: ['Musk'],
            ar: ['مسك']
          }
        }
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name.en).toBe(productData.name.en);
      expect(createResponse.body.data.name.ar).toBe(productData.name.ar);

      const productId = createResponse.body.data._id;

      // Read product
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data._id).toBe(productId);

      // Update product
      const updateData = {
        price: 349.99,
        stock: 25
      };

      const updateResponse = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.price).toBe(updateData.price);
      expect(updateResponse.body.data.stock).toBe(updateData.stock);

      // List products with filters
      const listResponse = await request(app)
        .get('/api/products?category=floral&featured=true')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.products).toHaveLength(1);
      expect(listResponse.body.data.products[0]._id).toBe(productId);

      // Search products
      const searchResponse = await request(app)
        .get('/api/products?search=Test')
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.products).toHaveLength(1);

      // Delete product
      const deleteResponse = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify deletion
      await request(app)
        .get(`/api/products/${productId}`)
        .expect(404);
    });

    test('should handle product validation errors', async () => {
      const invalidProduct = {
        name: {
          en: 'Test'
          // Missing Arabic name
        },
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle multilingual search correctly', async () => {
      // Create products with Arabic and English content
      const product1 = await createProduct({
        name: { en: 'Rose Garden', ar: 'حديقة الورود' },
        description: { en: 'Beautiful rose fragrance', ar: 'عطر ورد جميل' }
      });

      const product2 = await createProduct({
        name: { en: 'Ocean Breeze', ar: 'نسيم المحيط' },
        description: { en: 'Fresh ocean scent', ar: 'رائحة المحيط المنعشة' }
      });

      // Search in English
      const englishSearch = await request(app)
        .get('/api/products?search=Rose')
        .expect(200);

      expect(englishSearch.body.data.products).toHaveLength(1);
      expect(englishSearch.body.data.products[0].name.en).toContain('Rose');

      // Search in Arabic
      const arabicSearch = await request(app)
        .get('/api/products?search=نسيم')
        .expect(200);

      expect(arabicSearch.body.data.products).toHaveLength(1);
      expect(arabicSearch.body.data.products[0].name.ar).toContain('نسيم');
    });
  });

  describe('Image Upload Integration', () => {
    test('should handle image upload workflow', async () => {
      // Create a test image buffer (1x1 pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
        0x60, 0x82
      ]);

      // Test image upload
      const uploadResponse = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImageBuffer, 'test-image.png')
        .expect(201);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data.cloudinaryUrl).toBeDefined();
      expect(uploadResponse.body.data.filename).toBe('test-image.png');

      const mediaId = uploadResponse.body.data._id;

      // Test image retrieval
      const getResponse = await request(app)
        .get('/api/media')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.media).toHaveLength(1);

      // Test image metadata update
      const updateResponse = await request(app)
        .put(`/api/media/${mediaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          alt: {
            en: 'Test image',
            ar: 'صورة تجريبية'
          },
          tags: ['test', 'product']
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.alt.en).toBe('Test image');

      // Test image deletion
      const deleteResponse = await request(app)
        .delete(`/api/media/${mediaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });

    test('should validate image file types', async () => {
      // Create a fake text file
      const textBuffer = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', textBuffer, 'fake-image.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    test('should handle file size limits', async () => {
      // Create a buffer larger than the limit (assuming 5MB limit)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeBuffer, 'large-image.png')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('Multilingual Content Management', () => {
    test('should handle content management workflow', async () => {
      // Create content
      const contentData = {
        section: 'hero',
        content: {
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
        }
      };

      const createResponse = await request(app)
        .put('/api/content/hero')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contentData)
        .expect(200);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.content.en.title).toBe(contentData.content.en.title);

      // Get content by section
      const getResponse = await request(app)
        .get('/api/content/hero')
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.content.ar.title).toBe(contentData.content.ar.title);

      // Get all translations
      const translationsResponse = await request(app)
        .get('/api/content/translations')
        .expect(200);

      expect(translationsResponse.body.success).toBe(true);
      expect(translationsResponse.body.data.hero).toBeDefined();

      // Update content
      const updateData = {
        content: {
          en: {
            ...contentData.content.en,
            title: 'Updated Welcome Message'
          },
          ar: {
            ...contentData.content.ar,
            title: 'رسالة ترحيب محدثة'
          }
        }
      };

      const updateResponse = await request(app)
        .put('/api/content/hero')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.content.en.title).toBe('Updated Welcome Message');
    });

    test('should handle content validation', async () => {
      const invalidContent = {
        section: 'invalid-section',
        content: {
          en: 'Invalid structure'
          // Missing Arabic content
        }
      };

      const response = await request(app)
        .put('/api/content/invalid-section')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidContent)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should provide content fallbacks', async () => {
      // Create content with only English
      const partialContent = await createContent({
        section: 'about',
        content: {
          en: { title: 'About Us', description: 'Our story' },
          ar: null // Missing Arabic content
        }
      });

      const response = await request(app)
        .get('/api/content/about')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content.en).toBeDefined();
      // Should handle missing Arabic gracefully
    });
  });

  describe('CORS and Security Integration', () => {
    test('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/products')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });

    test('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Origin', 'http://malicious-site.com')
        .expect(500); // CORS error

      // The exact behavior depends on CORS middleware implementation
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for security headers added by helmet
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    test('should handle rate limiting', async () => {
      // This test would need to be adjusted based on actual rate limits
      // For now, we'll just verify the rate limit headers are present
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      // Rate limit headers should be present
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle 404 errors properly', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Route /api/nonexistent-endpoint not found');
    });

    test('should handle validation errors with detailed messages', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty body
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });

    test('should handle server errors gracefully', async () => {
      // This would require mocking a server error condition
      // For now, we'll test with an invalid MongoDB ObjectId
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('API Response Format Consistency', () => {
    test('should maintain consistent response format across all endpoints', async () => {
      // Test various endpoints for consistent response structure
      const endpoints = [
        { method: 'get', path: '/api/health' },
        { method: 'get', path: '/api/products' },
        { method: 'get', path: '/api/content/translations' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.success).toBe('boolean');
      }
    });

    test('should include proper metadata in paginated responses', async () => {
      // Create multiple products for pagination testing
      await Promise.all([
        createProduct({ name: { en: 'Product 1', ar: 'منتج 1' } }),
        createProduct({ name: { en: 'Product 2', ar: 'منتج 2' } }),
        createProduct({ name: { en: 'Product 3', ar: 'منتج 3' } })
      ]);

      const response = await request(app)
        .get('/api/products?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeGreaterThan(1);
    });
  });
});