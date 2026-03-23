const AppError = require('../utils/AppError')

// ================================
// checkScope middleware
// ================================
// WHAT IS SCOPE?
// Even if a user has the right permission, they should only access
// data that belongs to THEIR salon or THEIR branch
//
// Example:
//   Manager A (branchId: "branch_bandra") should NEVER see
//   Manager B's data (branchId: "branch_andheri")
//   Even if both have "appointment:read" permission
//
// HOW IT WORKS:
// We look at the resource being accessed and compare its
// salonId/branchId against what's in req.user
//
// This middleware is attached to routes that deal with
// branch-specific or salon-specific resources

// ================================
// requireSalonScope
// ================================
// use on routes where the resource must belong to user's salon
// e.g. owner viewing their branches, owner managing their managers
//
// expects: req.params.salonId OR req.body.salonId OR req.resource.salonId

const requireSalonScope = (req, res, next) => {
  try {
    const { role, salonId } = req.user

    // owner — check the requested salonId matches their own
    if (role === 'owner') {
      const requestedSalonId =
        req.params.salonId ||
        req.body.salonId ||
        (req.resource && req.resource.salonId)

      // if no salonId in request, attach user's salonId automatically
      if (!requestedSalonId) {
        req.scopedSalonId = salonId
        return next()
      }

      if (requestedSalonId.toString() !== salonId.toString()) {
        return next(new AppError('Access denied. This salon does not belong to you.', 403))
      }

      req.scopedSalonId = salonId
      return next()
    }

    // manager/staff — their salonId is fixed on their account
    if (role === 'manager' || role === 'staff') {
      req.scopedSalonId = salonId
      return next()
    }

    // customer — no salon scope needed
    if (role === 'customer') {
      return next()
    }

    next(new AppError('Scope check failed.', 403))

  } catch (error) {
    next(new AppError('Scope check failed.', 500))
  }
}

// ================================
// requireBranchScope
// ================================
// use on routes where the resource must belong to user's branch
// e.g. manager viewing their staff, staff viewing their slots
//
// for owner: they can access ANY branch under their salon
// for manager/staff: only their assigned branch

const requireBranchScope = (req, res, next) => {
  try {
    const { role, salonId, branchId } = req.user

    // owner can access any branch — but only within their salon
    // we attach scopedSalonId so controllers can filter by it
    if (role === 'owner') {
      req.scopedSalonId = salonId
      // no branchId restriction for owner
      return next()
    }

    // manager and staff are locked to their single branch
    if (role === 'manager' || role === 'staff') {
      const requestedBranchId =
        req.params.branchId ||
        req.body.branchId ||
        (req.resource && req.resource.branchId)

      // if no branchId in request, attach their branchId automatically
      if (!requestedBranchId) {
        req.scopedBranchId = branchId
        req.scopedSalonId = salonId
        return next()
      }

      // block access if they try to access another branch
      if (requestedBranchId.toString() !== branchId.toString()) {
        return next(
          new AppError('Access denied. This branch is not assigned to you.', 403)
        )
      }

      req.scopedBranchId = branchId
      req.scopedSalonId = salonId
      return next()
    }

    // customer — no branch scope restriction
    // they can view any branch's services/slots to book
    if (role === 'customer') {
      return next()
    }

    next(new AppError('Scope check failed.', 403))

  } catch (error) {
    next(new AppError('Scope check failed.', 500))
  }
}

// ================================
// requireOwnership
// ================================
// use for resources the user themselves created
// e.g. customer can only cancel THEIR OWN appointment
// attaches the ownership check to the resource loaded in req.resource

const requireOwnership = (userIdField = 'customerId') => {
  return (req, res, next) => {
    try {
      const { userId, role } = req.user
      const resource = req.resource

      if (!resource) {
        return next(new AppError('Resource not found.', 404))
      }

      // owner and manager can access any resource in their scope
      if (role === 'owner' || role === 'manager') return next()

      // staff and customer must own the resource
      const ownerId = resource[userIdField]
      if (!ownerId || ownerId.toString() !== userId.toString()) {
        return next(new AppError('Access denied. This resource does not belong to you.', 403))
      }

      next()
    } catch (error) {
      next(new AppError('Ownership check failed.', 500))
    }
  }
}

module.exports = { requireSalonScope, requireBranchScope, requireOwnership }