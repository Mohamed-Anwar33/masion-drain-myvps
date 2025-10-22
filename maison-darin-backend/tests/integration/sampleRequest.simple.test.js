const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const SampleRequest = require('../../models/SampleRequest');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { generateToken } = require('../../services/jwtService');

describe('Sample Request Integration Tests', () => {
  let authToken;
  let testUser;
  let testProduct;

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
      name: { en: 'Luxury Rose Perfume', ar: 'عطر الورد الفاخر' },
      description: { en: 'A beautiful rose fragrance', ar: 'عطر ورد جميل' },
      price: 150,
      size: '50ml',
      category: 'floral',
      inStock: true,
      stock: 20
    });
  });

  test('Complete sample request workflow', async () => {
    // Step 1: Customer submits sample request
    const sampleRequestData = {
      customerInfo: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1234567890',
        address: {
          street: '456 Oak Avenue',
          city: 'Los Angeles',
          postalCode: '90210',
          country: 'USA'
        }
      },
      requestedProducts: [{
        product: testProduct._id,
        productName: {
          en: 'Luxury Rose Perfume',
          ar: 'عطر الورد الفاخر'
        },
        quantity: 2,
        sampleSize: '2ml'
      }],
      message: 'I am interested in trying this rose perfume before purchasing.',
      preferredLanguage: 'en'
    };

    const submitResponse = await request(app)
      .post('/api/samples/request')
      .send(sampleRequestData)
      .expect(201);

    expect(submitResponse.body.success).toBe(true);
    expect(submitResponse.body.data.requestNumber).toBeDefined();
    expect(submitResponse.body.data.status).toBe('pending');

    const requestId = submitResponse.body.data._id;

    // Step 2: Admin views the sample request
    const getResponse = await request(app)
      .get(`/api/samples/${requestId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.data.customerInfo.email).toBe('sarah.johnson@example.com');
    expect(getResponse.body.data.requestedProducts).toHaveLength(1);

    // Step 3: Admin adds a note
    const noteResponse = await request(app)
      .post(`/api/samples/${requestId}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        note: 'Customer has good purchase history, approve request'
      })
      .expect(200);

    expect(noteResponse.body.success).toBe(true);
    expect(noteResponse.body.data.adminNotes).toHaveLength(1);

    // Step 4: Admin approves the request
    const approveResponse = await request(app)
      .put(`/api/samples/${requestId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'approved',
        reason: 'Request approved for processing'
      })
      .expect(200);

    expect(approveResponse.body.success).toBe(true);
    expect(approveResponse.body.data.status).toBe('approved');

    // Step 5: Admin moves to processing
    const processResponse = await request(app)
      .put(`/api/samples/${requestId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'processing',
        reason: 'Samples being prepared'
      })
      .expect(200);

    expect(processResponse.body.success).toBe(true);
    expect(processResponse.body.data.status).toBe('processing');

    // Step 6: Admin updates shipping information
    const shippingResponse = await request(app)
      .put(`/api/samples/${requestId}/shipping`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        trackingNumber: 'TRK123456789',
        shippingMethod: 'express',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      })
      .expect(200);

    expect(shippingResponse.body.success).toBe(true);
    expect(shippingResponse.body.data.shippingInfo.trackingNumber).toBe('TRK123456789');

    // Step 7: Admin marks as shipped
    const shipResponse = await request(app)
      .put(`/api/samples/${requestId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'shipped',
        reason: 'Samples shipped via express delivery'
      })
      .expect(200);

    expect(shipResponse.body.success).toBe(true);
    expect(shipResponse.body.data.status).toBe('shipped');
    expect(shipResponse.body.data.shippingInfo.shippedAt).toBeDefined();

    // Step 8: Admin marks as delivered
    const deliverResponse = await request(app)
      .put(`/api/samples/${requestId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'delivered',
        reason: 'Samples delivered successfully'
      })
      .expect(200);

    expect(deliverResponse.body.success).toBe(true);
    expect(deliverResponse.body.data.status).toBe('delivered');
    expect(deliverResponse.body.data.shippingInfo.deliveredAt).toBeDefined();

    // Step 9: Verify final state
    const finalResponse = await request(app)
      .get(`/api/samples/${requestId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const finalRequest = finalResponse.body.data;
    expect(finalRequest.status).toBe('delivered');
    expect(finalRequest.statusHistory).toHaveLength(6); // pending -> approved -> processing -> shipped -> delivered
    expect(finalRequest.adminNotes).toHaveLength(1);
    expect(finalRequest.shippingInfo.trackingNumber).toBe('TRK123456789');
    expect(finalRequest.shippingInfo.shippedAt).toBeDefined();
    expect(finalRequest.shippingInfo.deliveredAt).toBeDefined();

    // Step 10: Check statistics
    const statsResponse = await request(app)
      .get('/api/samples/statistics')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(statsResponse.body.success).toBe(true);
    expect(statsResponse.body.data.totalRequests).toBe(1);
    expect(statsResponse.body.data.byStatus.delivered).toBeDefined();
    expect(statsResponse.body.data.byStatus.delivered.count).toBe(1);
  });

  test('Sample request rejection workflow', async () => {
    // Step 1: Customer submits sample request
    const sampleRequestData = {
      customerInfo: {
        firstName: 'John',
        lastName: 'Spam',
        email: 'spam@tempmail.org', // Suspicious domain
        phone: '+1234567890',
        address: {
          street: '123 Fake St',
          city: 'Nowhere',
          postalCode: '00000',
          country: 'Unknown'
        }
      },
      requestedProducts: [{
        product: testProduct._id,
        productName: {
          en: 'Luxury Rose Perfume',
          ar: 'عطر الورد الفاخر'
        },
        quantity: 5, // Maximum allowed
        sampleSize: '5ml'
      }],
      message: 'I want free samples now! Check out https://spam1.com and https://spam2.com and https://spam3.com and https://spam4.com',
      preferredLanguage: 'en'
    };

    const submitResponse = await request(app)
      .post('/api/samples/request')
      .send(sampleRequestData)
      .expect(201);

    expect(submitResponse.body.success).toBe(true);
    const requestId = submitResponse.body.data._id;

    // Step 2: Admin reviews the request (should have high spam score)
    const getResponse = await request(app)
      .get(`/api/samples/${requestId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.data.spamScore).toBeGreaterThan(0);
    expect(getResponse.body.data.spamReasons.length).toBeGreaterThan(0);

    // Step 3: Admin adds note about suspicious request
    await request(app)
      .post(`/api/samples/${requestId}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        note: 'Suspicious request - high spam score, suspicious email domain'
      })
      .expect(200);

    // Step 4: Admin rejects the request
    const rejectResponse = await request(app)
      .put(`/api/samples/${requestId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'rejected',
        reason: 'Request rejected due to suspicious activity'
      })
      .expect(200);

    expect(rejectResponse.body.success).toBe(true);
    expect(rejectResponse.body.data.status).toBe('rejected');

    // Step 5: Verify final state
    const finalResponse = await request(app)
      .get(`/api/samples/${requestId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const finalRequest = finalResponse.body.data;
    expect(finalRequest.status).toBe('rejected');
    expect(finalRequest.statusHistory).toHaveLength(2); // pending -> rejected
    expect(finalRequest.adminNotes).toHaveLength(1);
  });

  test('Admin sample request management workflow', async () => {
    // Create multiple sample requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post('/api/samples/request')
        .send({
          customerInfo: {
            firstName: `Customer${i}`,
            lastName: 'Test',
            email: `customer${i}@example.com`,
            phone: '+1234567890',
            address: {
              street: '123 Test St',
              city: 'Test City',
              postalCode: '12345',
              country: 'Test Country'
            }
          },
          requestedProducts: [{
            product: testProduct._id,
            productName: testProduct.name,
            quantity: i + 1,
            sampleSize: '2ml'
          }],
          message: `Test message ${i}`,
          preferredLanguage: 'en'
        });
      requests.push(response.body.data);
    }

    // Step 1: Admin views all requests
    const allRequestsResponse = await request(app)
      .get('/api/samples')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(allRequestsResponse.body.success).toBe(true);
    expect(allRequestsResponse.body.data).toHaveLength(5);
    expect(allRequestsResponse.body.pagination.totalCount).toBe(5);

    // Step 2: Admin filters by status
    const pendingResponse = await request(app)
      .get('/api/samples?status=pending')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(pendingResponse.body.data).toHaveLength(5);

    // Step 3: Admin searches for specific customer
    const searchResponse = await request(app)
      .get('/api/samples?search=Customer1')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(searchResponse.body.data).toHaveLength(1);
    expect(searchResponse.body.data[0].customerInfo.firstName).toBe('Customer1');

    // Step 4: Admin processes requests in bulk
    for (let i = 0; i < 3; i++) {
      await request(app)
        .put(`/api/samples/${requests[i]._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'approved',
          reason: `Bulk approval ${i}`
        })
        .expect(200);
    }

    // Step 5: Admin checks statistics
    const statsResponse = await request(app)
      .get('/api/samples/statistics')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(statsResponse.body.success).toBe(true);
    expect(statsResponse.body.data.totalRequests).toBe(5);
    expect(statsResponse.body.data.byStatus.pending.count).toBe(2);
    expect(statsResponse.body.data.byStatus.approved.count).toBe(3);

    // Step 6: Admin filters by approved status
    const approvedResponse = await request(app)
      .get('/api/samples?status=approved')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(approvedResponse.body.data).toHaveLength(3);
    approvedResponse.body.data.forEach(request => {
      expect(request.status).toBe('approved');
    });
  });
});