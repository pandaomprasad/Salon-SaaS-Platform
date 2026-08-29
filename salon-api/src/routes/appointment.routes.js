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
const { requireAppointmentScope } = require('../middleware/checkScope')
const idempotency = require('../middleware/idempotency')

const validate = require('../middleware/validate')
const { bookAppointmentValidator } = require('../validators/appointment.validator')

const { bookingLimiter } = require('../middleware/rateLimiter.middleware')

router.use(authenticate)

router.post('/',
  bookingLimiter,
  checkPermission('appointment:create'),
  bookAppointmentValidator,
  validate,
  idempotency,
  bookAppointment
)

router.get('/',
  checkPermission('appointment:read'),
  getAppointments
)

router.get('/:appointmentId',
  checkPermission('appointment:read'),
  requireAppointmentScope,
  getAppointment
)

router.patch('/:appointmentId/status',
  checkPermission('appointment:update'),
  requireAppointmentScope,
  updateAppointmentStatus
)

router.patch('/:appointmentId/rate',
  checkPermission('appointment:read'),
  requireAppointmentScope,
  rateAppointment
)

router.post('/:appointmentId/review',
  checkPermission('appointment:read'),
  requireAppointmentScope,
  rateAppointment
)

router.patch('/:appointmentId/reschedule',
  checkPermission('appointment:update'),
  requireAppointmentScope,
  rescheduleAppointment
)

module.exports = router
