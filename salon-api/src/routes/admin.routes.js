const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const adminController = require('../controllers/admin.controller')

// All admin routes require authentication + superadmin role
router.use(authenticate)
router.use((req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Access denied. Superadmin only.' })
  }
  next()
})

// Dashboard / overview
router.get('/stats', adminController.getPlatformStats)

// Salon management
router.get('/salons', adminController.getAllSalons)
router.post('/salons', adminController.createSalon)
router.get('/salons/:salonId', adminController.getSalon)
router.get('/salons/:salonId/staff', adminController.getSalonStaff)
router.get('/activity', adminController.getActivity)
router.patch('/salons/:salonId/branches/:branchId', adminController.adminUpdateBranch)
router.patch('/salons/:salonId', adminController.updateSalon)
router.delete('/salons/:salonId', adminController.deleteSalon)

// Owner management
router.get('/owners', adminController.getAllOwners)
router.post('/owners', adminController.createOwner)
router.patch('/owners/:ownerId', adminController.updateOwner)
router.delete('/owners/:ownerId', adminController.deactivateOwner)

// Owner registration requests (from public landing page)
router.get('/owner-requests', adminController.listOwnerRequests)
router.post('/owner-requests/:requestId/approve', adminController.approveOwnerRequest)
router.post('/owner-requests/:requestId/reject', adminController.rejectOwnerRequest)

// Customers (limited view)
router.get('/customers', adminController.getAllCustomers)

// Growth tracking
router.get('/growth', adminController.getGrowthStats)

module.exports = router