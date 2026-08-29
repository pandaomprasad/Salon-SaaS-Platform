const AppError = require('../utils/AppError');
const Salon = require('../models/salon.model');
const Branch = require('../models/branch.model');
const Appointment = require('../models/appointment.model');

// ================================
// requireSalonScope
// ================================
const requireSalonScope = async (req, res, next) => {
  try {
    const { role, salonId, userId } = req.user;

    if (role === 'superadmin' || role === 'customer') return next();

    if (role === 'owner') {
      const requestedSalonId =
        req.params.salonId ||
        req.body.salonId ||
        (req.resource && req.resource.salonId);

      if (requestedSalonId) {
        if (salonId && requestedSalonId.toString() === salonId.toString()) {
          req.scopedSalonId = salonId;
          return next();
        }
        const ownsSalon = await Salon.exists({ _id: requestedSalonId, owner: userId });
        if (!ownsSalon) {
          return next(new AppError('Access denied. This salon does not belong to you.', 403));
        }
        req.scopedSalonId = requestedSalonId;
        return next();
      }

      req.scopedSalonId = salonId;
      return next();
    }

    if (role === 'manager' || role === 'staff') {
      req.scopedSalonId = salonId;
      return next();
    } else {
      return next(new AppError('Access denied. Role not authorized for salon scope.', 403));
    }
  } catch (error) {
    next(error);
  }
};

// ================================
// requireBranchScope
// ================================
const requireBranchScope = async (req, res, next) => {
  try {
    const { role, salonId, branchId, userId } = req.user;

    if (role === 'superadmin' || role === 'customer') return next();

    if (role === 'owner') {
      const targetBranchId =
        req.params.branchId ||
        req.body.branchId ||
        (req.resource && req.resource.branchId);

      const targetSalonId =
        req.params.salonId ||
        req.body.salonId ||
        (req.resource && req.resource.salonId);

      if (targetBranchId) {
        const branch = await Branch.findById(targetBranchId).select('salonId').lean();
        if (!branch) return next(new AppError('Branch not found', 404));

        if (salonId && branch.salonId.toString() === salonId.toString()) {
          req.scopedSalonId = salonId;
          return next();
        }

        const ownsSalon = await Salon.exists({ _id: branch.salonId, owner: userId });
        if (!ownsSalon) {
          return next(new AppError('Access denied. This branch does not belong to your salon.', 403));
        }
        req.scopedSalonId = branch.salonId;
        return next();
      }

      if (targetSalonId) {
        if (salonId && targetSalonId.toString() === salonId.toString()) {
          req.scopedSalonId = salonId;
          return next();
        }
        const ownsSalon = await Salon.exists({ _id: targetSalonId, owner: userId });
        if (!ownsSalon) {
          return next(new AppError('Access denied. This salon does not belong to you.', 403));
        }
        req.scopedSalonId = targetSalonId;
        return next();
      }

      req.scopedSalonId = salonId;
      return next();
    }

    if (role === 'manager' || role === 'staff') {
      const requestedBranchId =
        req.params.branchId ||
        req.body.branchId ||
        (req.resource && req.resource.branchId);

      if (!requestedBranchId) {
        req.scopedBranchId = branchId;
        req.scopedSalonId = salonId;
        return next();
      }

      if (requestedBranchId.toString() !== branchId.toString()) {
        return next(new AppError('Access denied. This branch is not assigned to you.', 403));
      }

      req.scopedBranchId = branchId;
      req.scopedSalonId = salonId;
      return next();
    } else {
      return next(new AppError('Access denied. Role not authorized for branch scope.', 403));
    }
  } catch (error) {
    next(error);
  }
};

// ================================
// requireAppointmentScope
// ================================
const requireAppointmentScope = async (req, res, next) => {
  try {
    const { role, salonId, branchId, userId } = req.user;
    const appointmentId = req.params.appointmentId || req.body.appointmentId;

    if (!appointmentId) return next();

    const appointment = await Appointment.findById(appointmentId).setOptions({ skipTenant: true }).lean();
    if (!appointment) return next(new AppError('Appointment not found', 404));

    req.resource = appointment;

    if (role === 'superadmin') return next();

    if (role === 'customer') {
      if (appointment.customerId.toString() !== userId.toString()) {
        return next(new AppError('Access denied. This appointment does not belong to you.', 403));
      }
      return next();
    }

    if (role === 'manager' || role === 'staff') {
      if (appointment.branchId.toString() !== branchId.toString()) {
        return next(new AppError('Access denied. This appointment does not belong to your branch.', 403));
      }
      return next();
    }

    if (role === 'owner') {
      if (salonId && appointment.salonId.toString() === salonId.toString()) {
        return next();
      }
      const ownsSalon = await Salon.exists({ _id: appointment.salonId, owner: userId });
      if (!ownsSalon) {
        return next(new AppError('Access denied. This appointment does not belong to your salon.', 403));
      }
      return next();
    } else {
      return next(new AppError('Access denied. Role not authorized for appointment scope.', 403));
    }
  } catch (error) {
    next(error);
  }
};

const requireOwnership = (userIdField = 'customerId') => {
  return (req, res, next) => {
    try {
      const { userId, role } = req.user;
      const resource = req.resource;

      if (!resource) {
        return next(new AppError('Resource not found.', 404));
      }

      if (role === 'owner' || role === 'manager') return next();

      const ownerId = resource[userIdField];
      if (!ownerId || ownerId.toString() !== userId.toString()) {
        return next(new AppError('Access denied. This resource does not belong to you.', 403));
      }

      next();
    } catch (error) {
      next(new AppError('Ownership check failed.', 500));
    }
  };
};

module.exports = { requireSalonScope, requireBranchScope, requireAppointmentScope, requireOwnership };