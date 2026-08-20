// salon-api/src/routes/banner.routes.js
const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');

// Public routes for Customer App
router.get('/', bannerController.getActiveBanners);
router.post('/:id/click', bannerController.trackBannerClick);

module.exports = router;
