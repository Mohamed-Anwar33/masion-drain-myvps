const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');

// Public routes - no authentication required
router.get('/site-settings', siteSettingsController.getPublicSiteSettings);
router.get('/contact', siteSettingsController.getContactInfo);

module.exports = router;
