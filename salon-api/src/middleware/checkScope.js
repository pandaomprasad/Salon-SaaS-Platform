const AppError = require('../utils/AppError');
const Salon = require('../models/salon.model');
const Branch = require('../models/branch.model');
const Appointment = require('../models/appointment.model');

// ================================
// requireSalonScope
// ================================
const requireSalonScope = async (req, res, next) => {
  try {
    const { role, salonId, userId } = req.user || {};

    if (role === 'superadmin' || role === 'customer') return next();

    if (role === 'owner') {
      const rawSalonId =
        req.params?.salonId ||
        req.body?.salonId ||
        (req.resource && (req.resource.salonId?._id || req.resource.salonId));

      const requestedSalonId = rawSalonId ? rawSalonId.toString() : null;

      if (requestedSalonId) {
        if (salonId && requestedSalonId === salonId.toString()) {
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
    const { role, salonId, branchId, userId } = req.user || {};

    if (role === 'superadmin' || role === 'customer') return next();

    if (role === 'owner') {
      const rawBranchId =
        req.params?.branchId ||
        req.body?.branchId ||
        (req.resource && (req.resource.branchId?._id || req.resource.branchId));

      const rawSalonId =
        req.params?.salonId ||
        req.body?.salonId ||
        (req.resource && (req.resource.salonId?._id || req.resource.salonId));

      const targetBranchId = rawBranchId ? rawBranchId.toString() : null;
      const targetSalonId = rawSalonId ? rawSalonId.toString() : null;

      if (targetBranchId) {
        const branch = await Branch.findById(targetBranchId).select('salonId').lean();
        if (!branch) return next(new AppError('Branch not found', 404));

        const branchSalonId = branch.salonId?._id ? branch.salonId._id.toString() : branch.salonId?.toString();

        if (salonId && branchSalonId === salonId.toString()) {
          req.scopedSalonId = salonId;
          return next();
        }

        const ownsSalon = await Salon.exists({ _id: branchSalonId, owner: userId });
        if (!ownsSalon) {
          return next(new AppError('Access denied. This branch does not belong to your salon.', 403));
        }
        req.scopedSalonId = branchSalonId;
        return next();
      }

      if (targetSalonId) {
        if (salonId && targetSalonId === salonId.toString()) {
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
      const rawBranchId =
        req.params?.branchId ||
        req.body?.branchId ||
        (req.resource && (req.resource.branchId?._id || req.resource.branchId));

      const requestedBranchId = rawBranchId ? rawBranchId.toString() : null;

      if (!requestedBranchId) {
        req.scopedBranchId = branchId;
        req.scopedSalonId = salonId;
        return next();
      }

      const userBranchStr = branchId ? branchId.toString() : null;

      if (!userBranchStr || requestedBranchId !== userBranchStr) {
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
    const { role, salonId, branchId, userId } = req.user || {};
    const appointmentId = req.params?.appointmentId || req.body?.appointmentId;

    if (!appointmentId) return next();

    const appointment = await Appointment.findById(appointmentId).setOptions({ skipTenant: true }).lean();
    if (!appointment) return next(new AppError('Appointment not found', 404));

    req.resource = appointment;

    if (role === 'superadmin') return next();

    const apptCustomerId = appointment.customerId?._id ? appointment.customerId._id.toString() : appointment.customerId?.toString();
    const apptBranchId = appointment.branchId?._id ? appointment.branchId._id.toString() : appointment.branchId?.toString();
    const apptSalonId = appointment.salonId?._id ? appointment.salonId._id.toString() : appointment.salonId?.toString();

    if (role === 'customer') {
      if (apptCustomerId !== userId.toString()) {
        return next(new AppError('Access denied. This appointment does not belong to you.', 403));
      }
      return next();
    }

    if (role === 'manager' || role === 'staff') {
      const userBranchStr = branchId ? branchId.toString() : null;
      if (!userBranchStr || apptBranchId !== userBranchStr) {
        return next(new AppError('Access denied. This appointment does not belong to your branch.', 403));
      }
      return next();
    }

    if (role === 'owner') {
      if (salonId && apptSalonId === salonId.toString()) {
        return next();
      }
      const ownsSalon = await Salon.exists({ _id: apptSalonId, owner: userId });
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
      if (req.user && req.user.role === 'superadmin') return next();
      if (!req.resource) {
        return next(new AppError('Resource not loaded for ownership check.', 500));
      }

      const resourceUserId = req.resource[userIdField];
      if (!resourceUserId) {
        return next(new AppError(`Field ${userIdField} not found on resource.`, 500));
      }

      const resUserStr = resourceUserId._id ? resourceUserId._id.toString() : resourceUserId.toString();

      if (resUserStr !== req.user.userId.toString()) {
        return next(new AppError('Access denied. You do not own this resource.', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireSalonScope,
  requireBranchScope,
  requireAppointmentScope,
  requireOwnership,
};