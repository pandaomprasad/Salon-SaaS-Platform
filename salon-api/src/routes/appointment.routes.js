const router = require('express').Router()

const {
  bookAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  rateAppointment,
  rescheduleAppointment
} = require('../controllers/appointment.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')
const idempotency = require('../middleware/idempotency')

router.use(authenticate)

router.post('/',
  checkPermission('appointment:create'),
  idempotency,
  bookAppointment
)

router.get('/',
  checkPermission('appointment:read'),
  getAppointments
)

router.get('/:appointmentId',
  checkPermission('appointment:read'),
  getAppointment
)

router.patch('/:appointmentId/status',
  checkPermission('appointment:update'),
  updateAppointmentStatus
)

router.patch('/:appointmentId/rate',
  checkPermission('appointment:read'),
  rateAppointment
)

router.post('/:appointmentId/review',
  checkPermission('appointment:read'),
  rateAppointment
)

router.patch('/:appointmentId/reschedule',
  checkPermission('appointment:update'),
  rescheduleAppointment
)

module.exports = router
