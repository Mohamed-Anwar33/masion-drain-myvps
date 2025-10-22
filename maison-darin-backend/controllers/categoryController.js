const categoryService = require('../services/categoryService');
const { AppError } = require('../utils/errorHandler');
const { successResponse, errorResponse } = require('../utils/responseHandler');

class CategoryController {
  /**
   * Get all categories
   * GET /api/categories
   */
  async getCategories(req, res, next) {
    try {
      const {
        isActive,
        includeProductCount,
        limit,
        page = 1,
        sort
      } = req.query;

      const options = {
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        includeProductCount: includeProductCount === 'true',
        limit: limit ? parseInt(limit) : undefined,
        skip: limit ? (parseInt(page) - 1) * parseInt(limit) : undefined,
        sort: sort ? JSON.parse(sort) : undefined
      };

      const categories = await categoryService.getCategories(options);

      return successResponse(res, {
        categories,
        pagination: limit ? {
          page: parseInt(page),
          limit: parseInt(limit),
          total: categories.length
        } : undefined
      }, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);
      
      return successResponse(res, { category }, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by slug
   * GET /api/categories/slug/:slug
   */
  async getCategoryBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const category = await categoryService.getCategoryBySlug(slug);
      
      return successResponse(res, { category }, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new category
   * POST /api/categories
   */
  async createCategory(req, res, next) {
    try {
      // Validate input data
      const validationErrors = categoryService.validateCategoryData(req.body);
      if (validationErrors.length > 0) {
        throw new AppError(validationErrors.join(', '), 400);
      }

      const category = await categoryService.createCategory(req.body);
      
      return successResponse(res, { category }, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;

      // Validate input data
      const validationErrors = categoryService.validateCategoryData(req.body);
      if (validationErrors.length > 0) {
        throw new AppError(validationErrors.join(', '), 400);
      }

      const category = await categoryService.updateCategory(id, req.body);
      
      return successResponse(res, { category }, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);
      
      return successResponse(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category statistics
   * GET /api/categories/stats
   */
  async getCategoryStats(req, res, next) {
    try {
      const stats = await categoryService.getCategoryStats();
      
      return successResponse(res, { categoryStats: stats }, 'Category statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active categories for frontend
   * GET /api/categories/active
   */
  async getActiveCategories(req, res, next) {
    try {
      const categories = await categoryService.getActiveCategories();
      
      return successResponse(res, { categories }, 'Active categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder categories
   * PATCH /api/categories/reorder
   */
  async reorderCategories(req, res, next) {
    try {
      const { categoryOrders } = req.body;

      if (!Array.isArray(categoryOrders)) {
        throw new AppError('categoryOrders must be an array', 400);
      }

      const categories = await categoryService.reorderCategories(categoryOrders);
      
      return successResponse(res, { categories }, 'Categories reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search categories
   * GET /api/categories/search
   */
  async searchCategories(req, res, next) {
    try {
      const { q: searchTerm, isActive, limit } = req.query;

      if (!searchTerm) {
        throw new AppError('Search term is required', 400);
      }

      const options = {
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        limit: limit ? parseInt(limit) : 10
      };

      const categories = await categoryService.searchCategories(searchTerm, options);
      
      return successResponse(res, { categories }, 'Categories search completed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle category status
   * PATCH /api/categories/:id/toggle-status
   */
  async toggleCategoryStatus(req, res, next) {
    try {
      const { id } = req.params;
      
      const category = await categoryService.getCategoryById(id);
      const updatedCategory = await categoryService.updateCategory(id, {
        isActive: !category.isActive
      });
      
      return successResponse(res, { category: updatedCategory }, 'Category status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category products
   * GET /api/categories/:id/products
   */
  async getCategoryProducts(req, res, next) {
    try {
      const { id } = req.params;
      const { inStock, isActive, limit, sort } = req.query;

      const category = await categoryService.getCategoryById(id);
      
      const options = {
        inStock: inStock !== undefined ? inStock === 'true' : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        limit: limit ? parseInt(limit) : undefined,
        sort: sort ? JSON.parse(sort) : undefined
      };

      const products = await category.getProducts(options);
      
      return successResponse(res, { 
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug
        },
        products 
      }, 'Category products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();