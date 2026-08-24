const router = require('express').Router({ mergeParams: true });

const {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
} = require('../controllers/branch.controller');

const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const {
  createBranchValidator,
  updateBranchValidator,
} = require('../validators/branch.validator');

router.use(authenticate);

/**
 * @openapi
 * /salons/{salonId}/branches:
 *   post:
 *     summary: Create a new branch under a salon
 *     tags: [Branch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *     responses:
 *       201:
 *         description: Branch created successfully
 *   get:
 *     summary: Get all branches for a salon
 *     tags: [Branch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *     responses:
 *       200:
 *         description: List of salon branches
 */
router.post(
  '/',
  checkPermission('branch:create'),
  createBranchValidator,
  validate,
  createBranch
);

router.get('/', checkPermission('branch:read'), getBranches);

/**
 * @openapi
 * /salons/{salonId}/branches/{branchId}:
 *   get:
 *     summary: Get a specific branch by ID
 *     tags: [Branch Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branch details
 *   patch:
 *     summary: Update branch details
 *     tags: [Branch Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branch updated successfully
 *   delete:
 *     summary: Soft delete branch
 *     tags: [Branch Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branch deleted successfully
 */
router.get('/:branchId', checkPermission('branch:read'), getBranch);

router.patch(
  '/:branchId',
  checkPermission('branch:update'),
  updateBranchValidator,
  validate,
  updateBranch
);

router.delete('/:branchId', checkPermission('branch:delete'), deleteBranch);

module.exports = router;