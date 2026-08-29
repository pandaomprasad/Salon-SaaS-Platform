// salon-api/src/controllers/banner.controller.js
const Banner = require('../models/Banner');
const { delCachePattern } = require('../services/cache.service');

const clearBannerCache = async () => {
  try {
    await delCachePattern('banners:*');
    await delCachePattern('initial_load:*');
  } catch (err) {}
};

/**
 * Get active promotional banners for Customer App
 * GET /api/v1/banners
 */
exports.getActiveBanners = async (req, res, next) => {
  try {
    const { city } = req.query;
    const query = { isActive: true };

    if (city) {
      query.$or = [{ city: { $exists: false } }, { city: '' }, { city: new RegExp(city, 'i') }];
    }

    const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all banners for Admin Dashboard
 * GET /api/v1/banners/admin
 */
exports.getAdminBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new promotional banner (Admin)
 * POST /api/v1/banners/admin
 */
exports.createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    await clearBannerCache();
    res.status(201).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update banner (Admin)
 * PUT /api/v1/banners/admin/:id
 */
exports.updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await clearBannerCache();

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete banner (Admin)
 * DELETE /api/v1/banners/admin/:id
 */
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await clearBannerCache();

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track banner click
 * POST /api/v1/banners/:id/click
 */
exports.trackBannerClick = async (req, res, next) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
