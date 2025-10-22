const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const SampleRequest = require('../../models/SampleRequest');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { generateToken } = require('../../services/jwtService');

describe('SampleRequest Controller Tests', () => {
  let authToken;
  let testUser;
  let testProduct;
  let validSampleRequestData;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await SampleRequest.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Create test user and get auth token
    testUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    authToken = generateToken(testUser._id);

    // Create test product
    testProduct = await Product.create({
      name: { en: 'Test Perfume', ar: 'عطر تجريبي' },
      description: { en: 'Test Description', ar: 'وصف تجريبي' },
      price: 100,
      size: '50ml',
      category: 'floral',
      inStock: true,
      stock: 10
    });

    validSampleRequestData = {
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'USA'
        }
      },
      requestedProducts: [{
        product: testProduct._id,
        productName: {
          en: 'Test Perfume',
          ar: 'عطر تجريبي'
        },
        quantity: 2,
        sampleSize: '2ml'
      }],
      message: 'I would like to try this perfume',
      preferredLanguage: 'en'
    };
  });

  describe('POST /api/samples/request', () => {
    test('should create sample request with valid data', async () => {
      const response = await request(app)
        .post('/api/samples/request')
        .send(validSampleRequestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requestNumber).toBeDefined();
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.customerInfo.email).toBe('john.doe@example.com');
      expect(response.body.message).toBe('Sample request submitted successfully');
    });

    test('should reject request with missing required fields', async () => {
      delete validSampleRequestData.customerInfo.firstName;

      const response = await request(app)
        .post('/api/samples/request')
        .send(validSampleRequestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('First name is required');
    });

    test('should reject request with non-existent product', async () => {
      validSampleRequestData.requestedProducts[0].product = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/samples/request')
        .send(validSampleRequestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not available');
    });

    test('should enforce rate limiting', async () => {
      // Make 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/samples/request')
          .send({
            ...validSampleRequestData,
            customerInfo: {
              ...validSampleRequestData.customerInfo,
              email: `test${i}@example.com`
            }
          })
          .expect(201);
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/samples/request')
        .send({
          ...validSampleRequestData,
          customerInfo: {
            ...validSampleRequestData.customerInfo,
            email: 'test6@example.com'
          }
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('GET /api/samples', () => {
    beforeEach(async () => {
      // Create test sample requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/samples/request')
          .send({
            ...validSampleRequestData,
            customerInfo: {
              ...validSampleRequestData.customerInfo,
              email: `customer${i}@example.com`
            }
          });
      }
    });

    test('should get sample requests with authentication', async () => {
      const response = await request(app)
        .get('/api/samples')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalCount).toBe(5);
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/samples')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/api/samples?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      response.body.data.forEach(request => {
        expect(request.status).toBe('pending');
      });
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/samples?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    test('should search sample requests', async () => {
      const response = await request(app)
        .get('/api/samples?search=customer0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].customerInfo.email).toBe('customer0@example.com');
    });
  });

  describe('GET /api/samples/:id', () => {
    let sampleRequest;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/samples/request')
        .send(validSampleRequestData);
      sampleRequest = response.body.data;
    });

    test('should get sample request by ID', async () => {
      const response = await request(app)
        .get(`/api/samples/${sampleRequest._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(sampleRequest._id);
      expect(response.body.data.customerInfo.email).toBe('john.doe@example.com');
    });

    test('should return 404 for non-existent sample request', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/samples/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REQUEST_NOT_FOUND');
    });
  });

  describe('PUT /api/samples/:id/status', () => {
    let sampleRequest;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/samples/request')
        .send(validSampleRequestData);
      sampleRequest = response.body.data;
    });

    test('should update sample request status', async () => {
      const response = await request(app)
        .put(`/api/samples/${sampleRequest._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'approved',
          reason: 'Approved for processing'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
      expect(response.body.message).toBe('Sample request status updated successfully');
    });

    test('should reject invalid status transition', async () => {
      const response = await request(app)
        .put(`/api/samples/${sampleRequest._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'delivered'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid status transition');
    });

    test('should require status field', async () => {
      const response = await request(app)
        .put(`/api/samples/${sampleRequest._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Status is required');
    });
  });

  describe('POST /api/samples/:id/notes', () => {
    let sampleRequest;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/samples/request')
        .send(validSampleRequestData);
      sampleRequest = response.body.data;
    });

    test('should add admin note', async () => {
      const response = await request(app)
        .post(`/api/samples/${sampleRequest._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          note: 'Customer called to confirm address'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.adminNotes).toHaveLength(1);
      expect(response.body.data.adminNotes[0].note).toBe('Customer called to confirm address');
      expect(response.body.message).toBe('Admin note added successfully');
    });

    test('should require note field', async () => {
      const response = await request(app)
        .post(`/api/samples/${sampleRequest._id}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Note is required');
    });
  });

  describe('PUT /api/samples/:id/shipping', () => {
    let sampleRequest;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/samples/request')
        .send(validSampleRequestData);
      sampleRequest = response.body.data;
    });

    test('should update shipping information', async () => {
      const shippingInfo = {
        trackingNumber: 'TRK123456789',
        shippingMethod: 'express',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .put(`/api/samples/${sampleRequest._id}/shipping`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shippingInfo)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.shippingInfo.trackingNumber).toBe('TRK123456789');
      expect(response.body.data.shippingInfo.shippingMethod).toBe('express');
      expect(response.body.message).toBe('Shipping information updated successfully');
    });
  });

  describe('GET /api/samples/statistics', () => {
    beforeEach(async () => {
      // Create test sample requests with different statuses
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/samples/request')
          .send({
            ...validSampleRequestData,
            customerInfo: {
              ...validSampleRequestData.customerInfo,
              email: `customer${i}@example.com`
            }
          });

        // Update some statuses
        if (i < 3) {
          await request(app)
            .put(`/api/samples/${response.body.data._id}/status`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ status: 'approved' });
        }
      }
    });

    test('should get sample request statistics', async () => {
      const response = await request(app)
        .get('/api/samples/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRequests).toBe(10);
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.filtered).toBeDefined();
    });

    test('should filter statistics by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .get(`/api/samples/statistics?startDate=${yesterday}&endDate=${tomorrow}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRequests).toBe(10);
    });
  });
});