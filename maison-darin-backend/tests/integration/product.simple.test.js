const productService = require('../../services/productService');
const Product = require('../../models/Product');

describe('Product Integration - Simple Tests', () => {
  const validProductData = {
    name: {
      en: 'Test Rose Perfume',
      ar: 'عطر الورد التجريبي'
    },
    description: {
      en: 'A beautiful test rose fragrance',
      ar: 'عطر ورد تجريبي جميل'
    },
    price: 150.99,
    size: '50ml',
    category: 'floral',
    stock: 10
  };

  describe('Product Service Validation', () => {
    it('should validate product data correctly', () => {
      expect(() => {
        productService.validateProductData(validProductData);
      }).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const invalidData = { ...validProductData };
      delete invalidData.name;

      expect(() => {
        productService.validateProductData(invalidData);
      }).toThrow('name is required');
    });

    it('should throw error for invalid price', () => {
      const invalidData = { ...validProductData, price: -10 };

      expect(() => {
        productService.validateProductData(invalidData);
      }).toThrow('Price must be a positive number');
    });

    it('should throw error for invalid category', () => {
      const invalidData = { ...validProductData, category: 'invalid' };

      expect(() => {
        productService.validateProductData(invalidData);
      }).toThrow('Category must be one of');
    });

    it('should throw error for invalid size format', () => {
      const invalidData = { ...validProductData, size: 'invalid-size' };

      expect(() => {
        productService.validateProductData(invalidData);
      }).toThrow('Size must be in format like');
    });
  });

  describe('Product Model Creation', () => {
    it('should create a product instance with valid data', () => {
      const product = new Product(validProductData);
      
      expect(product.name.en).toBe(validProductData.name.en);
      expect(product.name.ar).toBe(validProductData.name.ar);
      expect(product.price).toBe(validProductData.price);
      expect(product.category).toBe(validProductData.category);
      expect(product.stock).toBe(validProductData.stock);
      expect(product.inStock).toBe(true);
      expect(product.featured).toBe(false);
    });

    it('should have correct availability methods', () => {
      const product = new Product(validProductData);
      
      expect(product.isAvailable(5)).toBe(true);
      expect(product.isAvailable(15)).toBe(false);
      expect(product.isAvailable()).toBe(true); // Default to 1
    });
  });
});