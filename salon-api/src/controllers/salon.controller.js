const Salon = require('../models/salon.model')
const User = require('../models/user.model')
const AppError = require('../utils/AppError')
const { invalidateCatalogCache } = require('../services/cache.service')

// ================================
// POST /api/v1/salons
// owner only
// ================================
const createSalon = async (req, res, next) => {
  try {
    const { name, description, contactEmail, contactPhone } = req.body
    const { userId } = req.user

    // one owner can have multiple salons — no restriction here
    const salon = await Salon.create({
      name,
      description,
      contactEmail,
      contactPhone,
      owner: userId
    })

    // attach salonId to owner if they don't have one yet
    const owner = await User.findById(userId)
    if (!owner.salonId) {
      await User.findByIdAndUpdate(userId, { salonId: salon._id })
    }

    await invalidateCatalogCache({ salonId: salon._id.toString() })

    res.status(201).json({
      success: true,
      message: 'Salon created successfully',
      data: { salon }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/salons
// owner sees their own salons
// ================================
const parsePagination = require('../utils/pagination')

const getMySalons = async (req, res, next) => {
  try {
    const { userId, role } = req.user
    const { page, limit, skip } = parsePagination(req.query, 20, 100)

    const filter = role === 'owner'
      ? { owner: userId }
      : { _id: req.user.salonId }

    const [salons, total] = await Promise.all([
      Salon.find(filter)
        .populate('owner', 'name email')
        .skip(skip)
        .limit(limit)
        .lean(),
      Salon.countDocuments(filter)
    ])

    res.status(200).json({
      success: true,
      data: {
        salons,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/salons/:salonId
// ================================
const getSalon = async (req, res, next) => {
  try {
    const { salonId } = req.params
    const { userId, role } = req.user

    const salon = await Salon.findById(salonId)
      .populate('owner', 'name email')
      .populate('branches')
      .lean()

    if (!salon) {
      return next(new AppError('Salon not found', 404))
    }

    // scope check — owner can only see their own salons
    if (role === 'owner' && salon.owner._id.toString() !== userId.toString()) {
      return next(new AppError('Access denied', 403))
    }

    res.status(200).json({
      success: true,
      data: { salon }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/salons/:salonId
// owner only
// ================================
const updateSalon = async (req, res, next) => {
  try {
    const { salonId } = req.params
    const { userId } = req.user
    const updates = req.body

    const salon = await Salon.findById(salonId)
    if (!salon) {
      return next(new AppError('Salon not found', 404))
    }

    // only the owner of THIS salon can update it
    if (salon.owner.toString() !== userId.toString()) {
      return next(new AppError('Access denied. You do not own this salon.', 403))
    }

    // only allow safe fields to be updated
    const allowed = ['name', 'description', 'contactEmail', 'contactPhone', 'logo']
    allowed.forEach((field) => {
      if (updates[field] !== undefined) salon[field] = updates[field]
    })

    await salon.save()

    await invalidateCatalogCache({ salonId: salonId.toString() })

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
// DELETE /api/v1/salons/:salonId
// owner only — soft delete
// ================================
const deleteSalon = async (req, res, next) => {
  try {
    const { salonId } = req.params
    const { userId } = req.user

    const salon = await Salon.findById(salonId)
    if (!salon) {
      return next(new AppError('Salon not found', 404))
    }

    if (salon.owner.toString() !== userId.toString()) {
      return next(new AppError('Access denied. You do not own this salon.', 403))
    }

    // soft delete — just deactivate, never hard delete
    salon.isActive = false
    await salon.save()

    await invalidateCatalogCache({ salonId: salonId.toString() })

    res.status(200).json({
      success: true,
      message: 'Salon deactivated successfully'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { createSalon, getMySalons, getSalon, updateSalon, deleteSalon }