const request = require('supertest');
const app = require('../../server');

describe('Order API Integration Tests', () => {
  describe('GET /api/orders', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/orders', () => {
    it('should return 400 for invalid order data', async () => {
      const invalidOrderData = {
        items: [],
        total: 0
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_CREATE_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteOrderData = {
        items: [{
          product: '507f1f77bcf86cd799439011',
          quantity: 1,
          price: 99.99,
          name: { en: 'Test Product', ar: 'منتج تجريبي' }
        }],
        total: 99.99
        // Missing customerInfo and paymentMethod
      };

      const response = await request(app)
        .post('/api/orders')
        .send(incompleteOrderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_CREATE_ERROR');
      expect(response.body.error.message).toContain('Customer information is required');
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/orders/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/api/orders/507f1f77bcf86cd799439011/status')
        .send({ status: 'confirmed' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('API Route Structure', () => {
    it('should have order routes properly mounted', async () => {
      // Test that the routes exist (even if they return 401/400)
      const routes = [
        { method: 'get', path: '/api/orders', expectedStatus: 401 },
        { method: 'post', path: '/api/orders', expectedStatus: 400 },
        { method: 'get', path: '/api/orders/stats', expectedStatus: 401 },
        { method: 'get', path: '/api/orders/507f1f77bcf86cd799439011', expectedStatus: 401 },
        { method: 'put', path: '/api/orders/507f1f77bcf86cd799439011/status', expectedStatus: 401 },
        { method: 'put', path: '/api/orders/507f1f77bcf86cd799439011/confirm', expectedStatus: 401 },
        { method: 'put', path: '/api/orders/507f1f77bcf86cd799439011/cancel', expectedStatus: 401 },
        { method: 'put', path: '/api/orders/507f1f77bcf86cd799439011/refund', expectedStatus: 401 },
        { method: 'get', path: '/api/orders/507f1f77bcf86cd799439011/refund-eligibility', expectedStatus: 401 }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(route.expectedStatus);
      }
    });

    it('should return 401 for non-existent order routes (auth required)', async () => {
      const response = await request(app)
        .get('/api/orders/nonexistent-route')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});