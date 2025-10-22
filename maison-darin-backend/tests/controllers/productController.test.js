const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Product = require('../../models/Product');
const User = require('../../models/User');

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

describe('Product Controller', () => {
  let authToken;
  let adminUser;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/maison-darin-test';
    await mongoose.connect(mongoUri);

    // Create admin user for authentication
    adminUser = await User.create({
      email: 'admin@maisondarin.com',
      password: 'SecurePass123!'
    });

    // Generate auth token
    const tokens = adminUser.generateTokens();
    authToken = tokens.accessToken;
  }, 30000);

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  }, 30000);

  const validProductData = {
    name: {
      en: 'Luxury Rose Perfume',
      ar: 'عطر الورد الفاخر'
    },
    description: {
      en: 'A beautiful rose fragrance',
      ar: 'عطر ورد جميل'
    },
    price: 150.99,
    size: '50ml',
    category: 'floral',
    stock: 10
  };

  describe('GET /api/products', () => {
    beforeEach(async () => {
      const products = [
        {
          ...validProductData,
          name: { en: 'Rose Perfume', ar: 'عطر الورد' },
          category: 'floral',
          price: 150,
          featured: true
        },
        {
          ...validProductData,
          name: { en: 'Woody Cologne', ar: 'كولونيا خشبية' },
          category: 'woody',
          price: 200,
          featured: false
        }
      ];

      await Product.insertMany(products);
    });

    it('should return all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=floral')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('floral');
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=100&maxPrice=180')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].price).toBe(150);
    });

    it('should search products', async () => {
      const response = await request(app)
        .get('/api/products?search=rose')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name.en).toContain('Rose');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.hasNext).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create(validProductData);
      productId = product._id;
    });

    it('should return product by valid ID', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(productId.toString());
      expect(response.body.data.name.en).toBe(validProductData.name.en);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/products/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PRODUCT_ID');
    });
  });

  describe('POST /api/products', () => {
    it('should create product with valid data and authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name.en).toBe(validProductData.name.en);
      expect(response.body.data.price).toBe(validProductData.price);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(validProductData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = { ...validProductData };
      delete invalidData.name;

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create(validProductData);
      productId = product._id;
    });

    it('should update product with valid data and authentication', async () => {
      const updateData = { price: 200 };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send({ price: 200 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ price: 200 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('DELETE /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create(validProductData);
      productId = product._id;
    });

    it('should delete product with authentication', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(productId.toString());

      // Verify product is deleted
      const deletedProduct = await Product.findById(productId);
      expect(deletedProduct).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('GET /api/products/featured', () => {
    beforeEach(async () => {
      const products = [
        { ...validProductData, featured: true, name: { en: 'Featured 1', ar: 'مميز 1' } },
        { ...validProductData, featured: true, name: { en: 'Featured 2', ar: 'مميز 2' } },
        { ...validProductData, featured: false, name: { en: 'Regular', ar: 'عادي' } }
      ];

      await Product.insertMany(products);
    });

    it('should return only featured products', async () => {
      const response = await request(app)
        .get('/api/products/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(product => {
        expect(product.featured).toBe(true);
      });
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/products/featured?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/products/categories', () => {
    beforeEach(async () => {
      const products = [
        { ...validProductData, category: 'floral' },
        { ...validProductData, category: 'woody' },
        { ...validProductData, category: 'floral' } // Duplicate
      ];

      await Product.insertMany(products);
    });

    it('should return unique categories', async () => {
      const response = await request(app)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data).toContain('floral');
      expect(response.body.data).toContain('woody');
    });
  });

  describe('PATCH /api/products/:id/stock', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({ ...validProductData, stock: 10 });
      productId = product._id;
    });

    it('should update stock with authentication', async () => {
      const response = await request(app)
        .patch(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stock).toBe(15);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/products/${productId}/stock`)
        .send({ quantity: 5 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid quantity', async () => {
      const response = await request(app)
        .patch(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/products/:id/availability', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({ ...validProductData, stock: 10 });
      productId = product._id;
    });

    it('should check availability', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}/availability?quantity=5`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
      expect(response.body.data.quantity).toBe(5);
    });

    it('should return false for unavailable quantity', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}/availability?quantity=15`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(false);
    });

    it('should default to quantity 1', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}/availability`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(1);
    });
  });
});