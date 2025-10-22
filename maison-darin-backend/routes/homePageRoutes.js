const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getHomePageContent,
  updateHomePageContent,
  updateSection,
  resetToDefault,
  getContentHistory,
  getHeroSection,
  updateHeroSection,
  addHeroImage,
  removeHeroImage,
  getAboutSection,
  updateAboutSection,
  getFeaturedCollections,
  updateFeaturedCollections,
  addFeaturedCollection,
  updateFeaturedCollection,
  removeFeaturedCollection
} = require('../controllers/homePageController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation middleware
const validateHomePageContent = [
  body('heroTitle').optional().isLength({ min: 1, max: 200 }).withMessage('Hero title must be between 1 and 200 characters'),
  body('heroSubtitle').optional().isLength({ max: 500 }).withMessage('Hero subtitle must be less than 500 characters'),
  body('heroButtonText').optional().isLength({ min: 1, max: 50 }).withMessage('Hero button text must be between 1 and 50 characters'),
  body('heroButtonLink').optional().isURL().withMessage('Hero button link must be a valid URL'),
  body('aboutTitle').optional().isLength({ min: 1, max: 200 }).withMessage('About title must be between 1 and 200 characters'),
  body('aboutDescription').optional().isLength({ max: 1000 }).withMessage('About description must be less than 1000 characters'),
  body('contactEmail').optional().isEmail().withMessage('Contact email must be valid'),
  body('newsletterEmail').optional().isEmail().withMessage('Newsletter email must be valid'),
  body('orderNotificationEmail').optional().isEmail().withMessage('Order notification email must be valid'),
  body('contactFormEmail').optional().isEmail().withMessage('Contact form email must be valid'),
  body('contactPhone').optional().isLength({ max: 20 }).withMessage('Contact phone must be less than 20 characters'),
  body('seoTitle').optional().isLength({ min: 1, max: 60 }).withMessage('SEO title must be between 1 and 60 characters'),
  body('seoDescription').optional().isLength({ min: 1, max: 160 }).withMessage('SEO description must be between 1 and 160 characters'),
  body('featuredProductsLimit').optional().isInt({ min: 1, max: 20 }).withMessage('Featured products limit must be between 1 and 20'),
  body('maintenanceMode').optional().isBoolean().withMessage('Maintenance mode must be boolean'),
  body('showHeroSection').optional().isBoolean().withMessage('Show hero section must be boolean'),
  body('showAboutSection').optional().isBoolean().withMessage('Show about section must be boolean'),
  body('showFeaturedProducts').optional().isBoolean().withMessage('Show featured products must be boolean'),
  body('showCategories').optional().isBoolean().withMessage('Show categories must be boolean'),
  body('showNewsletter').optional().isBoolean().withMessage('Show newsletter must be boolean'),
  body('showContact').optional().isBoolean().withMessage('Show contact must be boolean')
];

// Public routes
router.get('/', getHomePageContent);
router.get('/hero', getHeroSection);
router.get('/about', getAboutSection);
router.get('/featured-collections', getFeaturedCollections);

// Protected routes (Admin only)
router.use(authenticate);
router.use(authorize(['admin']));

// Hero Section validation
const validateHeroSection = [
  body('badge.en').optional().isLength({ min: 1, max: 100 }).withMessage('English badge must be between 1 and 100 characters'),
  body('badge.ar').optional().isLength({ min: 1, max: 100 }).withMessage('Arabic badge must be between 1 and 100 characters'),
  body('title.en').optional().isLength({ min: 1, max: 200 }).withMessage('English title must be between 1 and 200 characters'),
  body('title.ar').optional().isLength({ min: 1, max: 200 }).withMessage('Arabic title must be between 1 and 200 characters'),
  body('subtitle.en').optional().isLength({ max: 500 }).withMessage('English subtitle must be less than 500 characters'),
  body('subtitle.ar').optional().isLength({ max: 500 }).withMessage('Arabic subtitle must be less than 500 characters'),
  body('cta.primary.text.en').optional().isLength({ min: 1, max: 50 }).withMessage('English primary CTA text must be between 1 and 50 characters'),
  body('cta.primary.text.ar').optional().isLength({ min: 1, max: 50 }).withMessage('Arabic primary CTA text must be between 1 and 50 characters'),
  body('cta.secondary.text.en').optional().isLength({ min: 1, max: 50 }).withMessage('English secondary CTA text must be between 1 and 50 characters'),
  body('cta.secondary.text.ar').optional().isLength({ min: 1, max: 50 }).withMessage('Arabic secondary CTA text must be between 1 and 50 characters'),
  body('cta.primary.link').optional().isLength({ min: 1, max: 200 }).withMessage('Primary CTA link must be between 1 and 200 characters'),
  body('cta.secondary.link').optional().isLength({ min: 1, max: 200 }).withMessage('Secondary CTA link must be between 1 and 200 characters'),
  body('images.main.url').optional().isURL().withMessage('Main image URL must be valid'),
  body('images.main.cloudinaryId').optional().isLength({ max: 100 }).withMessage('Cloudinary ID must be less than 100 characters'),
  body('showSection').optional().isBoolean().withMessage('Show section must be boolean'),
  body('showBadge').optional().isBoolean().withMessage('Show badge must be boolean'),
  body('showSlideshow').optional().isBoolean().withMessage('Show slideshow must be boolean'),
  body('slideshowInterval').optional().isInt({ min: 1000, max: 10000 }).withMessage('Slideshow interval must be between 1000 and 10000 milliseconds')
];

// Image validation
const validateHeroImage = [
  body('url').notEmpty().isURL().withMessage('Image URL is required and must be valid'),
  body('cloudinaryId').optional().isLength({ max: 100 }).withMessage('Cloudinary ID must be less than 100 characters'),
  body('alt.en').optional().isLength({ min: 1, max: 200 }).withMessage('English alt text must be between 1 and 200 characters'),
  body('alt.ar').optional().isLength({ min: 1, max: 200 }).withMessage('Arabic alt text must be between 1 and 200 characters'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
];

// About Section validation
const validateAboutSection = [
  body('title.en').optional().isLength({ min: 1, max: 200 }).withMessage('English title must be between 1 and 200 characters'),
  body('title.ar').optional().isLength({ min: 1, max: 200 }).withMessage('Arabic title must be between 1 and 200 characters'),
  body('subtitle.en').optional().isLength({ min: 1, max: 300 }).withMessage('English subtitle must be between 1 and 300 characters'),
  body('subtitle.ar').optional().isLength({ min: 1, max: 300 }).withMessage('Arabic subtitle must be between 1 and 300 characters'),
  body('description.en').optional().isLength({ min: 1, max: 1000 }).withMessage('English description must be between 1 and 1000 characters'),
  body('description.ar').optional().isLength({ min: 1, max: 1000 }).withMessage('Arabic description must be between 1 and 1000 characters'),
  body('legacy.en').optional().isLength({ min: 1, max: 1000 }).withMessage('English legacy text must be between 1 and 1000 characters'),
  body('legacy.ar').optional().isLength({ min: 1, max: 1000 }).withMessage('Arabic legacy text must be between 1 and 1000 characters'),
  body('values.craftsmanship.title.en').optional().isLength({ min: 1, max: 100 }).withMessage('English craftsmanship title must be between 1 and 100 characters'),
  body('values.craftsmanship.title.ar').optional().isLength({ min: 1, max: 100 }).withMessage('Arabic craftsmanship title must be between 1 and 100 characters'),
  body('values.craftsmanship.description.en').optional().isLength({ min: 1, max: 300 }).withMessage('English craftsmanship description must be between 1 and 300 characters'),
  body('values.craftsmanship.description.ar').optional().isLength({ min: 1, max: 300 }).withMessage('Arabic craftsmanship description must be between 1 and 300 characters'),
  body('values.elegance.title.en').optional().isLength({ min: 1, max: 100 }).withMessage('English elegance title must be between 1 and 100 characters'),
  body('values.elegance.title.ar').optional().isLength({ min: 1, max: 100 }).withMessage('Arabic elegance title must be between 1 and 100 characters'),
  body('values.elegance.description.en').optional().isLength({ min: 1, max: 300 }).withMessage('English elegance description must be between 1 and 300 characters'),
  body('values.elegance.description.ar').optional().isLength({ min: 1, max: 300 }).withMessage('Arabic elegance description must be between 1 and 300 characters'),
  body('values.exclusivity.title.en').optional().isLength({ min: 1, max: 100 }).withMessage('English exclusivity title must be between 1 and 100 characters'),
  body('values.exclusivity.title.ar').optional().isLength({ min: 1, max: 100 }).withMessage('Arabic exclusivity title must be between 1 and 100 characters'),
  body('values.exclusivity.description.en').optional().isLength({ min: 1, max: 300 }).withMessage('English exclusivity description must be between 1 and 300 characters'),
  body('values.exclusivity.description.ar').optional().isLength({ min: 1, max: 300 }).withMessage('Arabic exclusivity description must be between 1 and 300 characters'),
  body('statistics.collections.value').optional().isLength({ min: 1, max: 20 }).withMessage('Collections value must be between 1 and 20 characters'),
  body('statistics.collections.label.en').optional().isLength({ min: 1, max: 50 }).withMessage('English collections label must be between 1 and 50 characters'),
  body('statistics.collections.label.ar').optional().isLength({ min: 1, max: 50 }).withMessage('Arabic collections label must be between 1 and 50 characters'),
  body('statistics.clients.value').optional().isLength({ min: 1, max: 20 }).withMessage('Clients value must be between 1 and 20 characters'),
  body('statistics.clients.label.en').optional().isLength({ min: 1, max: 50 }).withMessage('English clients label must be between 1 and 50 characters'),
  body('statistics.clients.label.ar').optional().isLength({ min: 1, max: 50 }).withMessage('Arabic clients label must be between 1 and 50 characters'),
  body('statistics.countries.value').optional().isLength({ min: 1, max: 20 }).withMessage('Countries value must be between 1 and 20 characters'),
  body('statistics.countries.label.en').optional().isLength({ min: 1, max: 50 }).withMessage('English countries label must be between 1 and 50 characters'),
  body('statistics.countries.label.ar').optional().isLength({ min: 1, max: 50 }).withMessage('Arabic countries label must be between 1 and 50 characters'),
  body('showSection').optional().isBoolean().withMessage('Show section must be boolean'),
  body('showStatistics').optional().isBoolean().withMessage('Show statistics must be boolean'),
  body('showValues').optional().isBoolean().withMessage('Show values must be boolean')
];

router.put('/', validateHomePageContent, updateHomePageContent);
router.put('/section/:section', updateSection);
router.post('/reset', resetToDefault);
router.get('/history', getContentHistory);

// Hero Section specific routes
router.put('/hero', validateHeroSection, updateHeroSection);
router.post('/hero/images', validateHeroImage, addHeroImage);
router.delete('/hero/images/:imageIndex', removeHeroImage);

// About Section specific routes
router.put('/about', validateAboutSection, updateAboutSection);

// Featured Collections validation
const validateFeaturedCollections = [
  body('title.en').optional().isLength({ min: 1, max: 200 }).withMessage('English title must be between 1 and 200 characters'),
  body('title.ar').optional().isLength({ min: 1, max: 200 }).withMessage('Arabic title must be between 1 and 200 characters'),
  body('subtitle.en').optional().isLength({ min: 1, max: 300 }).withMessage('English subtitle must be between 1 and 300 characters'),
  body('subtitle.ar').optional().isLength({ min: 1, max: 300 }).withMessage('Arabic subtitle must be between 1 and 300 characters'),
  body('maxCollections').optional().isInt({ min: 1, max: 10 }).withMessage('Max collections must be between 1 and 10'),
  body('showSection').optional().isBoolean().withMessage('Show section must be boolean'),
  body('showPrices').optional().isBoolean().withMessage('Show prices must be boolean'),
  body('showRatings').optional().isBoolean().withMessage('Show ratings must be boolean'),
  body('showViewAllButton').optional().isBoolean().withMessage('Show view all button must be boolean'),
  body('viewAllButtonText.en').optional().isLength({ min: 1, max: 100 }).withMessage('English button text must be between 1 and 100 characters'),
  body('viewAllButtonText.ar').optional().isLength({ min: 1, max: 100 }).withMessage('Arabic button text must be between 1 and 100 characters'),
  body('viewAllButtonLink').optional().isLength({ min: 1, max: 200 }).withMessage('Button link must be between 1 and 200 characters')
];

// Featured Collection validation
const validateFeaturedCollection = [
  body('name.en').notEmpty().isLength({ min: 1, max: 200 }).withMessage('English name is required and must be between 1 and 200 characters'),
  body('name.ar').notEmpty().isLength({ min: 1, max: 200 }).withMessage('Arabic name is required and must be between 1 and 200 characters'),
  body('description.en').notEmpty().isLength({ min: 1, max: 500 }).withMessage('English description is required and must be between 1 and 500 characters'),
  body('description.ar').notEmpty().isLength({ min: 1, max: 500 }).withMessage('Arabic description is required and must be between 1 and 500 characters'),
  body('category.en').notEmpty().isLength({ min: 1, max: 100 }).withMessage('English category is required and must be between 1 and 100 characters'),
  body('category.ar').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Arabic category is required and must be between 1 and 100 characters'),
  body('image.url').notEmpty().isURL().withMessage('Image URL is required and must be valid'),
  body('image.alt.en').optional().isLength({ max: 200 }).withMessage('English alt text must be less than 200 characters'),
  body('image.alt.ar').optional().isLength({ max: 200 }).withMessage('Arabic alt text must be less than 200 characters'),
  body('price.value').notEmpty().isNumeric().withMessage('Price value is required and must be numeric'),
  body('price.currency').optional().isLength({ min: 1, max: 10 }).withMessage('Currency must be between 1 and 10 characters'),
  body('slug').notEmpty().isSlug().withMessage('Slug is required and must be valid'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('Is active must be boolean'),
  body('featured').optional().isBoolean().withMessage('Featured must be boolean')
];

// Featured Collections specific routes
router.put('/featured-collections', validateFeaturedCollections, updateFeaturedCollections);
router.post('/featured-collections/collection', validateFeaturedCollection, addFeaturedCollection);
router.put('/featured-collections/collection/:collectionId', validateFeaturedCollection, updateFeaturedCollection);
router.delete('/featured-collections/collection/:collectionId', removeFeaturedCollection);

module.exports = router;
