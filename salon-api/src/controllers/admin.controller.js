const User = require('../models/user.model')
const Salon = require('../models/salon.model')
const Branch = require('../models/branch.model')
const Appointment = require('../models/appointment.model')
const Role = require('../models/role.model')
const OwnerRegistrationRequest = require('../models/ownerRegistrationRequest.model')
const AppError = require('../utils/AppError')
const bcrypt = require('bcryptjs')
const { sendOwnerRegistrationApprovedEmail, sendOwnerRegistrationRejectedEmail } = require('../services/email.service')

// ================================
// GET /api/v1/admin/stats
// Platform-level overview
// ================================
const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalSalons,
      activeSalons,
      totalBranches,
      totalOwners,
      totalStaff,
      totalCustomers,
      totalAppointments,
      completedAppointments
    ] = await Promise.all([
      Salon.countDocuments({}),
      Salon.countDocuments({ isActive: true }),
      Branch.countDocuments({ isActive: true }),
      User.countDocuments({}).populate('role').then(async () => {
        const ownerRole = await Role.findOne({ name: 'owner' })
        return User.countDocuments({ role: ownerRole?._id, isActive: true })
      }),
      User.countDocuments({}).then(async () => {
        const staffRole = await Role.findOne({ name: 'staff' })
        const managerRole = await Role.findOne({ name: 'manager' })
        return User.countDocuments({
          role: { $in: [staffRole?._id, managerRole?._id] },
          isActive: true
        })
      }),
      User.countDocuments({}).then(async () => {
        const customerRole = await Role.findOne({ name: 'customer' })
        return User.countDocuments({ role: customerRole?._id, isActive: true })
      }),
      Appointment.countDocuments({}),
      Appointment.countDocuments({ status: 'COMPLETED' })
    ])

    res.status(200).json({
      success: true,
      data: {
        salons: { total: totalSalons, active: activeSalons },
        branches: { total: totalBranches },
        owners: { total: totalOwners },
        staff: { total: totalStaff },
        customers: { total: totalCustomers },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/admin/salons
// ================================
const getAllSalons = async (req, res, next) => {
  try {
    const salons = await Salon.find({})
      .select('+deactivatedByAdmin +adminDeactivationReason +adminDeactivatedAt')
      .populate('owner', 'name email phone')
      .lean()

    // Get branch count for each salon
    const salonsWithBranches = await Promise.all(
      salons.map(async (salon) => {
        const branchCount = await Branch.countDocuments({ salonId: salon._id, isActive: true })
        const staffCount = await User.countDocuments({ salonId: salon._id, isActive: true }) - 1 // exclude owner
        return { ...salon, branchCount, staffCount }
      })
    )

    res.status(200).json({
      success: true,
      data: { salons: salonsWithBranches }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// POST /api/v1/admin/salons
// Create salon + owner in one step
// ================================
const createSalon = async (req, res, next) => {
  try {
    const { salonName, description, ownerName, ownerEmail, ownerPhone, ownerPassword } = req.body

    if (!salonName || !ownerName || !ownerEmail || !ownerPassword) {
      return next(new AppError('Salon name, owner name, email, and password are required', 400))
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() })
    if (existingUser) {
      return next(new AppError('Email already in use', 400))
    }

    const ownerRole = await Role.findOne({ name: 'owner' })
    if (!ownerRole) return next(new AppError('Owner role not found', 500))

    // Create owner
    const owner = await User.create({
      name: ownerName,
      email: ownerEmail.toLowerCase(),
      phone: ownerPhone || '',
      password: ownerPassword,
      role: ownerRole._id,
      isActive: true
    })

    // Create salon
    const salon = await Salon.create({
      name: salonName,
      owner: owner._id,
      description: description || '',
      contactEmail: ownerEmail.toLowerCase(),
      contactPhone: ownerPhone || ''
    })

    // Link owner to salon
    await User.findByIdAndUpdate(owner._id, { salonId: salon._id })

    res.status(201).json({
      success: true,
      message: 'Salon and owner created successfully',
      data: { salon, owner: { _id: owner._id, name: owner.name, email: owner.email } }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/admin/salons/:salonId
// ================================
const getSalon = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.salonId)
      .populate('owner', 'name email phone')
      .lean()

    if (!salon) return next(new AppError('Salon not found', 404))

    const branches = await Branch.find({ salonId: salon._id })
      .populate('managerId', 'name email')
      .lean()

    res.status(200).json({
      success: true,
      data: { salon, branches }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/admin/salons/:salonId
// ================================
const updateSalon = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.salonId)
    if (!salon) return next(new AppError('Salon not found', 404))

    const allowed = ['name', 'description', 'contactEmail', 'contactPhone', 'isActive']
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) salon[field] = req.body[field]
    })

    // If reactivating, clear admin deactivation flags
    if (req.body.isActive === true && salon.deactivatedByAdmin) {
      salon.deactivatedByAdmin = false
      salon.adminDeactivationReason = null
      salon.adminDeactivatedAt = null

      // Also reactivate branches that were deactivated by admin
      await Branch.updateMany(
        { salonId: salon._id, deactivatedByAdmin: true },
        {
          isActive: true,
          deactivatedByAdmin: false,
          adminDeactivationReason: null,
          adminDeactivatedAt: null
        }
      )
    }

    await salon.save()

    res.status(200).json({
      success: true,
      message: 'Salon updated successfully',
      data: { salon }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// DELETE /api/v1/admin/salons/:salonId
// ================================
const deleteSalon = async (req, res, next) => {
  try {
    const { reason } = req.body
    const salon = await Salon.findById(req.params.salonId)
    if (!salon) return next(new AppError('Salon not found', 404))

    salon.isActive = false
    salon.deactivatedByAdmin = true
    salon.adminDeactivationReason = reason || 'Deactivated by platform admin'
    salon.adminDeactivatedAt = new Date()
    await salon.save()

    // Deactivate all branches too
    await Branch.updateMany(
      { salonId: salon._id },
      {
        isActive: false,
        deactivatedByAdmin: true,
        adminDeactivationReason: reason || 'Parent salon deactivated by admin',
        adminDeactivatedAt: new Date()
      }
    )

    res.status(200).json({
      success: true,
      message: 'Salon deactivated by admin'
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/admin/owners
// ================================
const getAllOwners = async (req, res, next) => {
  try {
    const ownerRole = await Role.findOne({ name: 'owner' })
    const owners = await User.find({ role: ownerRole._id })
      .select('name email phone salonId isActive createdAt')
      .populate('salonId', 'name isActive')
      .lean()

    res.status(200).json({
      success: true,
      data: { owners }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// POST /api/v1/admin/owners
// ================================
const createOwner = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body

    if (!name || !email || !password) {
      return next(new AppError('Name, email, and password are required', 400))
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return next(new AppError('Email already in use', 400))

    const ownerRole = await Role.findOne({ name: 'owner' })
    if (!ownerRole) return next(new AppError('Owner role not found', 500))

    const owner = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password,
      role: ownerRole._id,
      isActive: true
    })

    res.status(201).json({
      success: true,
      message: 'Owner created successfully',
      data: { owner: { _id: owner._id, name: owner.name, email: owner.email } }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/admin/owners/:ownerId
// ================================
const updateOwner = async (req, res, next) => {
  try {
    const owner = await User.findById(req.params.ownerId)
    if (!owner) return next(new AppError('Owner not found', 404))

    const allowed = ['name', 'phone', 'isActive']
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) owner[field] = req.body[field]
    })

    await owner.save()

    res.status(200).json({
      success: true,
      message: 'Owner updated successfully',
      data: { owner }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// DELETE /api/v1/admin/owners/:ownerId
// ================================
const deactivateOwner = async (req, res, next) => {
  try {
    const owner = await User.findById(req.params.ownerId)
    if (!owner) return next(new AppError('Owner not found', 404))

    owner.isActive = false
    await owner.save()

    // Also deactivate their salon
    if (owner.salonId) {
      await Salon.findByIdAndUpdate(owner.salonId, { isActive: false })
    }

    res.status(200).json({
      success: true,
      message: 'Owner and associated salon deactivated'
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/admin/customers
// Limited view — name, email, phone, join date only
// ================================
const getAllCustomers = async (req, res, next) => {
  try {
    const customerRole = await Role.findOne({ name: 'customer' })
    const customers = await User.find({ role: customerRole._id })
      .select('name email phone isActive createdAt')
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      data: { customers }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/admin/growth
// Monthly growth stats for the platform
// ================================
const getGrowthStats = async (req, res, next) => {
  try {
    const months = 6
    const stats = []

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date()
      start.setMonth(start.getMonth() - i, 1)
      start.setHours(0, 0, 0, 0)

      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)

      const [newSalons, newCustomers, newAppointments] = await Promise.all([
        Salon.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        User.countDocuments({}).then(async () => {
          const customerRole = await Role.findOne({ name: 'customer' })
          return User.countDocuments({
            role: customerRole?._id,
            createdAt: { $gte: start, $lt: end }
          })
        }),
        Appointment.countDocuments({ createdAt: { $gte: start, $lt: end } })
      ])

      stats.push({
        month: start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        newSalons,
        newCustomers,
        newAppointments
      })
    }

    res.status(200).json({
      success: true,
      data: { growth: stats }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/admin/salons/:salonId/staff
// Get all staff across all branches of a salon
// ================================
const getSalonStaff = async (req, res, next) => {
  try {
    const { salonId } = req.params
    const staff = await User.find({ salonId })
      .select('name email phone role branchId isActive createdAt')
      .populate('role', 'name')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 })
      .lean()

    // Filter out the owner
    const filtered = staff.filter(s => s.role?.name !== 'owner')

    res.status(200).json({
      success: true,
      data: { staff: filtered }
    })
  } catch (error) {
    next(error)
  }
}
// ================================
// GET /api/v1/admin/activity
// Recent activity across the platform
// ================================
const getActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30

    // Recent appointments (as activity)
    const recentAppointments = await Appointment.find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('status date startTime pricePaid updatedAt createdAt')
      .populate('customerId', 'name')
      .populate('staffId', 'name')
      .populate('serviceId', 'name')
      .populate('branchId', 'name')
      .lean()

    // Recent users
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt')
      .populate('role', 'name')
      .lean()

    // Recent salons
    const recentSalons = await Salon.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt')
      .lean()

    // Build activity feed
    const activities = []

    recentAppointments.forEach(a => {
      activities.push({
        type: 'appointment',
        action: a.status,
        description: `${a.customerId?.name || 'Customer'} — ${a.serviceId?.name || 'Service'} at ${a.branchId?.name || 'Branch'}`,
        detail: `${a.date} ${a.startTime}`,
        timestamp: a.updatedAt || a.createdAt,
      })
    })

    recentUsers.forEach(u => {
      activities.push({
        type: 'user',
        action: 'REGISTERED',
        description: `${u.name} joined as ${u.role?.name || 'user'}`,
        detail: u.email,
        timestamp: u.createdAt,
      })
    })

    recentSalons.forEach(s => {
      activities.push({
        type: 'salon',
        action: 'CREATED',
        description: `Salon "${s.name}" was created`,
        detail: '',
        timestamp: s.createdAt,
      })
    })

    // Sort by timestamp desc
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    res.status(200).json({
      success: true,
      data: { activities: activities.slice(0, limit) }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/salon-status/:salonId
// Public — salon panel checks if deactivated by admin
// ================================
const getSalonStatus = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.salonId)
      .select('isActive deactivatedByAdmin adminDeactivationReason adminDeactivatedAt name')
      .lean()

    if (!salon) return next(new AppError('Salon not found', 404))

    res.status(200).json({
      success: true,
      data: {
        isActive: salon.isActive,
        deactivatedByAdmin: salon.deactivatedByAdmin || false,
        reason: salon.adminDeactivationReason || null,
        deactivatedAt: salon.adminDeactivatedAt || null,
        salonName: salon.name
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/admin/salons/:salonId/branches/:branchId
// Admin can deactivate/reactivate individual branches
// ================================
const updateBranch = async (req, res, next) => {
  try {
    const { salonId, branchId } = req.params
    const branch = await Branch.findOne({ _id: branchId, salonId })
    if (!branch) return next(new AppError('Branch not found', 404))

    const allowed = ['isActive', 'deactivatedByAdmin', 'adminDeactivationReason', 'adminDeactivatedAt']
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) branch[field] = req.body[field]
    })

    // Clear admin flags when reactivating
    if (req.body.isActive === true) {
      branch.deactivatedByAdmin = false
      branch.adminDeactivationReason = null
      branch.adminDeactivatedAt = null
    }

    await branch.save()

    res.status(200).json({
      success: true,
      message: `Branch ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { branch }
    })
  } catch (error) {
    next(error)
  }
}
// ================================
// GET /api/v1/admin/owner-requests
// Registration requests submitted from the public landing page
// ================================
const listOwnerRequests = async (req, res, next) => {
  try {
    const status = (req.query.status || 'ALL').toUpperCase()
    const filter = status === 'ALL' ? {} : { status }

    const requests = await OwnerRegistrationRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      data: { requests },
      count: requests.length,
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// POST /api/v1/admin/owner-requests/:requestId/approve
// Approve a pending request → creates the owner user + salon
// ================================
const approveOwnerRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params
    const request = await OwnerRegistrationRequest.findById(requestId).select('+password')

    if (!request) return next(new AppError('Request not found', 404))
    if (request.status !== 'PENDING') {
      return next(new AppError(`Request is already ${request.status.toLowerCase()}`, 400))
    }

    // guards against duplicates by the time of review
    const existingUser = await User.findOne({ email: request.ownerEmail })
    if (existingUser) {
      request.status = 'REJECTED'
      request.adminNote = 'Email already in use'
      request.reviewedBy = req.user.userId
      request.reviewedAt = new Date()
      await request.save()
      return next(new AppError('Email already in use — request auto-rejected', 400))
    }

    const ownerRole = await Role.findOne({ name: 'owner' })
    if (!ownerRole) return next(new AppError('Owner role not found. Please run seeder.', 500))

    // create the owner — user.create() WITHOUT the password first, because the
    // request.password is ALREADY hashed (hashed at request time). Passing it to
    // User.create would go through the pre-save hook and double-hash it.
    const owner = await User.create({
      name: request.ownerName,
      email: request.ownerEmail,
      phone: request.ownerPhone || '',
      role: ownerRole._id,
      isActive: true,
    })

    // store the already-hashed password directly.
    // findByIdAndUpdate is a query — it bypasses document pre-save hooks,
    // so the stored hash stays the one the owner's plaintext compares against.
    await User.findByIdAndUpdate(owner._id, { password: request.password })

    // create + link their salon
    const salon = await Salon.create({
      name: request.salonName,
      owner: owner._id,
      description: request.salonDescription || '',
      contactEmail: request.ownerEmail,
      contactPhone: request.ownerPhone || '',
    })

    await User.findByIdAndUpdate(owner._id, { salonId: salon._id })

    request.status = 'APPROVED'
    request.reviewedBy = req.user.userId
    request.reviewedAt = new Date()
    request.adminNote = req.body.note || null
    await request.save()

    // Send approval email to owner
    sendOwnerRegistrationApprovedEmail({
      to: request.ownerEmail,
      ownerName: request.ownerName,
      salonName: request.salonName,
    }).catch((err) => console.error('Error sending owner approval email:', err))

    res.status(200).json({
      success: true,
      message: 'Request approved. Owner account and salon created.',
      data: {
        request: { _id: request._id, status: request.status, reviewedAt: request.reviewedAt },
        salon: { _id: salon._id, name: salon.name },
        owner: { _id: owner._id, name: owner.name, email: owner.email },
      },
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// POST /api/v1/admin/owner-requests/:requestId/reject
// ================================
const rejectOwnerRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params
    const request = await OwnerRegistrationRequest.findById(requestId)

    if (!request) return next(new AppError('Request not found', 404))
    if (request.status !== 'PENDING') {
      return next(new AppError(`Request is already ${request.status.toLowerCase()}`, 400))
    }

    request.status = 'REJECTED'
    request.adminNote = req.body.note || null
    request.reviewedBy = req.user.userId
    request.reviewedAt = new Date()
    await request.save()

    // Send rejection email to owner
    sendOwnerRegistrationRejectedEmail({
      to: request.ownerEmail,
      ownerName: request.ownerName,
      salonName: request.salonName,
      note: request.adminNote,
    }).catch((err) => console.error('Error sending owner rejection email:', err))

    res.status(200).json({
      success: true,
      message: 'Request rejected',
      data: { request: { _id: request._id, status: request.status, reviewedAt: request.reviewedAt } },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getPlatformStats,
  getAllSalons,
  createSalon,
  getSalon,
  updateSalon,
  deleteSalon,
  getAllOwners,
  createOwner,
  updateOwner,
  deactivateOwner,
  getAllCustomers,
  getGrowthStats,
  getSalonStaff,
  getActivity,
  getSalonStatus,
  adminUpdateBranch: updateBranch,
  listOwnerRequests,
  approveOwnerRequest,
  rejectOwnerRequest,
}