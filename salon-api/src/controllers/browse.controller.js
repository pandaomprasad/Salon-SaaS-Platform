const mongoose = require('mongoose')
const Salon = require('../models/salon.model')
const Branch = require('../models/branch.model')
const Service = require('../models/service.model')
const Slot = require('../models/slot.model')
const Appointment = require('../models/appointment.model')
const User = require('../models/user.model')
const AppError = require('../utils/AppError')
const dayjs = require('dayjs')
const { getCache, setCache, delCache, delCachePattern } = require('../services/cache.service')
const { isBranchOpen } = require('../utils/salonStatus')

// ================================
// GET /api/v1/browse/initial-load
// public — consolidated initial dataset for fast startup
// Loads Salons, Locations, Services (with images & pricing), Specialists/Staff, and Available Slots
// ================================
const getInitialLoad = async (req, res, next) => {
  try {
    const { city, date = dayjs().format('YYYY-MM-DD') } = req.query
    const cleanCity = city ? city.split(',')[0].trim().toLowerCase() : null
    const cacheKey = `initial_load:${cleanCity || 'all'}:${date}`

    const cachedData = await getCache(cacheKey)
    if (cachedData) {
      return res.status(200).json({
        success: true,
        cached: true,
        data: cachedData
      })
    }

    // 1. Fetch Salons
    const salonFilter = { isActive: true, deactivatedByAdmin: { $ne: true } }
    const salons = await Salon.find(salonFilter)
      .populate('owner', 'name')
      .select('name description contactEmail contactPhone logo banner coverImage images')
      .lean()

    const salonIds = salons.map((s) => s._id)

    // 2. Fetch Locations / Branches
    const branchFilter = { salonId: { $in: salonIds }, isActive: true, deactivatedByAdmin: { $ne: true } }
    if (cleanCity) {
      // exact match on lowercase slug — can use the citySlug index
      branchFilter.citySlug = cleanCity
    }

    const branches = await Branch.find(branchFilter)
      .populate('salonId', 'name logo')
      .select('salonId name address contactPhone contactEmail workingHours slotDurationMinutes managerId images')
      .lean()

    const branchIds = branches.map((b) => b._id)

    // 3-5. Fetch services, staff and slots in parallel
    const [services, staffMembers, availableSlots] = await Promise.all([
      Service.find({ branchId: { $in: branchIds }, isActive: true })
        .select('branchId name description category price durationMinutes currency eligibleStaff image imageUrl photoUrl includedServices packageOfferTag')
        .lean(),

      User.find({ branchId: { $in: branchIds }, isActive: { $ne: false } })
        .select('branchId name email phone avatar photoUrl role bio title rating')
        .lean(),

      Slot.find({
        branchId: { $in: branchIds },
        date,
        status: 'AVAILABLE'
      })
        .populate('staffId', 'name avatar photoUrl')
        .select('branchId staffId date startTime endTime status')
        .sort({ startTime: 1 })
        .lean()
    ])

    const servicesWithDisplay = services.map((s) => ({
      ...s,
      priceDisplay: `₹${(s.price / 100).toFixed(0)}`
    }))

    // Group slots by staff/specialist
    const slotsBySpecialist = availableSlots.reduce((acc, slot) => {
      const staffId = slot.staffId?._id?.toString() || 'unassigned'
      const staffName = slot.staffId?.name || 'Specialist'
      if (!acc[staffId]) {
        acc[staffId] = {
          staffId,
          staffName,
          slots: []
        }
      }
      acc[staffId].slots.push({
        slotId: slot._id,
        branchId: slot.branchId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status
      })
      return acc
    }, {})

    // Combine branches with their salons, services, and staff
    // Calculate lowest service price for each branch and salon
    const minPriceByBranch = {}
    const minPriceBySalon = {}

    services.forEach((s) => {
      if (typeof s.price === 'number' && s.price > 0 && s.branchId) {
        const bId = s.branchId.toString()
        if (!minPriceByBranch[bId] || s.price < minPriceByBranch[bId]) {
          minPriceByBranch[bId] = s.price
        }
      }
    })

    branches.forEach((b) => {
      const bId = b._id.toString()
      const sId = b.salonId ? (b.salonId._id || b.salonId).toString() : null
      const bMin = minPriceByBranch[bId]
      if (sId && bMin) {
        if (!minPriceBySalon[sId] || bMin < minPriceBySalon[sId]) {
          minPriceBySalon[sId] = bMin
        }
      }
    })

    const salonsWithDetails = salons.map((s) => {
      const sid = s._id.toString()
      const minPaise = minPriceBySalon[sid]
      const startingPrice = minPaise ? Math.round(minPaise / 100) : null
      return {
        ...s,
        branches: branchesBySalon[sid] || [],
        minServicePrice: startingPrice,
        startingPrice: startingPrice
      }
    })

    const responseData = {
      salons: salonsWithDetails,
      branches,
      services: servicesWithDisplay,
      staff: staffMembers,
      slotsBySpecialist: Object.values(slotsBySpecialist),
      fetchedAt: new Date().toISOString()
    }

    // Save to Redis cache for 5 minutes (300s)
    await setCache(cacheKey, responseData, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: responseData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/salons
// public — search by name, city
// ================================
const browseSalons = async (req, res, next) => {
  try {
    const { search, city, category, page = 1, limit = 10 } = req.query
    const cacheCity = city ? city.split(',')[0].trim().toLowerCase() : null
    const cacheKey = `salons:list:${search || 'all'}:${cacheCity || 'all'}:${category || 'all'}:${page}:${limit}`

    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const filter = { isActive: true, deactivatedByAdmin: { $ne: true } }

    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.name = { $regex: new RegExp(sanitized, 'i') }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    let salonIdsInCity = null
    let catSalonIds = null

    const cityPromise = cacheCity
      ? Branch.find({ citySlug: cacheCity, isActive: true }).select('salonId').lean()
      : Promise.resolve(null)

    const categoryPromise = (category && category.toLowerCase() !== 'all')
      ? (async () => {
          const sanitizedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const catServices = await Service.find({
            category: { $regex: new RegExp(`^${sanitizedCategory}$`, 'i') },
            isActive: true
          }).select('branchId').lean()

          const branchIds = catServices.map((s) => s.branchId.toString())
          if (branchIds.length === 0) return []

          const catBranches = await Branch.find({
            _id: { $in: branchIds },
            isActive: true
          }).select('salonId').lean()

          return [...new Set(catBranches.map((b) => b.salonId.toString()))]
        })()
      : Promise.resolve(null)

    const [cityBranches, categorySalonIds] = await Promise.all([cityPromise, categoryPromise])

    if (cityBranches) {
      salonIdsInCity = cityBranches.map((b) => b.salonId.toString())
      filter._id = { $in: salonIdsInCity }
    }

    if (categorySalonIds) {
      catSalonIds = categorySalonIds
      if (salonIdsInCity) {
        catSalonIds = catSalonIds.filter((id) => salonIdsInCity.includes(id))
      }

      if (catSalonIds.length === 0) {
        return res.status(200).json({
          success: true,
          cached: false,
          data: { salons: [], total: 0, page: parseInt(page), totalPages: 0, hasMore: false }
        })
      }
      filter._id = { $in: catSalonIds }
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

    const salonIds = salons.map((s) => s._id)

    const branchFilter = { salonId: { $in: salonIds }, isActive: true }
    if (cacheCity) {
      branchFilter.citySlug = cacheCity
    }

    const [branchCounts, branches] = await Promise.all([
      Branch.aggregate([
        { $match: branchFilter },
        { $group: { _id: '$salonId', count: { $sum: 1 } } }
      ]),
      Branch.find(branchFilter)
        .select('salonId name address.city address.street address.coordinates')
        .lean()
    ])

    const branchIds = branches.map((branch) => branch._id)
    const lowestServicePrices = branchIds.length
      ? await Service.aggregate([
          { $match: { branchId: { $in: branchIds }, isActive: true } },
          { $group: { _id: '$branchId', minPrice: { $min: '$price' } } }
        ])
      : []

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

    const branchToSalonMap = Object.fromEntries(branches.map((branch) => [branch._id.toString(), branch.salonId.toString()]))
    const minPriceBySalon = {}
    lowestServicePrices.forEach(({ _id, minPrice }) => {
      const salonId = branchToSalonMap[_id.toString()]
      if (salonId && (minPriceBySalon[salonId] === undefined || minPrice < minPriceBySalon[salonId])) {
        minPriceBySalon[salonId] = minPrice
      }
    })

    const salonsWithBranches = salons.map((s) => {
      const sid = s._id.toString()
      const minPaise = minPriceBySalon[sid]
      const startingPrice = minPaise ? Math.round(minPaise / 100) : null
      return {
        ...s,
        branchCount: branchCountMap[sid] || 0,
        branches: branchesBySalon[sid] || [],
        minServicePrice: startingPrice,
        startingPrice: startingPrice
      }
    })

    const resultData = {
      salons: salonsWithBranches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }

    await setCache(cacheKey, resultData, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: resultData
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
    const cacheKey = `salon:detail:${salonId}`

    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const salon = await Salon.findOne({ _id: salonId, isActive: true, deactivatedByAdmin: { $ne: true } })
      .select('name description contactEmail contactPhone logo')
      .lean()

    if (!salon) {
      return next(new AppError('Salon not found', 404))
    }

    const branches = await Branch.find({ salonId, isActive: true, deactivatedByAdmin: { $ne: true } })
      .select('name address contactPhone contactEmail workingHours slotDurationMinutes')
      .lean()

    const resultData = {
      salon: {
        ...salon,
        branches
      }
    }

    await setCache(cacheKey, resultData, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: resultData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches
// public — browse branches directly
// ================================
const browseBranches = async (req, res, next) => {
  try {
    const { city, category, date, search, page = 1, limit = 10 } = req.query
    const cacheCity = city ? city.split(',')[0].trim().toLowerCase() : null
    const cacheKey = `branches:list:${cacheCity || 'all'}:${category || 'all'}:${date || 'all'}:${search || 'all'}:${page}:${limit}`

    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const filter = { isActive: true, deactivatedByAdmin: { $ne: true } }

    if (cacheCity) {
      filter.citySlug = cacheCity
    }

    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.name = { $regex: new RegExp(sanitized, 'i') }
    }

    const categoryPromise = category
      ? Service.find({ category, isActive: true }).select('branchId').lean()
      : Promise.resolve([])

    const datePromise = date
      ? Slot.find({ date, status: 'AVAILABLE' }).distinct('branchId')
      : Promise.resolve([])

    const [catServices, branchesWithSlots] = await Promise.all([categoryPromise, datePromise])

    if (catServices.length > 0) {
      const branchIds = catServices.map((s) => s.branchId.toString())
      filter._id = filter._id ? { $in: filter._id.$in.filter((id) => branchIds.includes(id.toString())) } : { $in: branchIds }
    }

    if (branchesWithSlots.length > 0) {
      const withSlots = branchesWithSlots.map((id) => id.toString())
      filter._id = filter._id
        ? { $in: filter._id.$in.filter((id) => withSlots.includes(id.toString())) }
        : { $in: withSlots }
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

    const resultData = {
      branches: branchesWithDetails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }

    await setCache(cacheKey, resultData, 180)

    res.status(200).json({
      success: true,
      cached: false,
      data: resultData
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
    const cacheKey = `branch:detail:${branchId}`

    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const branch = await Branch.findOne({ _id: branchId, isActive: true, deactivatedByAdmin: { $ne: true } })
      .populate('salonId', 'name logo description')
      .populate('managerId', 'name')
      .lean()

    if (!branch) {
      return next(new AppError('Branch not found', 404))
    }

    const isOpen = isBranchOpen(branch)

    const services = await Service.find({ branchId, isActive: true })
      .select('name description category price durationMinutes currency image imageUrl photoUrl includedServices packageOfferTag')
      .lean()

    const servicesByCategory = services.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = []
      acc[service.category].push({
        ...service,
        priceDisplay: `₹${(service.price / 100).toFixed(2)}`
      })
      return acc
    }, {})

    const resultData = {
      branch: {
        ...branch,
        isOpen,
        servicesByCategory
      }
    }

    // Load open salon's services into Redis
    if (isOpen) {
      await setCache(cacheKey, resultData, 600)
    } else {
      await delCache(cacheKey)
    }

    res.status(200).json({
      success: true,
      cached: false,
      data: resultData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches/:branchId/slots
// public — available slots for a branch on a date
// ================================
const getBranchSlotsPublic = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const { date, serviceId, staffId } = req.query

    if (!date) {
      return next(new AppError('Date is required. Use ?date=YYYY-MM-DD', 400))
    }

    if (dayjs(date).isBefore(dayjs().startOf('day'))) {
      return next(new AppError('Cannot browse slots in the past', 400))
    }

    const cacheKey = `branch:slots:${branchId}:${date}:${staffId || 'all'}:${serviceId || 'all'}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

const filter = {
      branchId,
      date,
      status: "AVAILABLE",
    }

    const isStaffValid = staffId && staffId !== "any" && mongoose.Types.ObjectId.isValid(staffId);
    if (isStaffValid) {
      filter.staffId = staffId;
    }

    const isServiceValid = serviceId && mongoose.Types.ObjectId.isValid(serviceId);
    if (isServiceValid) {
      const service = await Service.findById(serviceId).lean();
      if (!service) {
        return next(new AppError('Service not found', 404));
      }

      if (service.eligibleStaff && service.eligibleStaff.length > 0) {
        if (isStaffValid) {
          if (!service.eligibleStaff.map((id) => id.toString()).includes(staffId.toString())) {
            return res.status(200).json({
              success: true,
              data: { date, branchId, availability: [] }
            });
          }
        } else {
          filter.staffId = { $in: service.eligibleStaff };
        }
      }
    }

    const slots = await Slot.find(filter)
      .populate('staffId', 'name')
      .select('staffId date startTime endTime status')
      .sort({ startTime: 1 })
      .lean()

    const now = dayjs()
    const isToday = dayjs(date).isSame(now, 'day')

    const slotsByStaff = slots.reduce((acc, slot) => {
      if (isToday) {
        const slotTime = dayjs(`${slot.date} ${slot.startTime}`)
        if (!slotTime.isAfter(now)) return acc
      }

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

    const resultData = {
      date,
      branchId,
      availability: Object.values(slotsByStaff)
    }

    // Short TTL for slots (60s)
    await setCache(cacheKey, resultData, 60)

    res.status(200).json({
      success: true,
      cached: false,
      data: resultData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches/:branchId/services
// ================================
const getBranchServicesPublic = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const { category } = req.query
    const cacheKey = `branch:services:${branchId}:${category || 'all'}`

    // 1. Verify branch active status and operating hours
    const branch = await Branch.findOne({ _id: branchId, isActive: true, deactivatedByAdmin: { $ne: true } })
      .select('name workingHours isActive deactivatedByAdmin')
      .lean()

    if (!branch) {
      return next(new AppError('Branch not found or inactive', 404))
    }

    const isOpen = isBranchOpen(branch)

    // If salon is OPEN: return from Redis cache if available
    if (isOpen) {
      const cached = await getCache(cacheKey)
      if (cached) {
        return res.status(200).json({ success: true, cached: true, data: cached })
      }
    } else {
      // Evict any existing Redis cache for closed salon
      await delCache(cacheKey)
    }

    const filter = { branchId, isActive: true }
    if (category) filter.category = category

    const services = await Service.find(filter)
      .select('name description category price durationMinutes currency image imageUrl photoUrl includedServices packageOfferTag')
      .lean()

    const servicesWithDisplay = services.map((s) => ({
      ...s,
      priceDisplay: `₹${(s.price / 100).toFixed(2)}`
    }))

    const resultData = { services: servicesWithDisplay, isOpen }

    // Load open salon's services into Redis
    if (isOpen) {
      await setCache(cacheKey, resultData, 600)
    }

    res.status(200).json({
      success: true,
      cached: isOpen,
      data: resultData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches/:branchId/staff
// ================================
const getBranchStaffPublic = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const cacheKey = `branch:staff:${branchId}`

    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const staff = await User.find({ branchId, isActive: { $ne: false } })
      .select('name email phone avatar photoUrl role')
      .lean()

    const resultData = { staff }

    await setCache(cacheKey, resultData, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: resultData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/browse/branches/:branchId/reviews
// ================================
const getBranchReviewsPublic = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const cacheKey = `branch:reviews:${branchId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached });
    }

    const appointments = await Appointment.find({
      branchId,
      'rating.score': { $ne: null }
    })
      .populate('customerId', 'name avatar')
      .populate('serviceId', 'name')
      .sort({ 'rating.ratedAt': -1 })
      .limit(30);

    const reviews = appointments.map((appt) => ({
      _id: appt._id,
      customerName: appt.customerId?.name || 'Verified Client',
      customerAvatar: appt.customerId?.avatar || null,
      serviceName: appt.serviceId?.name || 'Service',
      score: appt.rating.score,
      comment: appt.rating.review,
      ratedAt: appt.rating.ratedAt,
    }));

    const resultData = { reviews };
    await setCache(cacheKey, resultData, 300);

    res.status(200).json({
      success: true,
      cached: false,
      data: resultData
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/browse/salons/:salonId/reviews
// ================================
const getSalonReviewsPublic = async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const cacheKey = `salon:reviews:${salonId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached });
    }

    const appointments = await Appointment.find({
      salonId,
      'rating.score': { $ne: null }
    })
      .populate('customerId', 'name avatar')
      .populate('serviceId', 'name')
      .sort({ 'rating.ratedAt': -1 })
      .limit(30);

    const reviews = appointments.map((appt) => ({
      _id: appt._id,
      customerName: appt.customerId?.name || 'Verified Client',
      customerAvatar: appt.customerId?.avatar || null,
      serviceName: appt.serviceId?.name || 'Service',
      score: appt.rating.score,
      comment: appt.rating.review,
      ratedAt: appt.rating.ratedAt,
    }));

    const resultData = { reviews };
    await setCache(cacheKey, resultData, 300);

    res.status(200).json({
      success: true,
      cached: false,
      data: resultData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInitialLoad,
  browseSalons,
  getSalonPublic,
  browseBranches,
  getBranchPublic,
  getBranchSlotsPublic,
  getBranchServicesPublic,
  getBranchStaffPublic,
  getBranchReviewsPublic,
  getSalonReviewsPublic,
}
