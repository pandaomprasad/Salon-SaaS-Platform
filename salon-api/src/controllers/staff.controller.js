const User = require("../models/user.model");
const Role = require("../models/role.model");
const Branch = require("../models/branch.model");
const Salon = require("../models/salon.model");
const AppError = require("../utils/AppError");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
// ================================
// POST /api/v1/branches/:branchId/staff
// owner or manager
// ================================
const createStaff = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { name, email, phone, password, role: roleName } = req.body;
    const { role: userRole, salonId, branchId: userBranchId } = req.user;

    // manager can only add staff to their own branch
    if (userRole === "manager" && branchId !== userBranchId.toString()) {
      return next(
        new AppError("Access denied. This branch is not assigned to you.", 403),
      );
    }

    // manager cannot create another manager
    if (userRole === "manager" && roleName === "manager") {
      return next(new AppError("Managers cannot create other managers.", 403));
    }

    // verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    // verify branch belongs to this salon
    if (branch.salonId.toString() !== salonId.toString()) {
      return next(
        new AppError(
          "Access denied. This branch does not belong to your salon.",
          403,
        ),
      );
    }

    // check email not already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError("Email already registered", 400));
    }

    // get role document
    const roleDoc = await Role.findOne({ name: roleName });
    if (!roleDoc) {
      return next(new AppError(`Role "${roleName}" not found`, 404));
    }

    // create the staff/manager user
    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      role: roleDoc._id,
      salonId: branch.salonId, // use branch's actual salonId
      branchId,
      isActive: true,
    });

    // if creating a manager, update branch.managerId
    if (roleName === "manager") {
      await Branch.findByIdAndUpdate(branchId, { managerId: newUser._id });
    }

    res.status(201).json({
      success: true,
      message: `${roleName} created successfully`,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: roleName,
          branchId: newUser.branchId,
          salonId: newUser.salonId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/branches/:branchId/staff
// owner sees all staff, manager sees their branch staff
// ================================
const getStaff = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { role: userRole, salonId, branchId: userBranchId } = req.user;

    // manager can only view their own branch staff
    if (userRole === "manager" && branchId !== userBranchId.toString()) {
      return next(
        new AppError("Access denied. This branch is not assigned to you.", 403),
      );
    }

    // get staff and managers for this branch
    const staffRoles = await Role.find({ name: { $in: ["staff", "manager"] } })
      .select("_id")
      .lean();

    const roleIds = staffRoles.map((r) => r._id);

    const staff = await User.find({
      branchId,
      salonId,
      role: { $in: roleIds },
    })
      .populate("role", "name")
      .select("-password -refreshToken -tokenVersion")
      .lean();

    res.status(200).json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/branches/:branchId/staff/:staffId
// ================================
const getStaffMember = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params;
    const { salonId } = req.user;

    const user = await User.findOne({ _id: staffId, branchId, salonId })
      .populate("role", "name")
      .select("-password -refreshToken -tokenVersion")
      .lean();

    if (!user) {
      return next(new AppError("Staff member not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/branches/:branchId/staff/:staffId
// owner or manager
// ================================
const updateStaff = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params;
    const { role: userRole, salonId, branchId: userBranchId } = req.user;

    if (userRole === "manager" && branchId !== userBranchId.toString()) {
      return next(
        new AppError("Access denied. This branch is not assigned to you.", 403),
      );
    }

    const user = await User.findOne({ _id: staffId, branchId, salonId });
    if (!user) {
      return next(new AppError("Staff member not found", 404));
    }

    const {
      name,
      phone,
      isActive,
      newBranchId, // ← owner can reassign to different branch
      newRole, // ← owner can change role
    } = req.body;

    // track if sensitive fields changed
    // these require token invalidation
    let tokenInvalidated = false;

    // basic fields — safe to update without invalidation
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    // deactivating a user — invalidate their tokens
    if (isActive !== undefined) {
      user.isActive = isActive;
      if (!isActive) {
        user.tokenVersion += 1;
        tokenInvalidated = true;
      }
    }

    // --------------------------------
    // Branch reassignment
    // only owner can reassign
    // --------------------------------
    if (newBranchId && newBranchId !== branchId) {
      if (userRole !== "owner") {
        return next(
          new AppError(
            "Only owners can reassign staff to different branches",
            403,
          ),
        );
      }

      // verify new branch belongs to same salon
      const newBranch = await Branch.findOne({
        _id: newBranchId,
        salonId,
        isActive: true,
      });

      if (!newBranch) {
        return next(new AppError("New branch not found in your salon", 404));
      }

      user.branchId = newBranchId;

      // CRITICAL — invalidate token so old branchId is gone
      user.tokenVersion += 1;
      tokenInvalidated = true;
    }

    // --------------------------------
    // Role change
    // only owner can change roles
    // --------------------------------
    if (newRole) {
      if (userRole !== "owner") {
        return next(new AppError("Only owners can change staff roles", 403));
      }

      const roleDoc = await Role.findOne({ name: newRole });
      if (!roleDoc) {
        return next(new AppError(`Role "${newRole}" not found`, 404));
      }

      // manager cannot be changed to owner
      if (newRole === "owner") {
        return next(new AppError("Cannot assign owner role to staff", 403));
      }

      user.role = roleDoc._id;

      // CRITICAL — invalidate token so old role + permissions are gone
      user.tokenVersion += 1;
      tokenInvalidated = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          isActive: user.isActive,
          branchId: user.branchId,
          role: user.role,
        },
        // tell the client if token was invalidated
        // so frontend can show "please log in again" to that user
        tokenInvalidated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// DELETE /api/v1/branches/:branchId/staff/:staffId
// owner or manager — soft delete
// ================================
const deleteStaff = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params;
    const { salonId, branchId: userBranchId, role: userRole } = req.user;

    if (userRole === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const user = await User.findOne({ _id: staffId, branchId, salonId });
    if (!user) {
      return next(new AppError("Staff member not found", 404));
    }

    // soft delete
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Staff member deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/branches/:branchId/staff/:staffId/permissions
// owner only — grant extra permissions to a specific user
// ================================
const updateStaffPermissions = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params;
    const { extraPermissions, deniedPermissions } = req.body;
    const { role: userRole, salonId } = req.user;

    // only owner can manage permissions
    if (userRole !== "owner") {
      return next(
        new AppError("Only owners can manage staff permissions", 403),
      );
    }

    const user = await User.findOne({ _id: staffId, branchId, salonId });
    if (!user) {
      return next(new AppError("Staff member not found", 404));
    }

    // validate permission format "resource:action"
    const validFormat = /^[a-z]+:[a-z]+$/;
    const allPerms = [
      ...(extraPermissions || []),
      ...(deniedPermissions || []),
    ];

    for (const perm of allPerms) {
      if (!validFormat.test(perm)) {
        return next(
          new AppError(
            `Invalid permission format: "${perm}". Must be "resource:action" e.g. "report:read"`,
            400,
          ),
        );
      }
    }

    // update permissions
    if (extraPermissions !== undefined) {
      user.extraPermissions = extraPermissions;
    }
    if (deniedPermissions !== undefined) {
      user.deniedPermissions = deniedPermissions;
    }

    await user.save();

    // get final permissions to show in response
    const { getUserPermissions } = require("../utils/permissionCache");
    const roleDoc = await Role.findById(user.role).lean();
    const finalPermissions = await getUserPermissions(roleDoc.name, user._id);

    res.status(200).json({
      success: true,
      message: "Staff permissions updated successfully",
      data: {
        userId: user._id,
        name: user.name,
        extraPermissions: user.extraPermissions,
        deniedPermissions: user.deniedPermissions,
        finalPermissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/branches/:branchId/staff/:staffId/permissions
// owner — view a staff member's final permissions
// ================================
const getStaffPermissions = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params;
    const { role: userRole, salonId } = req.user;

    if (userRole !== "owner") {
      return next(new AppError("Only owners can view staff permissions", 403));
    }

    const user = await User.findOne({ _id: staffId, branchId, salonId })
      .populate("role", "name")
      .lean();

    if (!user) {
      return next(new AppError("Staff member not found", 404));
    }

    const {
      getUserPermissions,
      getRolePermissions,
    } = require("../utils/permissionCache");

    const rolePermissions = await getRolePermissions(user.role.name);
    const finalPermissions = await getUserPermissions(user.role.name, user._id);

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        role: user.role.name,
        rolePermissions,
        extraPermissions: user.extraPermissions || [],
        deniedPermissions: user.deniedPermissions || [],
        finalPermissions,
      },
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createStaff,
  getStaff,
  getStaffMember,
  updateStaff,
  deleteStaff,
  updateStaffPermissions,
  getStaffPermissions,
};
