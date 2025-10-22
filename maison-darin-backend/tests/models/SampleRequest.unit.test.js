const mongoose = require('mongoose');
const SampleRequest = require('../../models/SampleRequest');
const Product = require('../../models/Product');
const User = require('../../models/User');

describe('SampleRequest Model Unit Tests', () => {
  let validSampleRequestData;
  let testProduct;
  let testUser;

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

    // Create test user
    testUser = await User.create({
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin'
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

  describe('Schema Validation', () => {
    test('should create sample request with valid data', async () => {
      const sampleRequest = new SampleRequest(validSampleRequestData);
      const savedRequest = await sampleRequest.save();

      expect(savedRequest._id).toBeDefined();
      expect(savedRequest.requestNumber).toBeDefined();
      expect(savedRequest.status).toBe('pending');
      expect(savedRequest.duplicateCheckHash).toBeDefined();
      expect(savedRequest.statusHistory).toHaveLength(1);
    });

    test('should require customer first name', async () => {
      delete validSampleRequestData.customerInfo.firstName;
      const sampleRequest = new SampleRequest(validSampleRequestData);

      await expect(sampleRequest.save()).rejects.toThrow('First name is required');
    });

    test('should require customer email', async () => {
      delete validSampleRequestData.customerInfo.email;
      const sampleRequest = new SampleRequest(validSampleRequestData);

      await expect(sampleRequest.save()).rejects.toThrow('Email is required');
    });

    test('should validate email format', async () => {
      validSampleRequestData.customerInfo.email = 'invalid-email';
      const sampleRequest = new SampleRequest(validSampleRequestData);

      await expect(sampleRequest.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should validate phone number format', async () => {
      validSampleRequestData.customerInfo.phone = 'invalid-phone';
      const sampleRequest = new SampleRequest(validSampleRequestData);

      await expect(sampleRequest.save()).rejects.toThrow('Please enter a valid phone number');
    });

    test('should require at least one requested product', async () => {
      validSampleRequestData.requestedProducts = [];
      const sampleRequest = new SampleRequest(validSampleRequestData);

      await expect(sampleRequest.save()).rejects.toThrow();
    });

    test('should validate quantity limits', async () => {
      validSampleRequestData.requestedProducts[0].quantity = 10;
      const sampleRequest = new SampleRequest(validSampleRequestData);

      await expect(sampleRequest.save()).rejects.toThrow('Maximum 5 samples per product allowed');
    });

    test('should validate status enum', async () => {
      const sampleRequest = new SampleRequest(validSampleRequestData);
      sampleRequest.status = 'invalid-status';

      await expect(sampleRequest.save()).rejects.toThrow();
    });

    test('should validate sample size enum', async () => {
      validSampleRequestData.requestedProducts[0].sampleSize = 'invalid-size';
      const sampleRequest = new SampleRequest(validSampleRequestData);

      await expect(sampleRequest.save()).rejects.toThrow();
    });
  });

  describe('Request Number Generation', () => {
    test('should generate unique request numbers', async () => {
      const request1 = new SampleRequest(validSampleRequestData);
      await request1.save();

      const request2Data = { ...validSampleRequestData };
      request2Data.customerInfo.email = 'different@example.com';
      const request2 = new SampleRequest(request2Data);
      await request2.save();

      expect(request1.requestNumber).toBeDefined();
      expect(request2.requestNumber).toBeDefined();
      expect(request1.requestNumber).not.toBe(request2.requestNumber);
      expect(request1.requestNumber).toMatch(/^SR\d{10}$/);
    });
  });

  describe('Duplicate Detection', () => {
    test('should generate duplicate hash', async () => {
      const sampleRequest = new SampleRequest(validSampleRequestData);
      const hash = sampleRequest.generateDuplicateHash();

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 hash length
    });

    test('should detect duplicate requests', async () => {
      const request1 = new SampleRequest(validSampleRequestData);
      await request1.save();

      const request2 = new SampleRequest(validSampleRequestData);
      const duplicate = await request2.checkForDuplicates();

      expect(duplicate).toBeTruthy();
      expect(duplicate._id.toString()).toBe(request1._id.toString());
    });

    test('should not detect duplicates for different customers', async () => {
      const request1 = new SampleRequest(validSampleRequestData);
      await request1.save();

      const request2Data = { ...validSampleRequestData };
      request2Data.customerInfo.email = 'different@example.com';
      const request2 = new SampleRequest(request2Data);
      const duplicate = await request2.checkForDuplicates();

      expect(duplicate).toBeNull();
    });

    test('should not detect duplicates for old requests', async () => {
      const request1 = new SampleRequest(validSampleRequestData);
      // Set created date to 35 days ago
      request1.createdAt = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
      await request1.save();

      const request2 = new SampleRequest(validSampleRequestData);
      const duplicate = await request2.checkForDuplicates();

      expect(duplicate).toBeNull();
    });
  });

  describe('Status Management', () => {
    test('should update status with history', async () => {
      const sampleRequest = new SampleRequest(validSampleRequestData);
      await sampleRequest.save();

      await sampleRequest.updateStatus('approved', testUser._id, 'Approved for processing');

      expect(sampleRequest.status).toBe('approved');
      expect(sampleRequest.statusHistory).toHaveLength(2);
      expect(sampleRequest.statusHistory[1].status).toBe('approved');
      expect(sampleRequest.statusHistory[1].changedBy.toString()).toBe(testUser._id.toString());
      expect(sampleRequest.statusHistory[1].reason).toBe('Approved for processing');
    });

    test('should update shipping timestamps on status change', async () => {
      const sampleRequest = new SampleRequest(validSampleRequestData);
      await sampleRequest.save();

      await sampleRequest.updateStatus('shipped', testUser._id);
      expect(sampleRequest.shippingInfo.shippedAt).toBeDefined();

      await sampleRequest.updateStatus('delivered', testUser._id);
      expect(sampleRequest.shippingInfo.deliveredAt).toBeDefined();
    });
  });

  describe('Admin Notes', () => {
    test('should add admin notes', async () => {
      const sampleRequest = new SampleRequest(validSampleRequestData);
      await sampleRequest.save();

      await sampleRequest.addAdminNote('Customer called to confirm address', testUser._id);

      expect(sampleRequest.adminNotes).toHaveLength(1);
      expect(sampleRequest.adminNotes[0].note).toBe('Customer called to confirm address');
      expect(sampleRequest.adminNotes[0].addedBy.toString()).toBe(testUser._id.toString());
    });
  });

  describe('Static Methods', () => {
    test('should find requests by email', async () => {
      const request1 = new SampleRequest(validSampleRequestData);
      await request1.save();

      const request2Data = { ...validSampleRequestData };
      request2Data.customerInfo.email = 'different@example.com';
      const request2 = new SampleRequest(request2Data);
      await request2.save();

      const results = await SampleRequest.findByEmail('john.doe@example.com');
      expect(results).toHaveLength(1);
      expect(results[0]._id.toString()).toBe(request1._id.toString());
    });

    test('should find requests by status', async () => {
      const request1 = new SampleRequest(validSampleRequestData);
      await request1.save();
      await request1.updateStatus('approved', testUser._id);

      const request2Data = { ...validSampleRequestData };
      request2Data.customerInfo.email = 'different@example.com';
      const request2 = new SampleRequest(request2Data);
      await request2.save();

      const pendingResults = await SampleRequest.findByStatus('pending');
      const approvedResults = await SampleRequest.findByStatus('approved');

      expect(pendingResults).toHaveLength(1);
      expect(approvedResults).toHaveLength(1);
    });

    test('should get statistics', async () => {
      const request1 = new SampleRequest(validSampleRequestData);
      await request1.save();

      const request2Data = { ...validSampleRequestData };
      request2Data.customerInfo.email = 'different@example.com';
      const request2 = new SampleRequest(request2Data);
      await request2.save();
      await request2.updateStatus('approved', testUser._id);

      const stats = await SampleRequest.getStatistics();

      expect(stats.totalRequests).toBe(2);
      expect(stats.byStatus.pending).toBeDefined();
      expect(stats.byStatus.approved).toBeDefined();
      expect(stats.byStatus.pending.count).toBe(1);
      expect(stats.byStatus.approved.count).toBe(1);
    });
  });

  describe('Virtual Properties', () => {
    test('should calculate total samples', async () => {
      validSampleRequestData.requestedProducts.push({
        product: testProduct._id,
        productName: {
          en: 'Another Perfume',
          ar: 'عطر آخر'
        },
        quantity: 3,
        sampleSize: '1ml'
      });

      const sampleRequest = new SampleRequest(validSampleRequestData);
      await sampleRequest.save();

      expect(sampleRequest.totalSamples).toBe(5); // 2 + 3
    });

    test('should calculate processing time for completed requests', async () => {
      const sampleRequest = new SampleRequest(validSampleRequestData);
      await sampleRequest.save();

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 10));
      await sampleRequest.updateStatus('approved', testUser._id);

      expect(sampleRequest.processingTime).toBeGreaterThan(0);
    });

    test('should return null processing time for pending requests', async () => {
      const sampleRequest = new SampleRequest(validSampleRequestData);
      await sampleRequest.save();

      expect(sampleRequest.processingTime).toBeNull();
    });
  });

  describe('Indexes', () => {
    test('should have proper indexes', async () => {
      const indexes = await SampleRequest.collection.getIndexes();
      
      expect(indexes).toHaveProperty('customerInfo.email_1_createdAt_-1');
      expect(indexes).toHaveProperty('status_1_createdAt_-1');
      expect(indexes).toHaveProperty('requestNumber_1');
      expect(indexes).toHaveProperty('duplicateCheckHash_1');
    });
  });
});