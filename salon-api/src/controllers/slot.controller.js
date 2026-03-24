const Slot = require('../models/slot.model')
const Branch = require('../models/branch.model')
const User = require('../models/user.model')
const Role = require('../models/role.model')
const AppError = require('../utils/AppError')
const { generateDaySlots } = require('../utils/slotGenerator')
const dayjs = require('dayjs')

// ================================
// POST /api/v1/branches/:branchId/slots/generate
// owner or manager — generate slots for a staff member for a date range
// ================================
const generateSlots = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const { staffId, startDate, endDate } = req.body
    const { salonId, branchId: userBranchId, role } = req.user

    // scope check
    if (role === 'manager' && branchId !== userBranchId.toString()) {
      return next(new AppError('Access denied.', 403))
    }

    // verify branch
    const branch = await Branch.findById(branchId)
    if (!branch) {
      return next(new AppError('Branch not found', 404))
    }

    // verify staff belongs to this branch
    const staff = await User.findOne({ _id: staffId, branchId })
    if (!staff) {
      return next(new AppError('Staff member not found in this branch', 404))
    }

    // validate dates
    const start = dayjs(startDate)
    const end = dayjs(endDate)

    if (!start.isValid() || !end.isValid()) {
      return next(new AppError('Invalid date format. Use YYYY-MM-DD', 400))
    }

    if (end.isBefore(start)) {
      return next(new AppError('End date must be after start date', 400))
    }

    // max 30 days at a time to prevent abuse
    if (end.diff(start, 'day') > 30) {
      return next(new AppError('Cannot generate more than 30 days of slots at once', 400))
    }

    // generate slots for each day in range
    const slotsToInsert = []
    let current = start

    while (current.isBefore(end.add(1, 'day'))) {
      const date = current.format('YYYY-MM-DD')
      const daySlots = generateDaySlots(branch, date)

      daySlots.forEach((slot) => {
        slotsToInsert.push({
          branchId,
          salonId: branch.salonId,
          staffId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: 'AVAILABLE'
        })
      })

      current = current.add(1, 'day')
    }

    if (slotsToInsert.length === 0) {
      return next(new AppError('No slots generated. Check branch working hours.', 400))
    }

    // insertMany with ordered:false continues even if some slots already exist
    // this prevents duplicate slot errors from stopping the whole batch
    let inserted = 0
    let skipped = 0

    try {
      const result = await Slot.insertMany(slotsToInsert, { ordered: false })
      inserted = result.length
    } catch (err) {
      // err.insertedDocs has successful ones, err.writeErrors has duplicates
      inserted = err.insertedDocs ? err.insertedDocs.length : 0
      skipped = err.writeErrors ? err.writeErrors.length : 0
    }

    res.status(201).json({
      success: true,
      message: `Slot generation complete`,
      data: {
        inserted,
        skipped,
        total: slotsToInsert.length
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/branches/:branchId/slots
// get available slots for a branch on a date
// customers use this to see what's bookable
// ================================
const getSlots = async (req, res, next) => {
  try {
    const { branchId } = req.params
    const { date, staffId, status } = req.query

    if (!date) {
      return next(new AppError('Date is required. Use ?date=YYYY-MM-DD', 400))
    }

    const filter = { branchId, date }

    // optionally filter by staff
    if (staffId) filter.staffId = staffId

    // optionally filter by status — default to AVAILABLE for customers
    filter.status = status || 'AVAILABLE'

    const slots = await Slot.find(filter)
      .populate('staffId', 'name')
      .sort({ startTime: 1 })
      .lean()

    res.status(200).json({
      success: true,
      data: { slots }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/branches/:branchId/slots/:slotId/block
// manager or staff — block a slot manually
// e.g. lunch break, leave
// ================================
const blockSlot = async (req, res, next) => {
  try {
    const { branchId, slotId } = req.params
    const { reason } = req.body
    const { userId, branchId: userBranchId, role } = req.user

    if (role === 'manager' && branchId !== userBranchId.toString()) {
      return next(new AppError('Access denied.', 403))
    }

    const slot = await Slot.findOne({ _id: slotId, branchId })
    if (!slot) {
      return next(new AppError('Slot not found', 404))
    }

    if (slot.status === 'BOOKED') {
      return next(new AppError('Cannot block a slot that is already booked', 400))
    }

    slot.status = 'BLOCKED'
    slot.blockReason = reason || 'Blocked by staff'
    await slot.save()

    res.status(200).json({
      success: true,
      message: 'Slot blocked successfully',
      data: { slot }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/branches/:branchId/slots/:slotId/unblock
// manager — unblock a slot
// ================================
const unblockSlot = async (req, res, next) => {
  try {
    const { branchId, slotId } = req.params
    const { branchId: userBranchId, role } = req.user

    if (role === 'manager' && branchId !== userBranchId.toString()) {
      return next(new AppError('Access denied.', 403))
    }

    const slot = await Slot.findOne({ _id: slotId, branchId })
    if (!slot) {
      return next(new AppError('Slot not found', 404))
    }

    if (slot.status !== 'BLOCKED') {
      return next(new AppError('Slot is not blocked', 400))
    }

    slot.status = 'AVAILABLE'
    slot.blockReason = null
    await slot.save()

    res.status(200).json({
      success: true,
      message: 'Slot unblocked successfully',
      data: { slot }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { generateSlots, getSlots, blockSlot, unblockSlot }