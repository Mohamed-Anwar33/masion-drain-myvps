const request = require('supertest');
const app = require('../../server');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Customer = require('../../models/Customer');
const User = require('../../models/User');

describe('CRUD Operations Integration Tests', () => {
  let authToken;
  let adminUser;

  beforeAll(async () => {
    // Create admin user and get auth token
    adminUser = await factory.create('User', {
      email: 'admin@test.com',
      role: 'admin',
      isActive: true
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.tokens.accessToken;
  });

  describe('Products CRUD', () => {
    let testProduct;

    it('should create a new product', async () => {
      const productData = {
        name: 'Test Perfume',
        description: 'A beautiful test fragrance',
        price: 299.99,
        stock: 50,
        category: 'Unisex',
        brand: 'Maison Darin',
        size: '100ml',
        is_active: true
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.price).toBe(productData.price);
      
      testProduct = response.body.data.product;
    });

    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);
    });

    it('should get product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product._id).toBe(testProduct._id);
      expect(response.body.data.product.name).toBe(testProduct.name);
    });

    it('should update product', async () => {
      const updateData = {
        name: 'Updated Test Perfume',
        price: 349.99
      };

      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.data.product.price).toBe(updateData.price);
    });
  });    it('
should delete product', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify product is deleted
      const getResponse = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });
  });

  describe('Orders CRUD', () => {
    let testOrder;
    let testCustomer;

    beforeEach(async () => {
      // Create test customer
      testCustomer = await factory.create('Customer', {
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '+201234567890'
      });
    });

    it('should create a new order', async () => {
      const orderData = {
        customer_id: testCustomer._id,
        items: [
          {
            product_id: '507f1f77bcf86cd799439011',
            quantity: 2,
            price: 299.99
          }
        ],
        total_amount: 599.98,
        shipping_address: 'Test Address, Cairo, Egypt',
        payment_method: 'cash_on_delivery'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.customer_id).toBe(testCustomer._id.toString());
      expect(response.body.data.order.total_amount).toBe(orderData.total_amount);
      
      testOrder = response.body.data.order;
    });

    it('should get all orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('should update order status', async () => {
      const updateData = {
        status: 'processing'
      };

      const response = await request(app)
        .put(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe(updateData.status);
    });

    it('should get order by ID with details', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order._id).toBe(testOrder._id);
      expect(response.body.data.order.customer).toBeDefined();
      expect(response.body.data.order.items).toBeDefined();
    });
  });

  describe('Customers CRUD', () => {
    let testCustomer;

    it('should create a new customer', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john.doe@test.com',
        phone: '+201234567890',
        address: 'Test Address, Cairo, Egypt'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.name).toBe(customerData.name);
      expect(response.body.data.customer.email).toBe(customerData.email);
      
      testCustomer = response.body.data.customer;
    });

    it('should get all customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.customers)).toBe(true);
    });

    it('should get customer by ID', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer._id).toBe(testCustomer._id);
    });

    it('should update customer', async () => {
      const updateData = {
        name: 'John Smith',
        phone: '+201987654321'
      };

      const response = await request(app)
        .put(`/api/customers/${testCustomer._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.name).toBe(updateData.name);
      expect(response.body.data.customer.phone).toBe(updateData.phone);
    });
  });
});