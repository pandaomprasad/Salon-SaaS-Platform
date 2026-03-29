const Branch = require("../models/branch.model");
const Salon = require("../models/salon.model");
const Service = require("../models/service.model");
const Slot = require("../models/slot.model");
const User = require("../models/user.model");
const Appointment = require("../models/appointment.model");
const AppError = require("../utils/AppError");

// ================================
// POST /api/v1/salons/:salonId/branches
// owner only
// ================================
const createBranch = async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const { userId } = req.user;

    // verify salon belongs to this owner
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return next(new AppError("Salon not found", 404));
    }
    if (salon.owner.toString() !== userId.toString()) {
      return next(
        new AppError("Access denied. You do not own this salon.", 403),
      );
    }

    const branch = await Branch.create({
      ...req.body,
      salonId,
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: { branch },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/salons/:salonId/branches
// owner sees all branches of their salon
// manager/staff see only their branch
// ================================
const getBranches = async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const { role, branchId } = req.user;

    let filter = { salonId, isActive: true };

    // manager and staff only see their own branch
    if (role === "manager" || role === "staff") {
      filter._id = branchId;
    }

    const branches = await Branch.find(filter)
      .populate("managerId", "name email phone")
      .lean();

    res.status(200).json({
      success: true,
      data: { branches },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/salons/:salonId/branches/:branchId
// ================================
const getBranch = async (req, res, next) => {
  try {
    const { salonId, branchId } = req.params;
    const { role, branchId: userBranchId } = req.user;

    // manager/staff can only view their own branch
    if (
      (role === "manager" || role === "staff") &&
      branchId !== userBranchId.toString()
    ) {
      return next(
        new AppError("Access denied. This branch is not assigned to you.", 403),
      );
    }

    const branch = await Branch.findOne({ _id: branchId, salonId })
      .populate("managerId", "name email phone")
      .lean();

    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { branch },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/salons/:salonId/branches/:branchId
// owner or manager
// ================================
const updateBranch = async (req, res, next) => {
  try {
    const { salonId, branchId } = req.params;
    const { role, branchId: userBranchId, userId } = req.user;

    // manager can only update their own branch
    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(
        new AppError("Access denied. This branch is not assigned to you.", 403),
      );
    }

    const branch = await Branch.findOne({ _id: branchId, salonId });
    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    const allowed = [
      "name",
      "contactPhone",
      "contactEmail",
      "workingHours",
      "slotDurationMinutes",
      "advanceBookingDays",
      "address",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) branch[field] = req.body[field];
    });

    await branch.save();

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: { branch },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// DELETE /api/v1/salons/:salonId/branches/:branchId
// owner only — soft delete
// ================================
const deleteBranch = async (req, res, next) => {
  try {
    const { salonId, branchId } = req.params;
    const { userId } = req.user;

    // verify salon ownership
    const salon = await Salon.findById(salonId);
    if (!salon || salon.owner.toString() !== userId.toString()) {
      return next(new AppError("Access denied", 403));
    }

    const branch = await Branch.findOne({ _id: branchId, salonId });
    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    // check if branch has active booked appointments
    const activeAppointments = await Appointment.countDocuments({
      branchId,
      status: { $in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
    });

    if (activeAppointments > 0) {
      return next(
        new AppError(
          `Cannot deactivate branch. There are ${activeAppointments} active appointments. Please cancel or complete them first.`,
          400,
        ),
      );
    }

    // cascade soft delete — all in parallel for performance
    await Promise.all([
      // deactivate branch
      Branch.findByIdAndUpdate(branchId, { isActive: false }),

      // deactivate all services in this branch
      Service.updateMany({ branchId }, { isActive: false }),

      // block all available slots — don't touch booked ones
      Slot.updateMany(
        { branchId, status: "AVAILABLE" },
        { status: "BLOCKED", blockReason: "Branch deactivated" },
      ),

      // deactivate all staff and managers in this branch
      User.updateMany({ branchId }, { isActive: false }),
    ]);

    res.status(200).json({
      success: true,
      message: "Branch and all related data deactivated successfully",
      data: {
        branchId,
        cascaded: {
          services: "deactivated",
          availableSlots: "blocked",
          staff: "deactivated",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
};
