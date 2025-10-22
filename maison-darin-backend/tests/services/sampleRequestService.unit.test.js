const mongoose = require('mongoose');
const sampleRequestService = require('../../services/sampleRequestService');
const SampleRequest = require('../../models/SampleRequest');
const Product = require('../../models/Product');
const User = require('../../models/User');

describe('SampleRequestService Unit Tests', () => {
  let testProduct;
  let testUser;
  let validRequestData;

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

    validRequestData = {
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

  describe('createSampleRequest', () => {
    test('should create sample request with valid data', async () => {
      const result = await sampleRequestService.createSampleRequest(validRequestData);

      expect(result._id).toBeDefined();
      expect(result.requestNumber).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.customerInfo.email).toBe('john.doe@example.com');
      expect(result.requestedProducts).toHaveLength(1);
    });

    test('should reject request with no products', async () => {
      validRequestData.requestedProducts = [];

      await expect(sampleRequestService.createSampleRequest(validRequestData))
        .rejects.toThrow('At least one product must be requested');
    });

    test('should reject request with non-existent product', async () => {
      validRequestData.requestedProducts[0].product = new mongoose.Types.ObjectId();

      await expect(sampleRequestService.createSampleRequest(validRequestData))
        .rejects.toThrow('Some requested products are not available');
    });

    test('should reject request with out-of-stock product', async () => {
      await Product.findByIdAndUpdate(testProduct._id, { inStock: false });

      await expect(sampleRequestService.createSampleRequest(validRequestData))
        .rejects.toThrow('Some requested products are not available');
    });

    test('should reject request exceeding quantity limit per product', async () => {
      validRequestData.requestedProducts[0].quantity = 6;

      await expect(sampleRequestService.createSampleRequest(validRequestData))
        .rejects.toThrow('Maximum 5 samples per product allowed');
    });

    test('should reject request exceeding total samples limit', async () => {
      // Create multiple products to exceed total limit
      const products = [];
      for (let i = 0; i < 3; i++) {
        const product = await Product.create({
          name: { en: `Test Perfume ${i}`, ar: `عطر تجريبي ${i}` },
          description: { en: 'Test Description', ar: 'وصف تجريبي' },
          price: 100,
          size: '50ml',
          category: 'floral',
          inStock: true,
          stock: 10
        });
        products.push(product);
      }

      validRequestData.requestedProducts = products.map(product => ({
        product: product._id,
        productName: product.name,
        quantity: 4, // 4 * 3 = 12 > 10 limit
        sampleSize: '2ml'
      }));

      await expect(sampleRequestService.createSampleRequest(validRequestData))
        .rejects.toThrow('Maximum 10 total samples allowed per request');
    });

    test('should detect and reject duplicate requests', async () => {
      // Create first request
      await sampleRequestService.createSampleRequest(validRequestData);

      // Try to create duplicate
      await expect(sampleRequestService.createSampleRequest(validRequestData))
        .rejects.toThrow('A similar sample request was already submitted recently');
    });

    test('should allow duplicate requests after 30 days', async () => {
      // Create first request
      const firstRequest = await sampleRequestService.createSampleRequest(validRequestData);
      
      // Manually set creation date to 35 days ago
      await SampleRequest.findByIdAndUpdate(firstRequest._id, {
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      });

      // Should allow new request
      const secondRequest = await sampleRequestService.createSampleRequest(validRequestData);
      expect(secondRequest._id).toBeDefined();
      expect(secondRequest._id.toString()).not.toBe(firstRequest._id.toString());
    });
  });

  describe('getSampleRequests', () => {
    beforeEach(async () => {
      // Create test requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        const requestData = {
          ...validRequestData,
          customerInfo: {
            ...validRequestData.customerInfo,
            email: `customer${i}@example.com`
          }
        };
        requests.push(await sampleRequestService.createSampleRequest(requestData));
      }

      // Update some statuses
      await sampleRequestService.updateSampleRequestStatus(
        requests[0]._id, 'approved', testUser._id, 'Test approval'
      );
      await sampleRequestService.updateSampleRequestStatus(
        requests[1]._id, 'approved', testUser._id, 'Test approval'
      );
    });

    test('should get all sample requests with pagination', async () => {
      const result = await sampleRequestService.getSampleRequests({}, { page: 1, limit: 3 });

      expect(result.requests).toHaveLength(3);
      expect(result.pagination.totalCount).toBe(5);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.hasNextPage).toBe(true);
    });

    test('should filter requests by status', async () => {
      const result = await sampleRequestService.getSampleRequests({ status: 'approved' });

      expect(result.requests).toHaveLength(2);
      result.requests.forEach(request => {
        expect(request.status).toBe('approved');
      });
    });

    test('should filter requests by customer email', async () => {
      const result = await sampleRequestService.getSampleRequests({ 
        customerEmail: 'customer0@example.com' 
      });

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].customerInfo.email).toBe('customer0@example.com');
    });

    test('should search requests by text', async () => {
      const result = await sampleRequestService.getSampleRequests({ 
        search: 'customer1' 
      });

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].customerInfo.email).toBe('customer1@example.com');
    });

    test('should sort requests by different fields', async () => {
      const result = await sampleRequestService.getSampleRequests({}, {
        sortBy: 'customerInfo.email',
        sortOrder: 'asc'
      });

      expect(result.requests[0].customerInfo.email).toBe('customer0@example.com');
    });
  });

  describe('getSampleRequestById', () => {
    test('should get sample request by ID', async () => {
      const created = await sampleRequestService.createSampleRequest(validRequestData);
      const result = await sampleRequestService.getSampleRequestById(created._id);

      expect(result._id.toString()).toBe(created._id.toString());
      expect(result.customerInfo.email).toBe('john.doe@example.com');
    });

    test('should throw error for non-existent request', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(sampleRequestService.getSampleRequestById(fakeId))
        .rejects.toThrow('Sample request not found');
    });
  });

  describe('updateSampleRequestStatus', () => {
    let sampleRequest;

    beforeEach(async () => {
      sampleRequest = await sampleRequestService.createSampleRequest(validRequestData);
    });

    test('should update status with valid transition', async () => {
      const result = await sampleRequestService.updateSampleRequestStatus(
        sampleRequest._id, 'approved', testUser._id, 'Approved for processing'
      );

      expect(result.status).toBe('approved');
      expect(result.statusHistory).toHaveLength(2);
      expect(result.statusHistory[1].reason).toBe('Approved for processing');
    });

    test('should reject invalid status transition', async () => {
      await expect(sampleRequestService.updateSampleRequestStatus(
        sampleRequest._id, 'delivered', testUser._id, 'Invalid transition'
      )).rejects.toThrow('Invalid status transition from pending to delivered');
    });

    test('should update shipping timestamps for shipped status', async () => {
      // First approve
      await sampleRequestService.updateSampleRequestStatus(
        sampleRequest._id, 'approved', testUser._id
      );
      
      // Then process
      await sampleRequestService.updateSampleRequestStatus(
        sampleRequest._id, 'processing', testUser._id
      );

      // Then ship
      const result = await sampleRequestService.updateSampleRequestStatus(
        sampleRequest._id, 'shipped', testUser._id
      );

      expect(result.shippingInfo.shippedAt).toBeDefined();
    });
  });

  describe('addAdminNote', () => {
    test('should add admin note to request', async () => {
      const sampleRequest = await sampleRequestService.createSampleRequest(validRequestData);
      
      const result = await sampleRequestService.addAdminNote(
        sampleRequest._id, 'Customer called to confirm address', testUser._id
      );

      expect(result.adminNotes).toHaveLength(1);
      expect(result.adminNotes[0].note).toBe('Customer called to confirm address');
      expect(result.adminNotes[0].addedBy.toString()).toBe(testUser._id.toString());
    });
  });

  describe('updateShippingInfo', () => {
    test('should update shipping information', async () => {
      const sampleRequest = await sampleRequestService.createSampleRequest(validRequestData);
      
      const shippingInfo = {
        trackingNumber: 'TRK123456789',
        shippingMethod: 'express',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      };

      const result = await sampleRequestService.updateShippingInfo(
        sampleRequest._id, shippingInfo
      );

      expect(result.shippingInfo.trackingNumber).toBe('TRK123456789');
      expect(result.shippingInfo.shippingMethod).toBe('express');
      expect(result.shippingInfo.estimatedDelivery).toBeDefined();
    });
  });

  describe('getSampleRequestStatistics', () => {
    beforeEach(async () => {
      // Create test requests with different statuses
      const requests = [];
      for (let i = 0; i < 10; i++) {
        const requestData = {
          ...validRequestData,
          customerInfo: {
            ...validRequestData.customerInfo,
            email: `customer${i}@example.com`
          }
        };
        requests.push(await sampleRequestService.createSampleRequest(requestData));
      }

      // Update some statuses
      for (let i = 0; i < 3; i++) {
        await sampleRequestService.updateSampleRequestStatus(
          requests[i]._id, 'approved', testUser._id
        );
      }
      
      for (let i = 3; i < 5; i++) {
        await sampleRequestService.updateSampleRequestStatus(
          requests[i]._id, 'approved', testUser._id
        );
        await sampleRequestService.updateSampleRequestStatus(
          requests[i]._id, 'processing', testUser._id
        );
      }
    });

    test('should get comprehensive statistics', async () => {
      const stats = await sampleRequestService.getSampleRequestStatistics();

      expect(stats.totalRequests).toBe(10);
      expect(stats.byStatus).toBeDefined();
      expect(stats.filtered.byStatus).toBeDefined();
      expect(stats.filtered.byPriority).toBeDefined();
      expect(stats.filtered.topProducts).toBeDefined();
    });

    test('should filter statistics by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const stats = await sampleRequestService.getSampleRequestStatistics({
        dateRange: {
          start: yesterday,
          end: tomorrow
        }
      });

      expect(stats.totalRequests).toBe(10);
    });
  });
});