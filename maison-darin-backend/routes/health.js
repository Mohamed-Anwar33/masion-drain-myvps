const express = require('express');
const router = express.Router();
const HealthController = require('../controllers/healthController');
const { authenticate } = require('../middleware/auth');
const {
  getPerformanceMetrics,
  getAlertHistory,
  resetPerformanceMetrics,
  updatePerformanceThresholds
} = require('../middleware/performanceMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy]
 *         timestamp:
 *           type: string
 *           format: date-time
 *         responseTime:
 *           type: number
 *         services:
 *           type: object
 *           properties:
 *             database:
 *               type: object
 *             system:
 *               type: object
 *         environment:
 *           type: string
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     description: Check the overall health of the application and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: Application is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: object
 */
router.get('/', HealthController.healthCheck);

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check with statistics
 *     description: Get comprehensive health information including database statistics and system metrics
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed health information
 *       401:
 *         description: Authentication required
 *       503:
 *         description: Application is unhealthy
 */
router.get('/detailed', authenticate, HealthController.detailedHealthCheck);

/**
 * @swagger
 * /api/health/database:
 *   get:
 *     summary: Database-specific health check
 *     description: Check the health and status of the database connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *       503:
 *         description: Database is unhealthy
 */
router.get('/database', HealthController.databaseHealthCheck);

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes/Docker readiness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready to serve traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Application is not ready
 */
router.get('/ready', HealthController.readinessProbe);

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes/Docker liveness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 uptime:
 *                   type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Application is not responding
 */
router.get('/live', HealthController.livenessProbe);

/**
 * @swagger
 * /api/health/circuit-breaker:
 *   get:
 *     summary: Circuit breaker status
 *     description: Get the current status of the database circuit breaker
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Circuit breaker status
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
 *                     state:
 *                       type: string
 *                       enum: [CLOSED, OPEN, HALF_OPEN]
 *                     failures:
 *                       type: number
 *                     threshold:
 *                       type: number
 *                     allowsOperations:
 *                       type: boolean
 *       401:
 *         description: Authentication required
 */
router.get('/circuit-breaker', authenticate, HealthController.circuitBreakerStatus);

/**
 * @swagger
 * /api/health/circuit-breaker/reset:
 *   post:
 *     summary: Reset circuit breaker
 *     description: Manually reset the database circuit breaker (admin only)
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Circuit breaker reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Reset failed
 */
router.post('/circuit-breaker/reset', authenticate, HealthController.resetCircuitBreaker);

/**
 * @swagger
 * /api/health/metrics:
 *   get:
 *     summary: Get performance metrics
 *     description: Get detailed performance metrics and monitoring data
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
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
 *                     metrics:
 *                       type: object
 *                     summary:
 *                       type: object
 *                     alerts:
 *                       type: object
 *       401:
 *         description: Authentication required
 */
router.get('/metrics', authenticate, getPerformanceMetrics);

/**
 * @swagger
 * /api/health/alerts:
 *   get:
 *     summary: Get alert history
 *     description: Get history of system alerts and notifications
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of alerts to retrieve
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [info, warning, error, critical]
 *         description: Filter by alert severity
 *     responses:
 *       200:
 *         description: Alert history retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/alerts', authenticate, getAlertHistory);

/**
 * @swagger
 * /api/health/metrics/reset:
 *   post:
 *     summary: Reset performance metrics
 *     description: Reset all performance metrics and counters (admin only)
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics reset successfully
 *       401:
 *         description: Authentication required
 */
router.post('/metrics/reset', authenticate, resetPerformanceMetrics);

/**
 * @swagger
 * /api/health/thresholds:
 *   put:
 *     summary: Update performance thresholds
 *     description: Update performance monitoring thresholds (admin only)
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               thresholds:
 *                 type: object
 *                 properties:
 *                   responseTime:
 *                     type: number
 *                   errorRate:
 *                     type: number
 *                   cpuUsage:
 *                     type: number
 *                   memoryUsage:
 *                     type: number
 *                   dbQueryTime:
 *                     type: number
 *     responses:
 *       200:
 *         description: Thresholds updated successfully
 *       400:
 *         description: Invalid thresholds provided
 *       401:
 *         description: Authentication required
 */
router.put('/thresholds', authenticate, updatePerformanceThresholds);

module.exports = router;