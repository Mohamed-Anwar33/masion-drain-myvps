const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');

// Public routes - no authentication required
router.get('/contact', siteSettingsController.getContactInfo);
router.get('/site-info', siteSettingsController.getSiteSettings);
router.get('/site-settings', siteSettingsController.getPublicSiteSettings);

module.exports = router;
