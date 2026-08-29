const router = require('express').Router({ mergeParams: true });

const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  assignStaffToService,
} = require('../controllers/service.controller');

const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');
const { requireBranchScope } = require('../middleware/checkScope');
const validate = require('../middleware/validate');
const { createServiceValidator, updateServiceValidator } = require('../validators/service.validator');

router.use(authenticate);

router.post(
  '/',
  checkPermission('service:create'),
  requireBranchScope,
  createServiceValidator, validate,
  createService
);

router.get('/', checkPermission('service:read'), requireBranchScope, getServices);

router.get('/:serviceId', checkPermission('service:read'), requireBranchScope, getService);

router.patch(
  '/:serviceId',
  checkPermission('service:update'),
  requireBranchScope,
  updateServiceValidator, validate,
  updateService
);

router.delete('/:serviceId', checkPermission('service:delete'), requireBranchScope, deleteService);

router.patch(
  '/:serviceId/staff',
  checkPermission('service:update'),
  requireBranchScope,
  assignStaffToService
);

module.exports = router;