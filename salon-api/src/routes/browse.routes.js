const router = require('express').Router()

const {
  browseSalons,
  getSalonPublic,
  browseBranches,
  getBranchPublic,
  getBranchSlotsPublic,
  getBranchServicesPublic
} = require('../controllers/browse.controller')

// ================================
// ALL PUBLIC — no authentication
// ================================

// salons
router.get('/salons',             browseSalons)
router.get('/salons/:salonId',    getSalonPublic)

// branches
router.get('/branches',                          browseBranches)
router.get('/branches/:branchId',                getBranchPublic)
router.get('/branches/:branchId/slots',          getBranchSlotsPublic)
router.get('/branches/:branchId/services',       getBranchServicesPublic)

module.exports = router