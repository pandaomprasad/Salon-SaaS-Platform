const User = require('../models/user.model')
const Role = require('../models/role.model')
const Branch = require('../models/branch.model')
const Salon = require('../models/salon.model')
const AppError = require('../utils/AppError')
const bcrypt = require('bcryptjs')

// ================================
// POST /api/v1/branches/:branchId/staff
// owner or manager
// ================================
const createStaff = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const { name, email, phone, password, role: roleName } = req.body
    const { role: userRole, salonId, branchId: userBranchId } = req.user

    // manager can only add staff to their own branch
    if (userRole === 'manager' && branchId !== userBranchId.toString()) {
      return next(new AppError('Access denied. This branch is not assigned to you.', 403))
    }

    // manager cannot create another manager
    if (userRole === 'manager' && roleName === 'manager') {
      return next(new AppError('Managers cannot create other managers.', 403))
    }

    // verify branch exists and belongs to this salon
    const branch = await Branch.findOne({ _id: branchId, salonId })
    if (!branch) {
      return next(new AppError('Branch not found', 404))
    }

    // check email not already taken
    const existing = await User.findOne({ email })
    if (existing) {
      return next(new AppError('Email already registered', 400))
    }

    // get role document
    const roleDoc = await Role.findOne({ name: roleName })
    if (!roleDoc) {
      return next(new AppError(`Role "${roleName}" not found`, 404))
    }

    // create the staff/manager user
    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      role: roleDoc._id,
      salonId,
      branchId,
      isActive: true
    })

    // if creating a manager, update branch.managerId
    if (roleName === 'manager') {
      await Branch.findByIdAndUpdate(branchId, { managerId: newUser._id })
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
          salonId: newUser.salonId
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/branches/:branchId/staff
// owner sees all staff, manager sees their branch staff
// ================================
const getStaff = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const { role: userRole, salonId, branchId: userBranchId } = req.user

    // manager can only view their own branch staff
    if (userRole === 'manager' && branchId !== userBranchId.toString()) {
      return next(new AppError('Access denied. This branch is not assigned to you.', 403))
    }

    // get staff and managers for this branch
    const staffRoles = await Role.find({ name: { $in: ['staff', 'manager'] } })
      .select('_id')
      .lean()

    const roleIds = staffRoles.map((r) => r._id)

    const staff = await User.find({
      branchId,
      salonId,
      role: { $in: roleIds }
    })
      .populate('role', 'name')
      .select('-password -refreshToken -tokenVersion')
      .lean()

    res.status(200).json({
      success: true,
      data: { staff }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/branches/:branchId/staff/:staffId
// ================================
const getStaffMember = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params
    const { salonId } = req.user

    const user = await User.findOne({ _id: staffId, branchId, salonId })
      .populate('role', 'name')
      .select('-password -refreshToken -tokenVersion')
      .lean()

    if (!user) {
      return next(new AppError('Staff member not found', 404))
    }

    res.status(200).json({
      success: true,
      data: { user }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/branches/:branchId/staff/:staffId
// owner or manager
// ================================
const updateStaff = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params
    const { role: userRole, salonId, branchId: userBranchId } = req.user

    // manager can only update staff in their branch
    if (userRole === 'manager' && branchId !== userBranchId.toString()) {
      return next(new AppError('Access denied. This branch is not assigned to you.', 403))
    }

    const user = await User.findOne({ _id: staffId, branchId, salonId })
    if (!user) {
      return next(new AppError('Staff member not found', 404))
    }

    const allowed = ['name', 'phone', 'isActive']
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field]
    })

    await user.save()

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          isActive: user.isActive
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// DELETE /api/v1/branches/:branchId/staff/:staffId
// owner or manager — soft delete
// ================================
const deleteStaff = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params
    const { salonId, branchId: userBranchId, role: userRole } = req.user

    if (userRole === 'manager' && branchId !== userBranchId.toString()) {
      return next(new AppError('Access denied.', 403))
    }

    const user = await User.findOne({ _id: staffId, branchId, salonId })
    if (!user) {
      return next(new AppError('Staff member not found', 404))
    }

    // soft delete
    user.isActive = false
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Staff member deactivated successfully'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { createStaff, getStaff, getStaffMember, updateStaff, deleteStaff }