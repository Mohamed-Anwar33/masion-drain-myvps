const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

/**
 * Dashboard Routes
 * All routes require admin authentication
 */

// Apply authentication middleware to all dashboard routes
router.use(auth.requireAuth);
router.use(auth.requireAdmin);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get complete dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalProducts:
 *                           type: number
 *                         totalCustomers:
 *                           type: number
 *                         todayOrders:
 *                           type: number
 *                         pendingOrders:
 *                           type: number
 *                     products:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         inStock:
 *                           type: number
 *                         outOfStock:
 *                           type: number
 *                         lowStock:
 *                           type: number
 *                     orders:
 *                       type: object
 *                       properties:
 *                         today:
 *                           type: number
 *                         pending:
 *                           type: number
 *                         recent:
 *                           type: array
 *                         byStatus:
 *                           type: object
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         today:
 *                           type: number
 *                         thisMonth:
 *                           type: number
 *                         lastMonth:
 *                           type: number
 *                         total:
 *                           type: number
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/', dashboardController.getDashboardStats);

/**
 * @swagger
 * /api/admin/dashboard/overview:
 *   get:
 *     summary: Get overview statistics (quick stats)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: number
 *                     totalCustomers:
 *                       type: number
 *                     todayOrders:
 *                       type: number
 *                     pendingOrders:
 *                       type: number
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 */
router.get('/overview', dashboardController.getOverviewStats);

/**
 * @swagger
 * /api/admin/dashboard/recent-orders:
 *   get:
 *     summary: Get recent orders (last 5)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       orderNumber:
 *                         type: string
 *                       customerInfo:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                       total:
 *                         type: number
 *                       orderStatus:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/recent-orders', dashboardController.getRecentOrders);

/**
 * @swagger
 * /api/admin/dashboard/products:
 *   get:
 *     summary: Get product statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
 */
router.get('/products', dashboardController.getProductStats);

/**
 * @swagger
 * /api/admin/dashboard/orders:
 *   get:
 *     summary: Get order statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 */
router.get('/orders', dashboardController.getOrderStats);

/**
 * @swagger
 * /api/admin/dashboard/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue statistics retrieved successfully
 */
router.get('/revenue', dashboardController.getRevenueStats);

/**
 * @swagger
 * /api/admin/dashboard/clear-cache:
 *   post:
 *     summary: Clear dashboard cache
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: Specific cache key to clear (optional)
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/clear-cache', [
  body('key').optional().isString().trim()
], dashboardController.clearCache);

/**
 * @swagger
 * /api/admin/dashboard/cache-status:
 *   get:
 *     summary: Get cache status information
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache status retrieved successfully
 */
router.get('/cache-status', dashboardController.getCacheStatus);

module.exports = router;