const Appointment = require('../models/appointment.model')
const Service = require('../models/service.model')
const User = require('../models/user.model')
const Slot = require('../models/slot.model')
const AppError = require('../utils/AppError')
const dayjs = require('dayjs')
const { getCache, setCache } = require('../services/cache.service')

// ================================
// GET /api/v1/reports/overview
// owner → entire salon
// manager → their branch only
// ================================
const getOverview = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate } = req.query

    // default to current month if no dates given
    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = `report:overview:${role}:${salonId || branchId || 'all'}:${start}:${end}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    // build filter based on role
    const filter = {
      date: { $gte: start, $lte: end }
    }

    if (role === 'manager') filter.branchId = branchId;
    if (role === 'owner') filter.salonId = salonId;

    // Single aggregation query replacing 7 separate database round-trips
    const [stats] = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ["$status", "CONFIRMED"] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ["$status", "NO_SHOW"] }, 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, { $ifNull: ["$pricePaid", 0] }, 0] } },
        },
      },
    ]);

    const totalAppointments = stats?.total || 0;
    const completedAppointments = stats?.completed || 0;
    const cancelledAppointments = stats?.cancelled || 0;
    const pendingAppointments = stats?.pending || 0;
    const confirmedAppointments = stats?.confirmed || 0;
    const noShowAppointments = stats?.noShow || 0;
    const totalRevenue = stats?.totalRevenue || 0;

    const responseData = {
      period: { startDate: start, endDate: end },
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        noShow: noShowAppointments,
        completionRate: totalAppointments > 0
          ? ((completedAppointments / totalAppointments) * 100).toFixed(1) + '%'
          : '0%'
      },
      revenue: {
        total: totalRevenue,
        display: `₹${(totalRevenue / 100).toFixed(2)}`
      }
    }

    await setCache(cacheKey, responseData, 120)

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
// GET /api/v1/reports/popular-services
// most booked services in a period
// ================================
const getPopularServices = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate, limit = 5 } = req.query

    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = `report:popular-services:${role}:${salonId || branchId || 'all'}:${start}:${end}:${limit}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const matchFilter = {
      date: { $gte: start, $lte: end },
      status: 'COMPLETED'
    }

    if (role === 'manager') matchFilter.branchId = branchId
    if (role === 'owner') matchFilter.salonId = salonId

    const popularServices = await Appointment.aggregate([
      { $match: matchFilter },

      // group by serviceId and count bookings + sum revenue
      {
        $group: {
          _id: '$serviceId',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$pricePaid' }
        }
      },

      // sort by most booked
      { $sort: { totalBookings: -1 } },

      // limit results
      { $limit: parseInt(limit) },

      // join with services collection to get service details
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },

      // flatten the service array
      { $unwind: '$service' },

      // shape the output
      {
        $project: {
          _id: 0,
          serviceId: '$_id',
          name: '$service.name',
          category: '$service.category',
          totalBookings: 1,
          totalRevenue: 1,
          revenueDisplay: {
            $concat: ['₹', { $toString: { $divide: ['$totalRevenue', 100] } }]
          }
        }
      }
    ])

    const popularData = {
      period: { startDate: start, endDate: end },
      popularServices
    }

    await setCache(cacheKey, popularData, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: popularData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/reports/staff-performance
// bookings and revenue per staff member
// ================================
const getStaffPerformance = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate } = req.query

    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = `report:staff-performance:${role}:${salonId || branchId || 'all'}:${start}:${end}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const matchFilter = {
      date: { $gte: start, $lte: end },
      status: 'COMPLETED'
    }

    if (role === 'manager') matchFilter.branchId = branchId
    if (role === 'owner') matchFilter.salonId = salonId

    const staffPerformance = await Appointment.aggregate([
      { $match: matchFilter },

      {
        $group: {
          _id: '$staffId',
          totalAppointments: { $sum: 1 },
          totalRevenue: { $sum: '$pricePaid' },
          avgRating: { $avg: '$rating.score' }
        }
      },

      { $sort: { totalAppointments: -1 } },

      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },

      { $unwind: '$staff' },

      {
        $project: {
          _id: 0,
          staffId: '$_id',
          name: '$staff.name',
          email: '$staff.email',
          totalAppointments: 1,
          totalRevenue: 1,
          revenueDisplay: {
            $concat: ['₹', { $toString: { $divide: ['$totalRevenue', 100] } }]
          },
          avgRating: {
            $cond: {
              if: { $gt: ['$avgRating', null] },
              then: { $round: ['$avgRating', 1] },
              else: 'No ratings yet'
            }
          }
        }
      }
    ])

    const staffData = {
      period: { startDate: start, endDate: end },
      staffPerformance
    }

    await setCache(cacheKey, staffData, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: staffData
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/reports/daily-bookings
// bookings count per day in a period
// useful for charts on frontend
// ================================
const getDailyBookings = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { startDate, endDate } = req.query

    const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD')
    const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD')

    const cacheKey = `report:daily-bookings:${role}:${salonId || branchId || 'all'}:${start}:${end}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const matchFilter = {
      date: { $gte: start, $lte: end }
    }

    if (role === 'manager') matchFilter.branchId = branchId
    if (role === 'owner') matchFilter.salonId = salonId

    const dailyData = await Appointment.aggregate([
      { $match: matchFilter },

      {
        $group: {
          _id: '$date',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$pricePaid', 0]
            }
          }
        }
      },

      { $sort: { _id: 1 } },

      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          completed: 1,
          cancelled: 1,
          revenue: 1,
          revenueDisplay: {
            $concat: ['₹', { $toString: { $divide: ['$revenue', 100] } }]
          }
        }
      }
    ])

    const dailyDataResponse = {
      period: { startDate: start, endDate: end },
      dailyBookings: dailyData
    }

    await setCache(cacheKey, dailyDataResponse, 300)

    res.status(200).json({
      success: true,
      cached: false,
      data: dailyDataResponse
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/reports/slot-utilization
// how many slots are being used vs available
// ================================
const getSlotUtilization = async (req, res, next) => {
  try {
    const { role, branchId, salonId } = req.user
    const { date } = req.query

    const targetDate = date || dayjs().format('YYYY-MM-DD')

    const cacheKey = `report:slot-utilization:${role}:${salonId || branchId || 'all'}:${targetDate}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ success: true, cached: true, data: cached })
    }

    const filter = { date: targetDate }
    if (role === 'manager') filter.branchId = branchId
    if (role === 'owner') filter.salonId = salonId

    const [total, available, booked, blocked] = await Promise.all([
      Slot.countDocuments(filter),
      Slot.countDocuments({ ...filter, status: 'AVAILABLE' }),
      Slot.countDocuments({ ...filter, status: 'BOOKED' }),
      Slot.countDocuments({ ...filter, status: 'BLOCKED' })
    ])

    const utilizationData = {
      date: targetDate,
      slots: {
        total,
        available,
        booked,
        blocked,
        utilizationRate: total > 0
          ? ((booked / total) * 100).toFixed(1) + '%'
          : '0%'
      }
    }

    await setCache(cacheKey, utilizationData, 120)

    res.status(200).json({
      success: true,
      cached: false,
      data: utilizationData
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getOverview,
  getPopularServices,
  getStaffPerformance,
  getDailyBookings,
  getSlotUtilization
}