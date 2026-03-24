const router = require('express').Router()

const {
  getOverview,
  getPopularServices,
  getStaffPerformance,
  getDailyBookings,
  getSlotUtilization
} = require('../controllers/report.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')

router.use(authenticate)
router.use(checkPermission('report:read'))

router.get('/overview',          getOverview)
router.get('/popular-services',  getPopularServices)
router.get('/staff-performance', getStaffPerformance)
router.get('/daily-bookings',    getDailyBookings)
router.get('/slot-utilization',  getSlotUtilization)

module.exports = router