const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const validation = require('../middleware/validation');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes
router.get('/active', categoryController.getActiveCategories);
router.get('/search', rateLimiter.search, categoryController.searchCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Protected routes - require authentication
router.use(authenticate);

// Admin only routes
router.use(authorize(['admin']));

// Category CRUD operations
router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.get('/stats', categoryController.getCategoryStats);
router.patch('/reorder', categoryController.reorderCategories);

// Category by ID routes
router.get('/:id', validation.validateObjectId, categoryController.getCategoryById);
router.put('/:id', validation.validateObjectId, categoryController.updateCategory);
router.delete('/:id', validation.validateObjectId, categoryController.deleteCategory);
router.patch('/:id/toggle-status', validation.validateObjectId, categoryController.toggleCategoryStatus);
router.get('/:id/products', validation.validateObjectId, categoryController.getCategoryProducts);

module.exports = router;