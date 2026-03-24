const Appointment = require('../models/appointment.model')
const Slot = require('../models/slot.model')
const Service = require('../models/service.model')
const User = require('../models/user.model')
const AppError = require('../utils/AppError')
const dayjs = require('dayjs')

// ================================
// POST /api/v1/appointments
// customer only — book an appointment
// ================================
const bookAppointment = async (req, res, next) => {
  try {
    const { slotId, serviceId, customerNotes } = req.body
    const { userId } = req.user

    // --------------------------------
    // Step 1 — validate slot
    // --------------------------------
    const slot = await Slot.findById(slotId)
    if (!slot) {
      return next(new AppError('Slot not found', 404))
    }

    if (slot.status !== 'AVAILABLE') {
      return next(new AppError('This slot is no longer available', 400))
    }

    // don't allow booking slots in the past
    const slotDateTime = dayjs(`${slot.date} ${slot.startTime}`)
    if (slotDateTime.isBefore(dayjs())) {
      return next(new AppError('Cannot book a slot in the past', 400))
    }

    // --------------------------------
    // Step 2 — validate service
    // --------------------------------
    const service = await Service.findById(serviceId)
    if (!service) {
      return next(new AppError('Service not found', 404))
    }

    if (!service.isActive) {
      return next(new AppError('This service is not available', 400))
    }

    // verify service belongs to same branch as slot
    if (service.branchId.toString() !== slot.branchId.toString()) {
      return next(new AppError('Service does not belong to this branch', 400))
    }

    // verify staff can perform this service
    if (
      service.eligibleStaff.length > 0 &&
      !service.eligibleStaff.map((id) => id.toString()).includes(slot.staffId.toString())
    ) {
      return next(new AppError('This staff member cannot perform the selected service', 400))
    }

    // --------------------------------
    // Step 3 — check customer doesn't
    // already have a booking at same time
    // --------------------------------
    const conflict = await Appointment.findOne({
      customerId: userId,
      date: slot.date,
      startTime: slot.startTime,
      status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
    })

    if (conflict) {
      return next(new AppError('You already have an appointment at this time', 400))
    }

    // --------------------------------
    // Step 4 — create appointment
    // uses atomic operation to prevent double booking
    // --------------------------------

    // atomically mark slot as BOOKED
    // findOneAndUpdate with status:AVAILABLE ensures
    // two simultaneous requests can't both book the same slot
    const bookedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, status: 'AVAILABLE' }, // condition
      { status: 'BOOKED' },                  // update
      { new: true }                          // return updated doc
    )

    // if null — someone else just booked it in the same millisecond
    if (!bookedSlot) {
      return next(new AppError('This slot was just booked by someone else. Please choose another.', 400))
    }

    // create the appointment
    const appointment = await Appointment.create({
      customerId: userId,
      branchId: slot.branchId,
      salonId: slot.salonId,
      staffId: slot.staffId,
      serviceId,
      slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'PENDING',
      pricePaid: service.price,
      currency: service.currency,
      customerNotes: customerNotes || null,
      statusHistory: [{
        status: 'PENDING',
        changedAt: new Date(),
        note: 'Appointment booked by customer'
      }]
    })

    // link appointment back to slot
    await Slot.findByIdAndUpdate(slotId, { appointmentId: appointment._id })

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/appointments
// filtered by role:
//   customer  → their own appointments
//   staff     → their appointments for today
//   manager   → all branch appointments
//   owner     → all salon appointments
// ================================
const getAppointments = async (req, res, next) => {
  try {
    const { userId, role, branchId, salonId } = req.user
    const { date, status, page = 1, limit = 20 } = req.query

    const filter = {}

    // role-based filtering
    if (role === 'customer') {
      filter.customerId = userId
    } else if (role === 'staff') {
      filter.staffId = userId
      // staff defaults to today if no date given
      filter.date = date || dayjs().format('YYYY-MM-DD')
    } else if (role === 'manager') {
      filter.branchId = branchId
    } else if (role === 'owner') {
      filter.salonId = salonId
    }

    // optional filters
    if (date && role !== 'staff') filter.date = date
    if (status) filter.status = status

    // pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('customerId', 'name phone email')
        .populate('staffId', 'name')
        .populate('serviceId', 'name price durationMinutes')
        .populate('branchId', 'name address')
        .sort({ date: -1, startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(filter)
    ])

    res.status(200).json({
      success: true,
      data: {
        appointments,
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
// GET /api/v1/appointments/:appointmentId
// ================================
const getAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params
    const { userId, role, branchId, salonId } = req.user

    const appointment = await Appointment.findById(appointmentId)
      .populate('customerId', 'name phone email')
      .populate('staffId', 'name')
      .populate('serviceId', 'name price durationMinutes')
      .populate('branchId', 'name address')
      .populate('slotId', 'date startTime endTime')
      .lean()

    if (!appointment) {
      return next(new AppError('Appointment not found', 404))
    }

    // scope checks
    if (role === 'customer' && appointment.customerId._id.toString() !== userId.toString()) {
      return next(new AppError('Access denied', 403))
    }
    if (role === 'staff' && appointment.staffId._id.toString() !== userId.toString()) {
      return next(new AppError('Access denied', 403))
    }
    if (role === 'manager' && appointment.branchId._id.toString() !== branchId.toString()) {
      return next(new AppError('Access denied', 403))
    }

    res.status(200).json({
      success: true,
      data: { appointment }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/appointments/:appointmentId/status
// update appointment status through its lifecycle
// ================================
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params
    const { status, note } = req.body
    const { userId, role, branchId } = req.user

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return next(new AppError('Appointment not found', 404))
    }

    // --------------------------------
    // who can change to what status
    // --------------------------------
    const allowedTransitions = {
      customer: {
        PENDING: ['CANCELLED'],
        CONFIRMED: ['CANCELLED']
      },
      staff: {
        CONFIRMED: ['IN_PROGRESS'],
        IN_PROGRESS: ['COMPLETED']
      },
      manager: {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['CANCELLED', 'IN_PROGRESS'],
        IN_PROGRESS: ['COMPLETED'],
        COMPLETED: ['NO_SHOW']
      },
      owner: {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['CANCELLED', 'IN_PROGRESS'],
        IN_PROGRESS: ['COMPLETED'],
        COMPLETED: ['NO_SHOW']
      }
    }

    const currentStatus = appointment.status
    const allowed = allowedTransitions[role]?.[currentStatus] || []

    if (!allowed.includes(status)) {
      return next(
        new AppError(
          `Cannot transition from ${currentStatus} to ${status}`,
          400
        )
      )
    }

    // scope check for manager
    if (role === 'manager' && appointment.branchId.toString() !== branchId.toString()) {
      return next(new AppError('Access denied', 403))
    }

    // customer can only cancel their own
    if (role === 'customer' && appointment.customerId.toString() !== userId.toString()) {
      return next(new AppError('Access denied', 403))
    }

    // staff can only update their own appointments
    if (role === 'staff' && appointment.staffId.toString() !== userId.toString()) {
      return next(new AppError('Access denied', 403))
    }

    // if cancelling — free up the slot
    if (status === 'CANCELLED') {
      await Slot.findByIdAndUpdate(appointment.slotId, {
        status: 'AVAILABLE',
        appointmentId: null
      })

      appointment.cancellation = {
        cancelledBy: userId,
        reason: note || 'No reason provided',
        cancelledAt: new Date()
      }
    }

    // update status — pre-save hook records it in statusHistory
    appointment.status = status
    appointment.statusHistory.push({
      status,
      changedBy: userId,
      changedAt: new Date(),
      note: note || null
    })

    await appointment.save()

    res.status(200).json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      data: { appointment }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// PATCH /api/v1/appointments/:appointmentId/rate
// customer only — rate after completion
// ================================
const rateAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params
    const { score, review } = req.body
    const { userId } = req.user

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return next(new AppError('Appointment not found', 404))
    }

    if (appointment.customerId.toString() !== userId.toString()) {
      return next(new AppError('Access denied', 403))
    }

    if (appointment.status !== 'COMPLETED') {
      return next(new AppError('Can only rate completed appointments', 400))
    }

    if (appointment.rating.score) {
      return next(new AppError('Appointment already rated', 400))
    }

    if (!score || score < 1 || score > 5) {
      return next(new AppError('Score must be between 1 and 5', 400))
    }

    appointment.rating = {
      score,
      review: review || null,
      ratedAt: new Date()
    }

    await appointment.save()

    res.status(200).json({
      success: true,
      message: 'Thank you for your rating!',
      data: { rating: appointment.rating }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  bookAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  rateAppointment
}