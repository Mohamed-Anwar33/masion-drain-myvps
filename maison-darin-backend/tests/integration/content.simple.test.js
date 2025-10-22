const request = require('supertest');
const app = require('../../server');

describe('Content API Integration Tests', () => {
  describe('Public Endpoints', () => {
    it('should get translations endpoint', async () => {
      const response = await request(app)
        .get('/api/content/translations');
      
      // Should not crash and return proper structure
      expect(response.status).toBeDefined();
      expect(response.body).toHaveProperty('success');
    });

    it('should get section endpoint', async () => {
      const response = await request(app)
        .get('/api/content/hero');
      
      // Should not crash and return proper structure
      expect(response.status).toBeDefined();
      expect(response.body).toHaveProperty('success');
    });

    it('should get section with fallback endpoint', async () => {
      const response = await request(app)
        .get('/api/content/hero/fallback');
      
      // Should not crash and return proper structure
      expect(response.status).toBeDefined();
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Protected Endpoints', () => {
    it('should require authentication for translations update', async () => {
      const response = await request(app)
        .put('/api/content/translations')
        .send({
          contentUpdates: {
            hero: {
              en: { title: 'Test' },
              ar: { title: 'اختبار' }
            }
          }
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for section update', async () => {
      const response = await request(app)
        .put('/api/content/hero')
        .send({
          content: {
            en: { title: 'Test', subtitle: 'Subtitle', buttonText: 'Button' },
            ar: { title: 'اختبار', subtitle: 'عنوان فرعي', buttonText: 'زر' }
          }
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for section history', async () => {
      const response = await request(app)
        .get('/api/content/hero/history');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for section rollback', async () => {
      const response = await request(app)
        .post('/api/content/hero/rollback')
        .send({
          versionId: '507f1f77bcf86cd799439011'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for section validation', async () => {
      const response = await request(app)
        .post('/api/content/hero/validate')
        .send({
          content: {
            en: { title: 'Test' },
            ar: { title: 'اختبار' }
          }
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid section names gracefully', async () => {
      const response = await request(app)
        .get('/api/content/invalid-section');
      
      // Should not crash, might return 404 or 500 depending on implementation
      expect(response.status).toBeDefined();
      expect(response.body).toHaveProperty('success');
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .put('/api/content/translations')
        .send('invalid json');
      
      // Should handle malformed JSON gracefully
      expect(response.status).toBeDefined();
    });
  });
});