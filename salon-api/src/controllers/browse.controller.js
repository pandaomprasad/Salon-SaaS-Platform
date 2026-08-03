const Salon = require('../models/salon.model')
const Branch = require('../models/branch.model')
const Service = require('../models/service.model')
const Slot = require('../models/slot.model')
const AppError = require('../utils/AppError')
const dayjs = require('dayjs')

// ================================
// GET /api/v1/browse/salons
// public — no login required
// search by name, city
// ================================
const browseSalons = async (req, res, next) => {
  try {
    const { search, city, page = 1, limit = 10 } = req.query

    const filter = { isActive: true, deactivatedByAdmin: { $ne: true } }

    // search by salon name — case insensitive
    if (search) {
      filter.name = { $regex: new RegExp(search, 'i') }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // if city filter — we need to look inside branches
    // find all branchIds in that city first
    let salonIdsInCity = null
    if (city) {
      const cleanCity = city.split(',')[0].trim()
      const branchesInCity = await Branch.find({
        $or: [
          { 'address.city': { $regex: new RegExp(cleanCity, 'i') } },
          { 'address.state': { $regex: new RegExp(cleanCity, 'i') } }
        ],
        isActive: true
      })
        .select('salonId')
        .lean()

      salonIdsInCity = branchesInCity.map((b) => b.salonId.toString())

      // filter salons to only those with branches in this city
      filter._id = { $in: salonIdsInCity }
    }

    const [salons, total] = await Promise.all([
      Salon.find(filter)
        .populate('owner', 'name')
        .select('name description contactEmail contactPhone logo')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Salon.countDocuments(filter)
    ])

    // attach branch count + basic branch info to each salon
    const salonIds = salons.map((s) => s._id)
    const [branchCounts, branches] = await Promise.all([
      Branch.aggregate([
        { $match: { salonId: { $in: salonIds }, isActive: true } },
        { $group: { _id: '$salonId', count: { $sum: 1 } } }
      ]),
      Branch.find({ salonId: { $in: salonIds }, isActive: true })
        .select('salonId name address.city')
        .lean()
    ])

    const branchCountMap = {}
    branchCounts.forEach((b) => {
      branchCountMap[b._id.toString()] = b.count
    })

    const branchesBySalon = {}
    branches.forEach((b) => {
      const sid = b.salonId.toString()
      if (!branchesBySalon[sid]) branchesBySalon[sid] = []
      branchesBySalon[sid].push(b)
    })

    const salonsWithBranches = salons.map((s) => ({
      ...s,
      branchCount: branchCountMap[s._id.toString()] || 0,
      branches: branchesBySalon[s._id.toString()] || []
    }))

    res.status(200).json({
      success: true,
      data: {
        salons: salonsWithBranches,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/salons/:salonId
// public — single salon details with all branches
// ================================
const getSalonPublic = async (req, res, next) => {
  try {
    const { salonId } = req.params

    const salon = await Salon.findOne({ _id: salonId, isActive: true, deactivatedByAdmin: { $ne: true } })
      .select('name description contactEmail contactPhone logo')
      .lean()

    if (!salon) {
      return next(new AppError('Salon not found', 404))
    }

    // get all active branches for this salon
    const branches = await Branch.find({ salonId, isActive: true, deactivatedByAdmin: { $ne: true } })
      .select('name address contactPhone contactEmail workingHours slotDurationMinutes')
      .lean()

    res.status(200).json({
      success: true,
      data: {
        salon: {
          ...salon,
          branches
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches
// public — browse branches directly
// filter by city, service category, date availability
// ================================
const browseBranches = async (req, res, next) => {
  try {
    const { city, category, date, search, page = 1, limit = 10 } = req.query

    const filter = { isActive: true, deactivatedByAdmin: { $ne: true } }

    // filter by city
    if (city) {
      filter['address.city'] = { $regex: new RegExp(city, 'i') }
    }

    // search branch name
    if (search) {
      filter.name = { $regex: new RegExp(search, 'i') }
    }

    // filter by service category — find branchIds that offer this category
    if (category) {
      const branchesWithCategory = await Service.find({
        category,
        isActive: true
      })
        .select('branchId')
        .lean()

      const branchIds = branchesWithCategory.map((s) => s.branchId.toString())
      filter._id = { $in: branchIds }
    }

    // filter by date availability — only show branches with available slots on this date
    if (date) {
      const branchesWithSlots = await Slot.find({
        date,
        status: 'AVAILABLE'
      })
        .distinct('branchId')

      // intersect with existing filter if category was also set
      if (filter._id) {
        const existing = filter._id.$in.map((id) => id.toString())
        const withSlots = branchesWithSlots.map((id) => id.toString())
        filter._id = { $in: existing.filter((id) => withSlots.includes(id)) }
      } else {
        filter._id = { $in: branchesWithSlots }
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [branches, total] = await Promise.all([
      Branch.find(filter)
        .populate('salonId', 'name logo')
        .populate('managerId', 'name')
        .select('name address contactPhone contactEmail workingHours slotDurationMinutes salonId managerId')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Branch.countDocuments(filter)
    ])

    // attach service summary to each branch
    const branchIds = branches.map((b) => b._id)
    const serviceSummary = await Service.aggregate([
      {
        $match: {
          branchId: { $in: branchIds },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$branchId',
          totalServices: { $sum: 1 },
          categories: { $addToSet: '$category' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ])

    const serviceMap = {}
    serviceSummary.forEach((s) => {
      serviceMap[s._id.toString()] = {
        totalServices: s.totalServices,
        categories: s.categories,
        priceRange: {
          min: `₹${(s.minPrice / 100).toFixed(0)}`,
          max: `₹${(s.maxPrice / 100).toFixed(0)}`
        }
      }
    })

    const branchesWithDetails = branches.map((b) => ({
      ...b,
      services: serviceMap[b._id.toString()] || {
        totalServices: 0,
        categories: [],
        priceRange: null
      }
    }))

    res.status(200).json({
      success: true,
      data: {
        branches: branchesWithDetails,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches/:branchId
// public — single branch details
// ================================
const getBranchPublic = async (req, res, next) => {
  try {
    const { branchId } = req.params

    const branch = await Branch.findOne({ _id: branchId, isActive: true, deactivatedByAdmin: { $ne: true } })
      .populate('salonId', 'name logo description')
      .populate('managerId', 'name')
      .lean()

    if (!branch) {
      return next(new AppError('Branch not found', 404))
    }

    // get all active services for this branch
    const services = await Service.find({ branchId, isActive: true })
      .select('name description category price durationMinutes currency')
      .lean()

    // group services by category
    const servicesByCategory = services.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = []
      acc[service.category].push({
        ...service,
        priceDisplay: `₹${(service.price / 100).toFixed(2)}`
      })
      return acc
    }, {})

    res.status(200).json({
      success: true,
      data: {
        branch: {
          ...branch,
          servicesByCategory
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches/:branchId/slots
// public — available slots for a branch on a date
// customers use this before booking
// ================================
const getBranchSlotsPublic = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const { date, serviceId, staffId } = req.query

    if (!date) {
      return next(new AppError('Date is required. Use ?date=YYYY-MM-DD', 400))
    }

    // don't allow browsing past dates
    if (dayjs(date).isBefore(dayjs().startOf('day'))) {
      return next(new AppError('Cannot browse slots in the past', 400))
    }

    const filter = {
      branchId,
      date
    }

    // if customer selected a specific staff member
    if (staffId) {
      filter.staffId = staffId
    }

    // if serviceId provided — only show staff who can perform this service
    if (serviceId) {
      const service = await Service.findById(serviceId).lean()
      if (!service) {
        return next(new AppError('Service not found', 404))
      }

      // filter slots to only eligible staff for this service
      if (service.eligibleStaff && service.eligibleStaff.length > 0) {
        if (staffId) {
          if (!service.eligibleStaff.map((id) => id.toString()).includes(staffId.toString())) {
            return res.status(200).json({
              success: true,
              data: { date, branchId, availability: [] }
            })
          }
        } else {
          filter.staffId = { $in: service.eligibleStaff }
        }
      }
    }

    const slots = await Slot.find(filter)
      .populate('staffId', 'name')
      .select('staffId date startTime endTime status')
      .sort({ startTime: 1 })
      .lean()

    // group slots by staff for easier display on frontend
    const slotsByStaff = slots.reduce((acc, slot) => {
      const staffName = slot.staffId?.name || 'Unknown'
      const staffId = slot.staffId?._id?.toString()

      if (!acc[staffId]) {
        acc[staffId] = {
          staffId,
          staffName,
          slots: []
        }
      }

      acc[staffId].slots.push({
        slotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status || 'AVAILABLE'
      })

      return acc
    }, {})

    res.status(200).json({
      success: true,
      data: {
        date,
        branchId,
        availability: Object.values(slotsByStaff)
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches/:branchId/services
// public — all services for a branch
// filter by category
// ================================
const getBranchServicesPublic = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const { category } = req.query

    const filter = { branchId, isActive: true }
    if (category) filter.category = category

    const services = await Service.find(filter)
      .select('name description category price durationMinutes currency')
      .lean()

    const servicesWithDisplay = services.map((s) => ({
      ...s,
      priceDisplay: `₹${(s.price / 100).toFixed(2)}`
    }))

    res.status(200).json({
      success: true,
      data: { services: servicesWithDisplay }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches/:branchId/staff
// public — list specialists/staff for a branch
// ================================
const getBranchStaffPublic = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const User = require('../models/user.model')
    const staff = await User.find({ branchId, isActive: { $ne: false } })
      .select('name email phone avatar photoUrl role')
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
// GET /api/v1/browse/branches/:branchId/reviews
// public — list reviews for a branch
// ================================
const getBranchReviewsPublic = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { reviews: [] }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  browseSalons,
  getSalonPublic,
  browseBranches,
  getBranchPublic,
  getBranchSlotsPublic,
  getBranchServicesPublic,
  getBranchStaffPublic,
  getBranchReviewsPublic
}