const router = require('express').Router()

const {
  getMyAppointmentHistory
} = require('../controllers/appointment.controller')

const authenticate = require('../middleware/authenticate')

router.use(authenticate)

// GET /api/v1/customers/me/appointments
// customer only — full appointment history with summary stats
// supports: ?status=COMPLETED&fromDate=2026-01-01&toDate=2026-03-31&sort=newest&page=1&limit=20
router.get('/me/appointments', (req, res, next) => {
  // ensure only customers can access their own history
  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is for customers only. Use GET /api/v1/appointments instead.'
    })
  }
  next()
}, getMyAppointmentHistory)

module.exports = router
