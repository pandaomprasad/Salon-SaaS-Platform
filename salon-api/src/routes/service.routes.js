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
const validate = require('../middleware/validate');
const { createServiceValidator, updateServiceValidator } = require('../validators/service.validator');

router.use(authenticate);

/**
 * @openapi
 * /branches/{branchId}/services:
 *   post:
 *     summary: Create a new service under a branch
 *     tags: [Service Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Service created
 *   get:
 *     summary: Get service catalog for a branch
 *     tags: [Service Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service catalog list
 */
router.post(
  '/',
  checkPermission('service:create'),
  createServiceValidator, validate,
  createService
);

router.get('/', checkPermission('service:read'), getServices);

/**
 * @openapi
 * /branches/{branchId}/services/{serviceId}:
 *   get:
 *     summary: Get service details
 *     tags: [Service Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service details
 *   patch:
 *     summary: Update service details & pricing
 *     tags: [Service Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service updated
 *   delete:
 *     summary: Soft delete service
 *     tags: [Service Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service deleted
 */
router.get('/:serviceId', checkPermission('service:read'), getService);

router.patch(
  '/:serviceId',
  checkPermission('service:update'),
  updateServiceValidator, validate,
  updateService
);

router.delete('/:serviceId', checkPermission('service:delete'), deleteService);

/**
 * @openapi
 * /branches/{branchId}/services/{serviceId}/staff:
 *   patch:
 *     summary: Assign staff specialists to a service
 *     tags: [Service Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff assigned to service successfully
 */
router.patch(
  '/:serviceId/staff',
  checkPermission('service:update'),
  assignStaffToService
);

module.exports = router;