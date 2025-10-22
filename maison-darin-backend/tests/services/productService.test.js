const mongoose = require('mongoose');
const productService = require('../../services/productService');
const Product = require('../../models/Product');

describe('Product Service', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/maison-darin-test';
    await mongoose.connect(mongoUri);
  }, 30000);

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await Product.deleteMany({});
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

  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      const product = await productService.createProduct(validProductData);

      expect(product._id).toBeDefined();
      expect(product.name.en).toBe(validProductData.name.en);
      expect(product.name.ar).toBe(validProductData.name.ar);
      expect(product.price).toBe(validProductData.price);
      expect(product.category).toBe(validProductData.category);
    });

    it('should throw error for missing required fields', async () => {
      const invalidData = { ...validProductData };
      delete invalidData.name;

      await expect(productService.createProduct(invalidData))
        .rejects.toThrow('name is required');
    });

    it('should throw error for missing English name', async () => {
      const invalidData = {
        ...validProductData,
        name: { ar: 'عطر الورد الفاخر' }
      };

      await expect(productService.createProduct(invalidData))
        .rejects.toThrow('Product name is required in both English and Arabic');
    });

    it('should throw error for invalid price', async () => {
      const invalidData = { ...validProductData, price: -10 };

      await expect(productService.createProduct(invalidData))
        .rejects.toThrow('Price must be a positive number');
    });

    it('should throw error for invalid category', async () => {
      const invalidData = { ...validProductData, category: 'invalid' };

      await expect(productService.createProduct(invalidData))
        .rejects.toThrow('Category must be one of');
    });
  });

  describe('getProducts', () => {
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
        },
        {
          ...validProductData,
          name: { en: 'Citrus Fresh', ar: 'حمضيات منعشة' },
          category: 'citrus',
          price: 80,
          stock: 0,
          inStock: false
        }
      ];

      await Product.insertMany(products);
    });

    it('should return all products with pagination', async () => {
      const result = await productService.getProducts();

      expect(result.products).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter products by category', async () => {
      const result = await productService.getProducts({ category: 'floral' });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].category).toBe('floral');
    });

    it('should filter products by price range', async () => {
      const result = await productService.getProducts({ minPrice: 100, maxPrice: 180 });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].price).toBe(150);
    });

    it('should filter products by availability', async () => {
      const result = await productService.getProducts({ inStock: true });

      expect(result.products).toHaveLength(2);
      result.products.forEach(product => {
        expect(product.inStock).toBe(true);
      });
    });

    it('should search products in English', async () => {
      const result = await productService.getProducts({ search: 'rose', language: 'en' });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name.en).toContain('Rose');
    });

    it('should search products in Arabic', async () => {
      const result = await productService.getProducts({ search: 'ورد', language: 'ar' });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name.ar).toContain('ورد');
    });

    it('should handle pagination correctly', async () => {
      const result = await productService.getProducts({ page: 1, limit: 2 });

      expect(result.products).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should sort products correctly', async () => {
      const result = await productService.getProducts({ sortBy: 'price', sortOrder: 'asc' });

      expect(result.products[0].price).toBe(80);
      expect(result.products[1].price).toBe(150);
      expect(result.products[2].price).toBe(200);
    });
  });

  describe('getProductById', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create(validProductData);
      productId = product._id;
    });

    it('should return product by valid ID', async () => {
      const product = await productService.getProductById(productId);

      expect(product._id.toString()).toBe(productId.toString());
      expect(product.name.en).toBe(validProductData.name.en);
    });

    it('should throw error for non-existent ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await expect(productService.getProductById(nonExistentId))
        .rejects.toThrow('Product not found');
    });

    it('should throw error for invalid ID format', async () => {
      await expect(productService.getProductById('invalid-id'))
        .rejects.toThrow('Invalid product ID');
    });
  });

  describe('updateProduct', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create(validProductData);
      productId = product._id;
    });

    it('should update product with valid data', async () => {
      const updateData = { price: 200 };
      const updatedProduct = await productService.updateProduct(productId, updateData);

      expect(updatedProduct.price).toBe(200);
      expect(updatedProduct.name.en).toBe(validProductData.name.en); // Should remain unchanged
    });

    it('should update multilingual fields', async () => {
      const updateData = {
        name: {
          en: 'Updated Rose Perfume',
          ar: 'عطر الورد المحدث'
        }
      };
      const updatedProduct = await productService.updateProduct(productId, updateData);

      expect(updatedProduct.name.en).toBe('Updated Rose Perfume');
      expect(updatedProduct.name.ar).toBe('عطر الورد المحدث');
    });

    it('should throw error for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await expect(productService.updateProduct(nonExistentId, { price: 200 }))
        .rejects.toThrow('Product not found');
    });

    it('should throw error for invalid ID format', async () => {
      await expect(productService.updateProduct('invalid-id', { price: 200 }))
        .rejects.toThrow('Invalid product ID');
    });

    it('should not allow updating protected fields', async () => {
      const updateData = { _id: 'new-id', createdAt: new Date() };
      const updatedProduct = await productService.updateProduct(productId, updateData);

      expect(updatedProduct._id.toString()).toBe(productId.toString());
    });
  });

  describe('deleteProduct', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create(validProductData);
      productId = product._id;
    });

    it('should delete product by valid ID', async () => {
      const deletedProduct = await productService.deleteProduct(productId);

      expect(deletedProduct._id.toString()).toBe(productId.toString());

      // Verify product is deleted
      const product = await Product.findById(productId);
      expect(product).toBeNull();
    });

    it('should throw error for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await expect(productService.deleteProduct(nonExistentId))
        .rejects.toThrow('Product not found');
    });

    it('should throw error for invalid ID format', async () => {
      await expect(productService.deleteProduct('invalid-id'))
        .rejects.toThrow('Invalid product ID');
    });
  });

  describe('getFeaturedProducts', () => {
    beforeEach(async () => {
      const products = [
        { ...validProductData, featured: true, name: { en: 'Featured 1', ar: 'مميز 1' } },
        { ...validProductData, featured: true, name: { en: 'Featured 2', ar: 'مميز 2' } },
        { ...validProductData, featured: false, name: { en: 'Regular', ar: 'عادي' } }
      ];

      await Product.insertMany(products);
    });

    it('should return only featured products', async () => {
      const products = await productService.getFeaturedProducts();

      expect(products).toHaveLength(2);
      products.forEach(product => {
        expect(product.featured).toBe(true);
      });
    });

    it('should respect limit parameter', async () => {
      const products = await productService.getFeaturedProducts(1);

      expect(products).toHaveLength(1);
    });
  });

  describe('getCategories', () => {
    beforeEach(async () => {
      const products = [
        { ...validProductData, category: 'floral' },
        { ...validProductData, category: 'woody' },
        { ...validProductData, category: 'floral' } // Duplicate category
      ];

      await Product.insertMany(products);
    });

    it('should return unique categories', async () => {
      const categories = await productService.getCategories();

      expect(categories).toHaveLength(2);
      expect(categories).toContain('floral');
      expect(categories).toContain('woody');
    });
  });

  describe('updateStock', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({ ...validProductData, stock: 10 });
      productId = product._id;
    });

    it('should increase stock', async () => {
      const updatedProduct = await productService.updateStock(productId, 5);

      expect(updatedProduct.stock).toBe(15);
      expect(updatedProduct.inStock).toBe(true);
    });

    it('should decrease stock', async () => {
      const updatedProduct = await productService.updateStock(productId, -3);

      expect(updatedProduct.stock).toBe(7);
      expect(updatedProduct.inStock).toBe(true);
    });

    it('should set inStock to false when stock reaches 0', async () => {
      const updatedProduct = await productService.updateStock(productId, -10);

      expect(updatedProduct.stock).toBe(0);
      expect(updatedProduct.inStock).toBe(false);
    });

    it('should throw error for insufficient stock', async () => {
      await expect(productService.updateStock(productId, -15))
        .rejects.toThrow('Insufficient stock');
    });
  });

  describe('checkAvailability', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({ ...validProductData, stock: 10 });
      productId = product._id;
    });

    it('should return true for available quantity', async () => {
      const isAvailable = await productService.checkAvailability(productId, 5);

      expect(isAvailable).toBe(true);
    });

    it('should return false for unavailable quantity', async () => {
      const isAvailable = await productService.checkAvailability(productId, 15);

      expect(isAvailable).toBe(false);
    });

    it('should default to quantity 1', async () => {
      const isAvailable = await productService.checkAvailability(productId);

      expect(isAvailable).toBe(true);
    });
  });
});