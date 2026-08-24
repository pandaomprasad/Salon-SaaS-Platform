const logger = require('./logger');

/**
 * Pre-populates Redis cache for frequently accessed public endpoints on server startup.
 * Prevents initial cold DB query latency for first-time visitors.
 */
const warmCacheOnBoot = async () => {
  try {
    console.log("🔥 [CACHE WARMER] Starting background cache warm-up...");
    
    const browseController = require('../controllers/browse.controller');
    if (!browseController || !browseController.browseSalons) {
      return;
    }

    const createMockReqRes = (query = {}) => {
      return {
        req: { query },
        res: {
          status: () => ({
            json: () => {}
          }),
          json: () => {}
        },
        next: (err) => {
          if (err) logger.warn(`Cache warming error: ${err.message}`);
        }
      };
    };

    // 1. Default salons list
    const mock1 = createMockReqRes({ page: '1', limit: '10' });
    await browseController.browseSalons(mock1.req, mock1.res, mock1.next);

    // 2. City specific salons list (Brahmapur)
    const mock2 = createMockReqRes({ city: 'Brahmapur', page: '1', limit: '10' });
    await browseController.browseSalons(mock2.req, mock2.res, mock2.next);

    // 3. Consolidated Initial Load
    if (typeof browseController.getInitialLoad === 'function') {
      const mock3 = createMockReqRes({ page: '1', limit: '10' });
      await browseController.getInitialLoad(mock3.req, mock3.res, mock3.next);
    }

    // 4. Active Banners
    if (typeof browseController.getBanners === 'function') {
      const mock4 = createMockReqRes({});
      await browseController.getBanners(mock4.req, mock4.res, mock4.next);
    }

    console.log("✅ [CACHE WARMER] Cache warm-up completed successfully!");
  } catch (err) {
    console.warn(`⚠️ [CACHE WARMER] Cache warm-up non-fatal error: ${err.message}`);
  }
};

module.exports = warmCacheOnBoot;
