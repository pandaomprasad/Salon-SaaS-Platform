const router = require('express').Router();

const {
  getInitialLoad,
  browseSalons,
  getSalonPublic,
  browseBranches,
  getBranchPublic,
  getBranchSlotsPublic,
  getBranchServicesPublic,
  getBranchStaffPublic,
  getBranchReviewsPublic,
  getSalonReviewsPublic,
} = require('../controllers/browse.controller');

/**
 * @openapi
 * /browse/initial-load:
 *   get:
 *     summary: Fetch consolidated initial home screen payload
 *     tags: [Browse]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Initial payload containing salons, branches, services, and staff
 */
router.get('/initial-load', getInitialLoad);

/**
 * @openapi
 * /browse/salons:
 *   get:
 *     summary: Browse salons by search term or city
 *     tags: [Browse]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching active salons
 */
router.get('/salons', browseSalons);

/**
 * @openapi
 * /browse/salons/{salonId}:
 *   get:
 *     summary: Get public salon profile by ID
 *     tags: [Browse]
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public salon details
 */
router.get('/salons/:salonId', getSalonPublic);

/**
 * @openapi
 * /browse/salons/{salonId}/reviews:
 *   get:
 *     summary: Get reviews for a salon
 *     tags: [Browse]
 *     responses:
 *       200:
 *         description: List of salon reviews
 */
router.get('/salons/:salonId/reviews', getSalonReviewsPublic);

/**
 * @openapi
 * /browse/branches:
 *   get:
 *     summary: Browse physical salon branches
 *     tags: [Browse]
 *     responses:
 *       200:
 *         description: List of branches
 */
router.get('/branches', browseBranches);

/**
 * @openapi
 * /browse/branches/{branchId}:
 *   get:
 *     summary: Get branch details
 *     tags: [Browse]
 *     responses:
 *       200:
 *         description: Branch profile details
 */
router.get('/branches/:branchId', getBranchPublic);

/**
 * @openapi
 * /browse/branches/{branchId}/slots:
 *   get:
 *     summary: Get available booking slots for a branch on a given date
 *     tags: [Browse]
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: "2026-09-01"
 *     responses:
 *       200:
 *         description: Available slots
 */
router.get('/branches/:branchId/slots', getBranchSlotsPublic);

/**
 * @openapi
 * /browse/branches/{branchId}/services:
 *   get:
 *     summary: Get service catalog offered by a branch
 *     tags: [Browse]
 *     responses:
 *       200:
 *         description: List of branch services
 */
router.get('/branches/:branchId/services', getBranchServicesPublic);

/**
 * @openapi
 * /browse/branches/{branchId}/staff:
 *   get:
 *     summary: Get active staff members at a branch
 *     tags: [Browse]
 *     responses:
 *       200:
 *         description: List of branch staff specialists
 */
router.get('/branches/:branchId/staff', getBranchStaffPublic);

/**
 * @openapi
 * /browse/branches/{branchId}/reviews:
 *   get:
 *     summary: Get branch reviews
 *     tags: [Browse]
 *     responses:
 *       200:
 *         description: Branch reviews
 */
router.get('/branches/:branchId/reviews', getBranchReviewsPublic);

module.exports = router;