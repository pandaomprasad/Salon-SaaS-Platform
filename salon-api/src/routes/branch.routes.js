const router = require('express').Router({ mergeParams: true })
// mergeParams: true is important!
// it lets this router access :salonId from the parent router
// without it req.params.salonId would be undefined

const {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branch.controller')

const authenticate = require('../middleware/authenticate')
const checkPermission = require('../middleware/checkPermission')
const validate = require('../middleware/validate')
const {
  createBranchValidator,
  updateBranchValidator
} = require('../validators/branch.validator')

router.use(authenticate)

router.post('/',
  checkPermission('branch:create'),
  createBranchValidator, validate,
  createBranch
)

router.get('/',
  checkPermission('branch:read'),
  getBranches
)

router.get('/:branchId',
  checkPermission('branch:read'),
  getBranch
)

router.patch('/:branchId',
  checkPermission('branch:update'),
  updateBranchValidator, validate,
  updateBranch
)

router.delete('/:branchId',
  checkPermission('branch:delete'),
  deleteBranch
)

module.exports = router