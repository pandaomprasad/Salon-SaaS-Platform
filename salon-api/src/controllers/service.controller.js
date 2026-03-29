const Service = require("../models/service.model");
const Branch = require("../models/branch.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const { formatPrice } = require("../utils/priceHelper");

// ================================
// POST /api/v1/branches/:branchId/services
// owner or manager
// ================================
const createService = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { salonId, branchId: userBranchId, role } = req.user;

    // manager scope check
    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(
        new AppError("Access denied. This branch is not assigned to you.", 403),
      );
    }

    const branch = await Branch.findOne({ _id: branchId, salonId });
    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }
    // CHECK DUPLICATE — add this block
    const existing = await Service.findOne({
      branchId,
      name: { $regex: new RegExp(`^${req.body.name}$`, "i") }, // case-insensitive
      isActive: true,
    });
    if (existing) {
      return next(
        new AppError(
          `Service "${req.body.name}" already exists in this branch`,
          400,
        ),
      );
    }

    const service = await Service.create({
      ...req.body,
      branchId,
      salonId,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/branches/:branchId/services
// all authenticated users + public customers
// ================================
const getServices = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { category } = req.query;

    const filter = { branchId, isActive: true };
    if (category) filter.category = category;

    const services = await Service.find(filter).select("-eligibleStaff").lean();
    const servicesWithDisplay = services.map((s) => ({
      ...s,
      priceFormatted: formatPrice(s.price, s.currency),
    }));

    res.status(200).json({
      success: true,
      data: { services: servicesWithDisplay },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/branches/:branchId/services/:serviceId
// ================================
const getService = async (req, res, next) => {
  try {
    const { branchId, serviceId } = req.params;

    const service = await Service.findOne({ _id: serviceId, branchId })
      .populate("eligibleStaff", "name email")
      .lean();

    if (!service) {
      return next(new AppError("Service not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/branches/:branchId/services/:serviceId
// owner or manager
// ================================
const updateService = async (req, res, next) => {
  try {
    const { branchId, serviceId } = req.params;
    const { salonId, branchId: userBranchId, role } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const service = await Service.findOne({
      _id: serviceId,
      branchId,
      salonId,
    });
    if (!service) {
      return next(new AppError("Service not found", 404));
    }

    const allowed = [
      "name",
      "description",
      "category",
      "price",
      "durationMinutes",
      "isActive",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) service[field] = req.body[field];
    });

    await service.save();

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// DELETE /api/v1/branches/:branchId/services/:serviceId
// owner or manager — soft delete
// ================================
const deleteService = async (req, res, next) => {
  try {
    const { branchId, serviceId } = req.params;
    const { salonId, branchId: userBranchId, role } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const service = await Service.findOne({
      _id: serviceId,
      branchId,
      salonId,
    });
    if (!service) {
      return next(new AppError("Service not found", 404));
    }

    service.isActive = false;
    await service.save();

    res.status(200).json({
      success: true,
      message: "Service deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/branches/:branchId/services/:serviceId/staff
// assign eligible staff to a service
// owner or manager
// ================================
const assignStaffToService = async (req, res, next) => {
  try {
    const { branchId, serviceId } = req.params;
    const { staffIds } = req.body; // array of user IDs
    const { salonId } = req.user;

    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return next(new AppError("staffIds must be a non-empty array", 400));
    }

    // verify all staff belong to this branch
    const staff = await User.find({
      _id: { $in: staffIds },
      branchId,
      salonId,
    }).lean();

    if (staff.length !== staffIds.length) {
      return next(
        new AppError("One or more staff members not found in this branch", 400),
      );
    }

    const service = await Service.findOne({
      _id: serviceId,
      branchId,
      salonId,
    });
    if (!service) {
      return next(new AppError("Service not found", 404));
    }

    service.eligibleStaff = staffIds;
    await service.save();

    res.status(200).json({
      success: true,
      message: "Staff assigned to service successfully",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  assignStaffToService,
};
