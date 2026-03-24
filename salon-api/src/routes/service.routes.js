const router = require('express').Router({ mergeParams: true })

const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  assignStaffToService
} = require('../controllers/service.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')
const validate = require('../middleware/validate')
const { createServiceValidator, updateServiceValidator } = require('../validators/service.validator')

router.use(authenticate)

router.post('/',
  checkPermission('service:create'),
  createServiceValidator, validate,
  createService
)

router.get('/',
  checkPermission('service:read'),
  getServices
)

router.get('/:serviceId',
  checkPermission('service:read'),
  getService
)

router.patch('/:serviceId',
  checkPermission('service:update'),
  updateServiceValidator, validate,
  updateService
)

router.delete('/:serviceId',
  checkPermission('service:delete'),
  deleteService
)

router.patch('/:serviceId/staff',
  checkPermission('service:update'),
  assignStaffToService
)

module.exports = router