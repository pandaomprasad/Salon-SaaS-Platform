const router = require('express').Router()
const {
  createSalon,
  getMySalons,
  getSalon,
  updateSalon,
  deleteSalon
} = require('../controllers/salon.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')
const validate = require('../middleware/validate')
const {
  createSalonValidator,
  updateSalonValidator
} = require('../validators/salon.validator')

// all salon routes require authentication
router.use(authenticate)

router.post('/',
  checkPermission('salon:create'),
  createSalonValidator, validate,
  createSalon
)

router.get('/',
  checkPermission('salon:read'),
  getMySalons
)

router.get('/:salonId',
  checkPermission('salon:read'),
  getSalon
)

router.patch('/:salonId',
  checkPermission('salon:update'),
  updateSalonValidator, validate,
  updateSalon
)

router.delete('/:salonId',
  checkPermission('salon:delete'),
  deleteSalon
)

module.exports = router