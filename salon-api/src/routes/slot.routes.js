const router = require('express').Router({ mergeParams: true })

const {
  generateSlots,
  getSlots,
  blockSlot,
  unblockSlot
} = require('../controllers/slot.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')

router.use(authenticate)

router.post('/generate',
  checkPermission('slot:create'),
  generateSlots
)

router.get('/',
  checkPermission('slot:read'),
  getSlots
)

router.patch('/:slotId/block',
  checkPermission('slot:update'),
  blockSlot
)

router.patch('/:slotId/unblock',
  checkPermission('slot:update'),
  unblockSlot
)

module.exports = router