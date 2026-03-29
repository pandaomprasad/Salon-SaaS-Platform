const AppError = require("../utils/AppError");
const { getUserPermissions } = require("../utils/permissionCache");

// ================================
// checkPermission middleware
// ================================
// checks FINAL permissions for a user
// final = role permissions + extra - denied
//
// usage:
//   router.get('/reports', authenticate, checkPermission('report:read'), controller)

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { role, userId } = req.user;

      // owner bypasses all permission checks
      if (role === "owner") return next();

      // get final permissions for this specific user
      // merges role + extra - denied
      const permissions = await getUserPermissions(role, userId);

      if (!permissions.includes(requiredPermission)) {
        return next(
          new AppError(
            `Access denied. Required permission: ${requiredPermission}`,
            403,
          ),
        );
      }

      next();
    } catch (error) {
      next(new AppError("Permission check failed.", 500));
    }
  };
};

module.exports = checkPermission;
