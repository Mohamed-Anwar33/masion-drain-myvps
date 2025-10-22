const request = require('supertest');
const app = require('../../server');

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject expired tokens', async () => {
      // Create an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYxODg0NzIwMCwiZXhwIjoxNjE4ODQ3MjAwfQ.invalid';
      
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Input Validation Security', () => {
    let authToken;

    beforeAll(async () => {
      // Get auth token for authenticated requests
      const adminUser = await factory.create('User', {
        email: 'admin@test.com',
        role: 'admin'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      authToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should prevent SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE products; --";
      
      const response = await request(app)
        .get(`/api/products?search=${encodeURIComponent(maliciousInput)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should return normal response, not execute malicious SQL
      expect(response.body.success).toBe(true);
    });

    it('should prevent XSS attacks in product creation', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: xssPayload,
          description: 'Test product',
          price: 100,
          stock: 10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate file upload security', async () => {
      // Try to upload a malicious file
      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('<?php echo "hack"; ?>'), 'malicious.php')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid file type');
    });
  }); 
 describe('Authorization Security', () => {
    let userToken;
    let adminToken;

    beforeAll(async () => {
      // Create regular user
      const regularUser = await factory.create('User', {
        email: 'user@test.com',
        role: 'user'
      });

      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'password123'
        });

      userToken = userLogin.body.data.tokens.accessToken;

      // Create admin user
      const adminUser = await factory.create('User', {
        email: 'admin@test.com',
        role: 'admin'
      });

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      adminToken = adminLogin.body.data.tokens.accessToken;
    });

    it('should prevent regular users from accessing admin endpoints', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Product',
          price: 100
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should allow admin users to access admin endpoints', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent users from accessing other users data', async () => {
      // Create another user's order
      const otherUser = await factory.create('User', {
        email: 'other@test.com'
      });

      const otherOrder = await factory.create('Order', {
        customer_id: otherUser._id
      });

      const response = await request(app)
        .get(`/api/orders/${otherOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive data in responses', async () => {
      const user = await factory.create('User', {
        email: 'test@example.com',
        password: 'hashedpassword123'
      });

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(200);

      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should encrypt sensitive payment data', async () => {
      const paymentData = {
        card_number: '4111111111111111',
        cvv: '123',
        expiry: '12/25'
      };

      // Payment data should be encrypted before storage
      const response = await request(app)
        .post('/api/payments/process')
        .send(paymentData);

      // Verify that raw card data is not stored
      expect(response.body.data).not.toContain('4111111111111111');
    });
  });

  describe('CORS and Headers Security', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/products')
        .set('Origin', 'https://maisondarin.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
});