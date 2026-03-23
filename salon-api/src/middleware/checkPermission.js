const AppError = require('../utils/AppError')
const { getRolePermissions } = require('../utils/permissionCache')

// ================================
// checkPermission middleware
// ================================
// usage in routes:
//   router.get('/staff', authenticate, checkPermission('staff:read'), controller)
//   router.delete('/staff/:id', authenticate, checkPermission('staff:delete'), controller)
//
// it returns a middleware function (factory pattern)
// so we can pass the required permission as an argument

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // req.user is set by authenticate middleware before this runs
      const { role } = req.user

      // owner bypasses all permission checks
      // they can do everything within their own salon
      // scope check (salonId) is handled separately
      if (role === 'owner') return next()

      // get permissions for this role from Redis cache
      // e.g. ["appointment:read", "appointment:update", "staff:read"]
      const permissions = await getRolePermissions(role)

      // check if required permission is in the list
      if (!permissions.includes(requiredPermission)) {
        return next(
          new AppError(
            `Access denied. Required permission: ${requiredPermission}`,
            403
          )
        )
      }

      next()

    } catch (error) {
      next(new AppError('Permission check failed.', 500))
    }
  }
}

module.exports = checkPermission