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
const { requireSalonScope, requireBranchScope } = require('../middleware/checkScope');
const validate = require('../middleware/validate');
const {
  createBranchValidator,
  updateBranchValidator,
} = require('../validators/branch.validator');

router.use(authenticate);

router.post(
  '/',
  checkPermission('branch:create'),
  requireSalonScope,
  createBranchValidator,
  validate,
  createBranch
);

router.get('/', checkPermission('branch:read'), requireBranchScope, getBranches);

router.get('/:branchId', checkPermission('branch:read'), requireBranchScope, getBranch);

router.patch(
  '/:branchId',
  checkPermission('branch:update'),
  requireBranchScope,
  updateBranchValidator,
  validate,
  updateBranch
);

router.delete('/:branchId', checkPermission('branch:delete'), requireBranchScope, deleteBranch);

module.exports = router;