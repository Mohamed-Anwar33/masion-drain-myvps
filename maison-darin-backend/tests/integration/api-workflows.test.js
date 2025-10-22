const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const SampleRequest = require('../../models/SampleRequest');
const ContactMessage = require('../../models/ContactMessage');
const Content = require('../../models/Content');
const Media = require('../../models/Media');

describe('API Workflows Integration Tests', () => {
  let authToken;
  let testUser;
  let testProduct;

  beforeEach(async () => {
    // Create test user and get auth token
    const userData = await factory.createUserWithHashedPassword();
    testUser = await User.create(userData);
    authToken = testUtils.generateToken({ 
      id: testUser._id, 
      email: testUser.email, 
      role: testUser.role 
    });

    // Create test product
    const productData = factory.createProduct();
    testProduct = await Product.create(productData);
  });

  describe('Authentication Workflow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      testUtils.validateApiResponse(loginResponse, 200);
      expect(loginResponse.body.data).toHaveProperty('tokens');
      expect(loginResponse.body.data.tokens).toHaveProperty('accessToken');
      expect(loginResponse.body.data.tokens).toHaveProperty('refreshToken');

      const { accessToken, refreshToken } = loginResponse.body.data.tokens;

      // 2. Verify token
      const verifyResponse = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`);

      testUtils.validateApiResponse(verifyResponse, 200);
      expect(verifyResponse.body.data.valid).toBe(true);

      // 3. Get profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      testUtils.validateApiResponse(profileResponse, 200);
      expect(profileResponse.body.data.user.email).toBe(testUser.email);

      // 4. Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      testUtils.validateApiResponse(refreshResponse, 200);
      expect(refreshResponse.body.data).toHaveProperty('accessToken');

      // 5. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      testUtils.validateApiResponse(logoutResponse, 200);
    });
  });

  describe('Product Management Workflow', () => {
    it('should complete full product management flow', async () => {
      // 1. Get all products (public)
      const getAllResponse = await request(app)
        .get('/api/products');

      testUtils.validateApiResponse(getAllResponse, 200);
      testUtils.validatePaginationResponse(getAllResponse);

      // 2. Get product by ID (public)
      const getByIdResponse = await request(app)
        .get(`/api/products/${testProduct._id}`);

      testUtils.validateApiResponse(getByIdResponse, 200);
      expect(getByIdResponse.body.data.product._id).toBe(testProduct._id.toString());

      // 3. Check availability (public)
      const availabilityResponse = await request(app)
        .get(`/api/products/${testProduct._id}/availability`);

      testUtils.validateApiResponse(availabilityResponse, 200);
      expect(availabilityResponse.body.data).toHaveProperty('available');

      // 4. Get featured products (public)
      const featuredResponse = await request(app)
        .get('/api/products/featured');

      testUtils.validateApiResponse(featuredResponse, 200);

      // 5. Get categories (public)
      const categoriesResponse = await request(app)
        .get('/api/products/categories');

      testUtils.validateApiResponse(categoriesResponse, 200);

      // 6. Create new product (admin)
      const newProductData = factory.createProduct();
      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProductData);

      testUtils.validateApiResponse(createResponse, 201);
      const createdProduct = createResponse.body.data.product;

      // 7. Update product (admin)
      const updateResponse = await request(app)
        .put(`/api/products/${createdProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          price: 200,
          name: {
            en: 'Updated Product Name',
            ar: 'اسم المنتج المحدث'
          }
        });

      testUtils.validateApiResponse(updateResponse, 200);
      expect(updateResponse.body.data.product.price).toBe(200);

      // 8. Update stock (admin)
      const stockResponse = await request(app)
        .patch(`/api/products/${createdProduct._id}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stock: 100 });

      testUtils.validateApiResponse(stockResponse, 200);
      expect(stockResponse.body.data.product.stock).toBe(100);

      // 9. Delete product (admin)
      const deleteResponse = await request(app)
        .delete(`/api/products/${createdProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(deleteResponse, 200);
    });
  });

  describe('Order Processing Workflow', () => {
    it('should complete full order processing flow', async () => {
      // 1. Create order (public)
      const orderData = factory.createOrder({
        items: [{
          product: testProduct._id,
          quantity: 2,
          price: testProduct.price,
          name: testProduct.name
        }],
        total: testProduct.price * 2
      });

      const createResponse = await request(app)
        .post('/api/orders')
        .send(orderData);

      testUtils.validateApiResponse(createResponse, 201);
      const createdOrder = createResponse.body.data.order;
      expect(createdOrder).toHaveProperty('orderNumber');

      // 2. Get order statistics (admin)
      const statsResponse = await request(app)
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(statsResponse, 200);

      // 3. Get all orders (admin)
      const getAllResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(getAllResponse, 200);
      testUtils.validatePaginationResponse(getAllResponse);

      // 4. Get order by ID (admin)
      const getByIdResponse = await request(app)
        .get(`/api/orders/${createdOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(getByIdResponse, 200);

      // 5. Update order status (admin)
      const statusResponse = await request(app)
        .put(`/api/orders/${createdOrder._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'confirmed' });

      testUtils.validateApiResponse(statusResponse, 200);

      // 6. Confirm order (admin)
      const confirmResponse = await request(app)
        .put(`/api/orders/${createdOrder._id}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(confirmResponse, 200);
    });
  });

  describe('Sample Request Workflow', () => {
    it('should complete full sample request flow', async () => {
      // 1. Submit sample request (public)
      const sampleData = factory.createSampleRequest({
        requestedProducts: [{
          product: testProduct._id,
          productName: testProduct.name,
          quantity: 1,
          sampleSize: '2ml'
        }]
      });

      const createResponse = await request(app)
        .post('/api/samples/request')
        .send(sampleData);

      testUtils.validateApiResponse(createResponse, 201);
      const createdSample = createResponse.body.data.sampleRequest;

      // 2. Get sample statistics (admin)
      const statsResponse = await request(app)
        .get('/api/samples/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(statsResponse, 200);

      // 3. Get all sample requests (admin)
      const getAllResponse = await request(app)
        .get('/api/samples')
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(getAllResponse, 200);
      testUtils.validatePaginationResponse(getAllResponse);

      // 4. Get sample request by ID (admin)
      const getByIdResponse = await request(app)
        .get(`/api/samples/${createdSample._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(getByIdResponse, 200);

      // 5. Update sample status (admin)
      const statusResponse = await request(app)
        .put(`/api/samples/${createdSample._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'approved' });

      testUtils.validateApiResponse(statusResponse, 200);

      // 6. Add admin note (admin)
      const noteResponse = await request(app)
        .post(`/api/samples/${createdSample._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ note: 'Sample approved for shipping' });

      testUtils.validateApiResponse(noteResponse, 200);

      // 7. Update shipping info (admin)
      const shippingResponse = await request(app)
        .put(`/api/samples/${createdSample._id}/shipping`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trackingNumber: 'TRACK123',
          shippingMethod: 'Express'
        });

      testUtils.validateApiResponse(shippingResponse, 200);
    });
  });

  describe('Contact Message Workflow', () => {
    it('should complete full contact message flow', async () => {
      // 1. Submit contact message (public)
      const contactData = factory.createContactMessage();

      const createResponse = await request(app)
        .post('/api/contact')
        .send(contactData);

      testUtils.validateApiResponse(createResponse, 201);
      const createdMessage = createResponse.body.data.contactMessage;

      // 2. Get contact statistics (admin)
      const statsResponse = await request(app)
        .get('/api/contact/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(statsResponse, 200);

      // 3. Get all contact messages (admin)
      const getAllResponse = await request(app)
        .get('/api/contact/messages')
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(getAllResponse, 200);
      testUtils.validatePaginationResponse(getAllResponse);

      // 4. Get contact message by ID (admin)
      const getByIdResponse = await request(app)
        .get(`/api/contact/messages/${createdMessage._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(getByIdResponse, 200);

      // 5. Update message status (admin)
      const statusResponse = await request(app)
        .put(`/api/contact/messages/${createdMessage._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress' });

      testUtils.validateApiResponse(statusResponse, 200);

      // 6. Add admin note (admin)
      const noteResponse = await request(app)
        .post(`/api/contact/messages/${createdMessage._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ note: 'Following up with customer' });

      testUtils.validateApiResponse(noteResponse, 200);

      // 7. Add response (admin)
      const responseResponse = await request(app)
        .post(`/api/contact/messages/${createdMessage._id}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Thank you for contacting us. We will get back to you soon.',
          method: 'email'
        });

      testUtils.validateApiResponse(responseResponse, 200);
    });
  });

  describe('Content Management Workflow', () => {
    it('should complete full content management flow', async () => {
      // 1. Get translations (public)
      const translationsResponse = await request(app)
        .get('/api/content/translations');

      testUtils.validateApiResponse(translationsResponse, 200);

      // 2. Create content (admin)
      const contentData = factory.createContent();
      const content = await Content.create(contentData);

      // 3. Get content by section (public)
      const sectionResponse = await request(app)
        .get(`/api/content/${content.section}`);

      testUtils.validateApiResponse(sectionResponse, 200);

      // 4. Update content (admin)
      const updateResponse = await request(app)
        .put(`/api/content/${content.section}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: {
            en: { title: 'Updated Title' },
            ar: { title: 'عنوان محدث' }
          }
        });

      testUtils.validateApiResponse(updateResponse, 200);

      // 5. Get content history (admin)
      const historyResponse = await request(app)
        .get(`/api/content/${content.section}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      testUtils.validateApiResponse(historyResponse, 200);
    });
  });

  describe('Health Check Workflow', () => {
    it('should complete health check workflow', async () => {
      // 1. Basic health check (public)
      const healthResponse = await request(app)
        .get('/api/health');

      testUtils.validateApiResponse(healthResponse, 200);

      // 2. Database health check (public)
      const dbHealthResponse = await request(app)
        .get('/api/health/database');

      expect(dbHealthResponse.status).toBeOneOf([200, 503]);

      // 3. Readiness probe (public)
      const readyResponse = await request(app)
        .get('/api/health/ready');

      expect(readyResponse.status).toBeOneOf([200, 503]);

      // 4. Liveness probe (public)
      const liveResponse = await request(app)
        .get('/api/health/live');

      expect(liveResponse.status).toBeOneOf([200, 503]);

      // 5. Detailed health check (admin)
      const detailedResponse = await request(app)
        .get('/api/health/detailed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(detailedResponse.status).toBeOneOf([200, 503]);
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle various error scenarios', async () => {
      // 1. Invalid authentication
      const unauthorizedResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      testUtils.validateErrorResponse(unauthorizedResponse, 401);

      // 2. Not found resource
      const notFoundResponse = await request(app)
        .get('/api/products/507f1f77bcf86cd799439011');

      testUtils.validateErrorResponse(notFoundResponse, 404);

      // 3. Validation error
      const validationResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalid: 'data' });

      testUtils.validateErrorResponse(validationResponse, 400);

      // 4. Rate limiting (simulate)
      const rateLimitResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      // Should eventually hit rate limit after multiple attempts
      expect(rateLimitResponse.status).toBeOneOf([400, 401, 429]);
    });
  });
});

// Custom Jest matcher for multiple possible values
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});