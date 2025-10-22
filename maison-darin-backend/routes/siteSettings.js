const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Site Settings Routes
router.get('/', siteSettingsController.getSiteSettings);
router.put('/', siteSettingsController.updateSiteSettings);

// Email Settings Routes
router.get('/email', siteSettingsController.getEmailSettings);
router.put('/email', siteSettingsController.updateEmailSettings);
router.post('/email/test', siteSettingsController.testEmailSettings);

// Contact Information Routes (public access for contact info)
router.get('/contact', (req, res, next) => {
  // Remove auth middleware for this specific route
  siteSettingsController.getContactInfo(req, res, next);
});
router.put('/contact', siteSettingsController.updateContactInfo);

module.exports = router;
