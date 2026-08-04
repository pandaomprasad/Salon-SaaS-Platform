const router = require('express').Router()

const {
  browseSalons,
  getSalonPublic,
  browseBranches,
  getBranchPublic,
  getBranchSlotsPublic,
  getBranchServicesPublic,
  getBranchStaffPublic,
  getBranchReviewsPublic,
  getSalonReviewsPublic,
} = require('../controllers/browse.controller')

// ================================
// ALL PUBLIC — no authentication
// ================================

// salons
router.get('/salons',                     browseSalons)
router.get('/salons/:salonId',            getSalonPublic)
router.get('/salons/:salonId/reviews',    getSalonReviewsPublic)

// branches
router.get('/branches',                  browseBranches)
router.get('/branches/:branchId',        getBranchPublic)
router.get('/branches/:branchId/slots',  getBranchSlotsPublic)
router.get('/branches/:branchId/services', getBranchServicesPublic)
router.get('/branches/:branchId/staff',  getBranchStaffPublic)
router.get('/branches/:branchId/reviews', getBranchReviewsPublic)

module.exports = router