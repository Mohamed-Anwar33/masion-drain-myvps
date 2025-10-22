const productService = require('../services/productService');

class ProductController {
  /**
   * Get all products with filtering and pagination
   * GET /api/products
   */
  async getAllProducts(req, res) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        category: req.query.category,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        inStock: req.query.inStock,
        featured: req.query.featured,
        search: req.query.search,
        language: req.query.language,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await productService.getProducts(options);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCTS_FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Invalid') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'PRODUCT_NOT_FOUND' : 
                statusCode === 400 ? 'INVALID_PRODUCT_ID' : 'PRODUCT_FETCH_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Create new product
   * POST /api/products
   */
  async createProduct(req, res) {
    try {
      const productData = req.body;
      const product = await productService.createProduct(productData);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('required') || 
                        error.message.includes('must be') ||
                        error.message.includes('format') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 400 ? 'VALIDATION_ERROR' : 'PRODUCT_CREATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Update product
   * PUT /api/products/:id
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const product = await productService.updateProduct(id, updateData);

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Invalid') ? 400 :
                        error.message.includes('required') || 
                        error.message.includes('must be') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'PRODUCT_NOT_FOUND' : 
                statusCode === 400 ? 'VALIDATION_ERROR' : 'PRODUCT_UPDATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.deleteProduct(id);

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Invalid') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'PRODUCT_NOT_FOUND' : 
                statusCode === 400 ? 'INVALID_PRODUCT_ID' : 'PRODUCT_DELETE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get featured products
   * GET /api/products/featured
   */
  async getFeaturedProducts(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const products = await productService.getFeaturedProducts(limit);

      res.status(200).json({
        success: true,
        data: products,
        message: 'Featured products retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FEATURED_PRODUCTS_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get all categories
   * GET /api/products/categories
   */
  async getCategories(req, res) {
    try {
      const categories = await productService.getCategories();

      res.status(200).json({
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CATEGORIES_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Update product stock
   * PATCH /api/products/:id/stock
   */
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock, inStock } = req.body;

      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Stock must be a non-negative number'
          }
        });
      }

      const product = await productService.updateProductStock(id, stock, inStock);

      res.status(200).json({
        success: true,
        data: {
          product
        },
        message: 'Stock updated successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Invalid') ? 400 :
                        error.message.includes('Insufficient') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'PRODUCT_NOT_FOUND' : 
                statusCode === 400 ? 'STOCK_UPDATE_ERROR' : 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Check product availability
   * GET /api/products/:id/availability
   */
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const quantity = req.query.quantity ? parseInt(req.query.quantity) : 1;

      const isAvailable = await productService.checkAvailability(id, quantity);

      res.status(200).json({
        success: true,
        data: {
          available: isAvailable,
          quantity: quantity
        },
        message: 'Availability checked successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('Invalid') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'PRODUCT_NOT_FOUND' : 
                statusCode === 400 ? 'INVALID_PRODUCT_ID' : 'AVAILABILITY_CHECK_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get category statistics
   * GET /api/products/categories/stats
   */
  async getCategoryStats(req, res) {
    try {
      const categoryStats = await productService.getCategoryStats();

      res.status(200).json({
        success: true,
        data: {
          categoryStats
        },
        message: 'Category statistics retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CATEGORY_STATS_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Bulk update product stock
   * PATCH /api/products/bulk/stock
   */
  async bulkUpdateStock(req, res) {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Updates array is required and cannot be empty'
          }
        });
      }

      const results = await productService.bulkUpdateStock(updates);

      res.status(200).json({
        success: true,
        data: results,
        message: 'Bulk stock update completed'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'BULK_STOCK_UPDATE_ERROR',
          message: error.message
        }
      });
    }
  }

  /**
   * Get inventory report
   * GET /api/products/inventory/report
   */
  async getInventoryReport(req, res) {
    try {
      const lowStockThreshold = req.query.lowStockThreshold ? 
        parseInt(req.query.lowStockThreshold) : 5;

      const report = await productService.getInventoryReport(lowStockThreshold);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Inventory report generated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INVENTORY_REPORT_ERROR',
          message: error.message
        }
      });
    }
  }
}

module.exports = new ProductController();