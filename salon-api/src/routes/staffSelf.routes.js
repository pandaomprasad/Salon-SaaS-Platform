const router = require('express').Router()

const {
  createMyLeave,
  getMyLeaves,
  cancelMyLeave,
} = require('../controllers/leave.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')
const validate = require('../middleware/validate')
const { myLeaveValidator } = require('../validators/leave.validator')

router.use(authenticate)

// GET /api/v1/staff/me/leaves
// staff own leaves (role gated inside controller)
router.get('/me/leaves', checkPermission('appointment:read'), getMyLeaves)

// POST /api/v1/staff/me/leaves
// staff set their own availability
router.post(
  '/me/leaves',
  checkPermission('appointment:read'),
  myLeaveValidator,
  validate,
  createMyLeave,
)

// DELETE /api/v1/staff/me/leaves/:leaveId
// staff cancel their own leave
router.delete('/me/leaves/:leaveId', checkPermission('appointment:read'), cancelMyLeave)

module.exports = router