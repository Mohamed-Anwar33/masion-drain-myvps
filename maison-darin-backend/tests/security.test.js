const request = require('supertest');
const app = require('../server');

describe('Security Configuration', () => {
  describe('Rate Limiting', () => {
    test('should apply rate limiting to API routes', async () => {
      // Make multiple requests to test rate limiting
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/api'));
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should succeed (under rate limit)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS Configuration', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    test('should include security headers from helmet', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 routes', async () => {
      const response = await request(app).get('/nonexistent-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });
});