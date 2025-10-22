const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const { validate, sanitizeInput, preventMongoInjection } = require('../middleware/validation');
const { productSchemas } = require('../validation/schemas');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           $ref: '#/components/schemas/MultilingualText'
 *         description:
 *           $ref: '#/components/schemas/MultilingualText'
 *         longDescription:
 *           $ref: '#/components/schemas/MultilingualText'
 *         price:
 *           type: number
 *           minimum: 0
 *         size:
 *           type: string
 *         category:
 *           type: string
 *           enum: [floral, oriental, fresh, woody, citrus, spicy, aquatic, gourmand]
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               cloudinaryId:
 *                 type: string
 *               alt:
 *                 $ref: '#/components/schemas/MultilingualText'
 *               order:
 *                 type: number
 *         featured:
 *           type: boolean
 *         inStock:
 *           type: boolean
 *         stock:
 *           type: number
 *         concentration:
 *           $ref: '#/components/schemas/MultilingualText'
 *         notes:
 *           type: object
 *           properties:
 *             top:
 *               $ref: '#/components/schemas/MultilingualText'
 *             middle:
 *               $ref: '#/components/schemas/MultilingualText'
 *             base:
 *               $ref: '#/components/schemas/MultilingualText'
 *         seo:
 *           type: object
 *           properties:
 *             metaTitle:
 *               $ref: '#/components/schemas/MultilingualText'
 *             metaDescription:
 *               $ref: '#/components/schemas/MultilingualText'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ProductCreate:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - size
 *         - category
 *       properties:
 *         name:
 *           $ref: '#/components/schemas/MultilingualText'
 *         description:
 *           $ref: '#/components/schemas/MultilingualText'
 *         longDescription:
 *           $ref: '#/components/schemas/MultilingualText'
 *         price:
 *           type: number
 *           minimum: 0
 *         size:
 *           type: string
 *         category:
 *           type: string
 *           enum: [floral, oriental, fresh, woody, citrus, spicy, aquatic, gourmand]
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               cloudinaryId:
 *                 type: string
 *               alt:
 *                 $ref: '#/components/schemas/MultilingualText'
 *               order:
 *                 type: number
 *         featured:
 *           type: boolean
 *         inStock:
 *           type: boolean
 *         stock:
 *           type: number
 *         concentration:
 *           $ref: '#/components/schemas/MultilingualText'
 *         notes:
 *           type: object
 *           properties:
 *             top:
 *               $ref: '#/components/schemas/MultilingualText'
 *             middle:
 *               $ref: '#/components/schemas/MultilingualText'
 *             base:
 *               $ref: '#/components/schemas/MultilingualText'
 *         seo:
 *           type: object
 *           properties:
 *             metaTitle:
 *               $ref: '#/components/schemas/MultilingualText'
 *             metaDescription:
 *               $ref: '#/components/schemas/MultilingualText'
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve all products with optional filtering, searching, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [floral, oriental, fresh, woody, citrus, spicy, aquatic, gourmand]
 *         description: Filter by product category
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured products
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product names and descriptions (both languages)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, updatedAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Public routes (no authentication required)
router.get('/', 
  sanitizeInput, 
  preventMongoInjection, 
  validate(productSchemas.query, 'query'), 
  productController.getAllProducts
);
/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     description: Retrieve all products marked as featured
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Featured products retrieved successfully
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/featured', productController.getFeaturedProducts);
/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Get product categories
 *     description: Retrieve all available product categories with translations
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             $ref: '#/components/schemas/MultilingualText'
 *                 message:
 *                   type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/categories', productController.getCategories);

/**
 * @swagger
 * /api/products/categories/stats:
 *   get:
 *     summary: Get category statistics
 *     description: Get detailed statistics for each product category
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category statistics retrieved successfully
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
 *                     categoryStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           totalProducts:
 *                             type: number
 *                           inStockProducts:
 *                             type: number
 *                           outOfStockProducts:
 *                             type: number
 *                           averagePrice:
 *                             type: number
 *                           totalValue:
 *                             type: number
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/categories/stats', 
  authMiddleware.authenticate, 
  productController.getCategoryStats
);
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve a specific product by its ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', 
  sanitizeInput, 
  preventMongoInjection, 
  validate(productSchemas.params, 'params'), 
  productController.getProductById
);
/**
 * @swagger
 * /api/products/{id}/availability:
 *   get:
 *     summary: Check product availability
 *     description: Check if a product is available and in stock
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Availability checked successfully
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
 *                     available:
 *                       type: boolean
 *                     inStock:
 *                       type: boolean
 *                     stock:
 *                       type: number
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/availability', 
  sanitizeInput, 
  preventMongoInjection, 
  validate(productSchemas.params, 'params'), 
  productController.checkAvailability
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     description: Create a new product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreate'
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Protected routes (authentication required)
router.post('/', 
  authMiddleware.authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(productSchemas.create), 
  productController.createProduct
);
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     description: Update an existing product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreate'
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', 
  authMiddleware.authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(productSchemas.params, 'params'), 
  validate(productSchemas.update), 
  productController.updateProduct
);
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     description: Delete a product and its associated media (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', 
  authMiddleware.authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(productSchemas.params, 'params'), 
  productController.deleteProduct
);
/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Update product stock
 *     description: Update the stock quantity for a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: number
 *                 minimum: 0
 *                 description: New stock quantity
 *               inStock:
 *                 type: boolean
 *                 description: Whether product is in stock
 *     responses:
 *       200:
 *         description: Stock updated successfully
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
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id/stock', 
  authMiddleware.authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  validate(productSchemas.params, 'params'), 
  productController.updateStock
);

/**
 * @swagger
 * /api/products/bulk/stock:
 *   patch:
 *     summary: Bulk update product stock
 *     description: Update stock for multiple products at once (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - stock
 *                   properties:
 *                     productId:
 *                       type: string
 *                     stock:
 *                       type: number
 *                       minimum: 0
 *                     inStock:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Bulk stock update completed
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
 *                     updated:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           error:
 *                             type: string
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/bulk/stock', 
  authMiddleware.authenticate, 
  sanitizeInput, 
  preventMongoInjection, 
  productController.bulkUpdateStock
);

/**
 * @swagger
 * /api/products/inventory/report:
 *   get:
 *     summary: Get inventory report
 *     description: Get detailed inventory report with low stock alerts (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lowStockThreshold
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 5
 *         description: Threshold for low stock alert
 *     responses:
 *       200:
 *         description: Inventory report generated successfully
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
 *                     inStockProducts:
 *                       type: number
 *                     outOfStockProducts:
 *                       type: number
 *                     lowStockProducts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     totalInventoryValue:
 *                       type: number
 *                     categoryBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           count:
 *                             type: number
 *                           value:
 *                             type: number
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/inventory/report', 
  authMiddleware.authenticate, 
  productController.getInventoryReport
);

module.exports = router;