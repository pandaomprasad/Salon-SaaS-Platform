const router = require('express').Router({ mergeParams: true })

const {
  createStaff,
  getStaff,
  getStaffMember,
  updateStaff,
  deleteStaff
} = require('../controllers/staff.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')
const validate = require('../middleware/validate')
const { createStaffValidator, updateStaffValidator } = require('../validators/staff.validator')

router.use(authenticate)

router.post('/',
  checkPermission('staff:create'),
  createStaffValidator, validate,
  createStaff
)

router.get('/',
  checkPermission('staff:read'),
  getStaff
)

router.get('/:staffId',
  checkPermission('staff:read'),
  getStaffMember
)

router.patch('/:staffId',
  checkPermission('staff:update'),
  updateStaffValidator, validate,
  updateStaff
)

router.delete('/:staffId',
  checkPermission('staff:delete'),
  deleteStaff
)

module.exports = router