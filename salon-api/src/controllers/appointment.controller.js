const mongoose = require("mongoose");
const Appointment = require("../models/appointment.model");
const Slot = require("../models/slot.model");
const Service = require("../models/service.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const dayjs = require("dayjs");

// ================================
// POST /api/v1/appointments
// customer only — book an appointment
// ================================
const bookAppointment = async (req, res, next) => {
  try {
    const { slotId, serviceId, customerNotes } = req.body;
    const { userId } = req.user;

    // --------------------------------
    // Step 1 — validate slot
    // --------------------------------
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return next(new AppError("Slot not found", 404));
    }

    if (slot.status !== "AVAILABLE") {
      return next(new AppError("This slot is no longer available", 400));
    }

    const slotDateTime = dayjs(`${slot.date} ${slot.startTime}`);
    if (slotDateTime.isBefore(dayjs())) {
      return next(new AppError("Cannot book a slot in the past", 400));
    }

    // --------------------------------
    // Step 2 — validate service
    // --------------------------------
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new AppError("Service not found", 404));
    }

    if (!service.isActive) {
      return next(new AppError("This service is not available", 400));
    }

    if (service.branchId.toString() !== slot.branchId.toString()) {
      return next(new AppError("Service does not belong to this branch", 400));
    }

    if (
      service.eligibleStaff.length > 0 &&
      !service.eligibleStaff
        .map((id) => id.toString())
        .includes(slot.staffId.toString())
    ) {
      return next(
        new AppError(
          "This staff member cannot perform the selected service",
          400,
        ),
      );
    }

    // --------------------------------
    // Step 3 — check customer conflict
    // --------------------------------
    const conflict = await Appointment.findOne({
      customerId: userId,
      date: slot.date,
      startTime: slot.startTime,
      status: { $in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
    });

    if (conflict) {
      return next(
        new AppError("You already have an appointment at this time", 400),
      );
    }

    // --------------------------------
    // Step 4 — atomic booking inside a transaction
    // if ANY step fails, ALL steps roll back
    // --------------------------------
    const session = await mongoose.startSession();
    let appointment;

    try {
      await session.withTransaction(async () => {
        // atomically mark slot as BOOKED inside transaction
        const bookedSlot = await Slot.findOneAndUpdate(
          { _id: slotId, status: "AVAILABLE" },
          { status: "BOOKED" },
          { new: true, session }, // pass session to every DB call
        );

        // someone else booked it in the same millisecond
        if (!bookedSlot) {
          throw new AppError(
            "This slot was just booked by someone else. Please choose another.",
            400,
          );
        }

        // create appointment inside same transaction
        const created = await Appointment.create(
          [
            {
              customerId: userId,
              branchId: slot.branchId,
              salonId: slot.salonId,
              staffId: slot.staffId,
              serviceId,
              slotId,
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: "PENDING",
              pricePaid: service.price,
              currency: service.currency,
              customerNotes: customerNotes || null,
              statusHistory: [
                {
                  status: "PENDING",
                  changedAt: new Date(),
                  note: "Appointment booked by customer",
                },
              ],
            },
          ],
          { session }, // array form required when using session with create
        );

        appointment = created[0];

        // link appointment back to slot — inside same transaction
        await Slot.findByIdAndUpdate(
          slotId,
          { appointmentId: appointment._id },
          { session },
        );
      });
    } finally {
      // always end the session whether success or failure
      session.endSession();
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: { appointment },
    });
  } catch (error) {
    // if the error came from inside the transaction (like slot taken)
    // pass it to global error handler
    next(error);
  }
};

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
    const { userId, role, branchId, salonId } = req.user;
    const { date, status, branchId: queryBranchId, page = 1, limit = 20 } = req.query;

    const filter = {};

    // role-based filtering
    if (role === "customer") {
      filter.customerId = userId;
    } else if (role === "staff") {
      filter.staffId = userId;
      // staff defaults to today if no date given
      filter.date = date || dayjs().format("YYYY-MM-DD");
    } else if (role === "manager") {
      filter.branchId = branchId;
    } else if (role === "owner") {
      filter.salonId = salonId;
      // owner can optionally filter by a specific branch
      if (queryBranchId) {
        filter.branchId = queryBranchId;
      }
    }

    // optional filters
    if (date && role !== "staff") filter.date = date;
    if (status) filter.status = status;

    // pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("customerId", "name phone email")
        .populate("staffId", "name")
        .populate("serviceId", "name price durationMinutes")
        .populate("branchId", "name address")
        .sort({ date: -1, startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/appointments/:appointmentId
// ================================
const getAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { userId, role, branchId, salonId } = req.user;

    const appointment = await Appointment.findById(appointmentId)
      .populate("customerId", "name phone email")
      .populate("staffId", "name")
      .populate("serviceId", "name price durationMinutes")
      .populate("branchId", "name address")
      .populate("slotId", "date startTime endTime")
      .lean();

    if (!appointment) {
      return next(new AppError("Appointment not found", 404));
    }

    // scope checks
    if (
      role === "customer" &&
      appointment.customerId._id.toString() !== userId.toString()
    ) {
      return next(new AppError("Access denied", 403));
    }
    if (
      role === "staff" &&
      appointment.staffId._id.toString() !== userId.toString()
    ) {
      return next(new AppError("Access denied", 403));
    }
    if (
      role === "manager" &&
      appointment.branchId._id.toString() !== branchId.toString()
    ) {
      return next(new AppError("Access denied", 403));
    }

    res.status(200).json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/appointments/:appointmentId/status
// update appointment status through its lifecycle
// ================================
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status, note } = req.body;
    const { userId, role, branchId } = req.user;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return next(new AppError("Appointment not found", 404));
    }

    // --------------------------------
    // who can change to what status
    // --------------------------------
    const allowedTransitions = {
      customer: {
        PENDING: ["CANCELLED"],
        CONFIRMED: ["CANCELLED"],
      },
      staff: {
        CONFIRMED: ["IN_PROGRESS"],
        IN_PROGRESS: ["COMPLETED"],
      },
      manager: {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["CANCELLED", "IN_PROGRESS"],
        IN_PROGRESS: ["COMPLETED"],
        COMPLETED: ["NO_SHOW"],
      },
      owner: {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["CANCELLED", "IN_PROGRESS"],
        IN_PROGRESS: ["COMPLETED"],
        COMPLETED: ["NO_SHOW"],
      },
    };

    const currentStatus = appointment.status;
    const allowed = allowedTransitions[role]?.[currentStatus] || [];

    if (!allowed.includes(status)) {
      return next(
        new AppError(
          `Cannot transition from ${currentStatus} to ${status}`,
          400,
        ),
      );
    }

    // scope check for manager
    if (
      role === "manager" &&
      appointment.branchId.toString() !== branchId.toString()
    ) {
      return next(new AppError("Access denied", 403));
    }

    // customer can only cancel their own
    if (
      role === "customer" &&
      appointment.customerId.toString() !== userId.toString()
    ) {
      return next(new AppError("Access denied", 403));
    }

    // staff can only update their own appointments
    if (
      role === "staff" &&
      appointment.staffId.toString() !== userId.toString()
    ) {
      return next(new AppError("Access denied", 403));
    }

    // if cancelling — free up the slot
    if (status === "CANCELLED") {
      await Slot.findByIdAndUpdate(appointment.slotId, {
        status: "AVAILABLE",
        appointmentId: null,
      });

      appointment.cancellation = {
        cancelledBy: userId,
        reason: note || "No reason provided",
        cancelledAt: new Date(),
      };
    }

    // update status — pre-save hook records it in statusHistory
    appointment.status = status;
    appointment.statusHistory.push({
      status,
      changedBy: userId,
      changedAt: new Date(),
      note: note || null,
    });

    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      data: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/appointments/:appointmentId/rate
// customer only — rate after completion
// ================================
const rateAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { score, review } = req.body;
    const { userId } = req.user;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return next(new AppError("Appointment not found", 404));
    }

    if (appointment.customerId.toString() !== userId.toString()) {
      return next(new AppError("Access denied", 403));
    }

    if (appointment.status !== "COMPLETED") {
      return next(new AppError("Can only rate completed appointments", 400));
    }

    if (appointment.rating.score) {
      return next(new AppError("Appointment already rated", 400));
    }

    if (!score || score < 1 || score > 5) {
      return next(new AppError("Score must be between 1 and 5", 400));
    }

    appointment.rating = {
      score,
      review: review || null,
      ratedAt: new Date(),
    };

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Thank you for your rating!",
      data: { rating: appointment.rating },
    });
  } catch (error) {
    next(error);
  }
};
// ================================
// PATCH /api/v1/appointments/:appointmentId/reschedule
// customer → change slot only (same staff + service)
// manager  → change slot + staff + service
// ================================
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { newSlotId, newServiceId, newStaffId, reason } = req.body;
    const { userId, role, branchId } = req.user;

    // --------------------------------
    // Step 1 — find appointment
    // --------------------------------
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return next(new AppError("Appointment not found", 404));
    }

    // --------------------------------
    // Step 2 — scope checks
    // --------------------------------

    // customer can only reschedule their own
    if (
      role === "customer" &&
      appointment.customerId.toString() !== userId.toString()
    ) {
      return next(
        new AppError("Access denied. This is not your appointment.", 403),
      );
    }

    // manager can only reschedule appointments in their branch
    if (
      role === "manager" &&
      appointment.branchId.toString() !== branchId.toString()
    ) {
      return next(
        new AppError(
          "Access denied. This appointment is not in your branch.",
          403,
        ),
      );
    }

    // --------------------------------
    // Step 3 — check current status allows reschedule
    // --------------------------------
    const reschedulableStatuses = ["PENDING", "CONFIRMED"];
    if (!reschedulableStatuses.includes(appointment.status)) {
      return next(
        new AppError(
          `Cannot reschedule an appointment that is ${appointment.status}`,
          400,
        ),
      );
    }

    // --------------------------------
    // Step 4 — validate new slot
    // --------------------------------
    if (!newSlotId) {
      return next(new AppError("New slot is required", 400));
    }

    // make sure new slot is different from current
    if (newSlotId === appointment.slotId.toString()) {
      return next(
        new AppError("New slot must be different from current slot", 400),
      );
    }

    const newSlot = await Slot.findById(newSlotId);
    if (!newSlot) {
      return next(new AppError("New slot not found", 404));
    }

    if (newSlot.status !== "AVAILABLE") {
      return next(new AppError("Selected slot is not available", 400));
    }

    // new slot must be in the future
    const slotDateTime = dayjs(`${newSlot.date} ${newSlot.startTime}`);
    if (slotDateTime.isBefore(dayjs())) {
      return next(new AppError("Cannot reschedule to a slot in the past", 400));
    }

    // new slot must be in same branch
    if (newSlot.branchId.toString() !== appointment.branchId.toString()) {
      return next(new AppError("New slot must be in the same branch", 400));
    }

    // --------------------------------
    // Step 5 — customer restrictions
    // customer can only use slots for same staff
    // --------------------------------
    if (role === "customer") {
      if (newSlot.staffId.toString() !== appointment.staffId.toString()) {
        return next(
          new AppError(
            "You can only reschedule to a slot with the same staff member. Contact the salon to change staff.",
            400,
          ),
        );
      }

      // customer cannot change service or staff
      if (newServiceId || newStaffId) {
        return next(
          new AppError(
            "Customers can only change the time slot. Contact the salon to change service or staff.",
            400,
          ),
        );
      }
    }

    // --------------------------------
    // Step 6 — manager can change service and staff
    // --------------------------------
    let finalServiceId = appointment.serviceId;
    let finalStaffId = appointment.staffId;
    let finalPrice = appointment.pricePaid;

    if (role === "manager" || role === "owner") {
      // changing service
      if (newServiceId) {
        const newService = await Service.findOne({
          _id: newServiceId,
          branchId: appointment.branchId,
          isActive: true,
        });

        if (!newService) {
          return next(
            new AppError("New service not found in this branch", 404),
          );
        }

        finalServiceId = newService._id;
        finalPrice = newService.price;
      }

      // changing staff — must match new slot's staff
      if (newStaffId) {
        if (newSlot.staffId.toString() !== newStaffId.toString()) {
          return next(
            new AppError(
              "New staff must match the staff assigned to the new slot",
              400,
            ),
          );
        }
        finalStaffId = newStaffId;
      } else {
        // even if not explicitly changing staff
        // new slot might be for a different staff — update it
        finalStaffId = newSlot.staffId;
      }

      // verify new staff can perform the service
      const serviceToCheck = await Service.findById(finalServiceId);
      if (
        serviceToCheck.eligibleStaff.length > 0 &&
        !serviceToCheck.eligibleStaff
          .map((id) => id.toString())
          .includes(finalStaffId.toString())
      ) {
        return next(
          new AppError("Selected staff cannot perform this service", 400),
        );
      }
    }

    // --------------------------------
    // Step 7 — atomic slot swap
    // free old slot + book new slot atomically
    // --------------------------------

    // atomically book new slot — prevents double booking
    const bookedNewSlot = await Slot.findOneAndUpdate(
      { _id: newSlotId, status: "AVAILABLE" },
      { status: "BOOKED", appointmentId: appointment._id },
      { new: true },
    );

    if (!bookedNewSlot) {
      return next(
        new AppError(
          "This slot was just booked by someone else. Please choose another.",
          400,
        ),
      );
    }

    // free the old slot
    await Slot.findByIdAndUpdate(appointment.slotId, {
      status: "AVAILABLE",
      appointmentId: null,
    });

    // --------------------------------
    // Step 8 — update appointment
    // --------------------------------
    const oldSlotInfo = {
      slotId: appointment.slotId,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    };

    appointment.slotId = newSlotId;
    appointment.date = newSlot.date;
    appointment.startTime = newSlot.startTime;
    appointment.endTime = newSlot.endTime;
    appointment.staffId = finalStaffId;
    appointment.serviceId = finalServiceId;
    appointment.pricePaid = finalPrice;

    // reset to PENDING after reschedule — needs reconfirmation
    appointment.status = "PENDING";

    // record in history
    appointment.statusHistory.push({
      status: "PENDING",
      changedBy: userId,
      changedAt: new Date(),
      note: reason
        ? `Rescheduled: ${reason}. Was: ${oldSlotInfo.date} ${oldSlotInfo.startTime}`
        : `Rescheduled from ${oldSlotInfo.date} ${oldSlotInfo.startTime} to ${newSlot.date} ${newSlot.startTime}`,
    });

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: {
        appointment: {
          id: appointment._id,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          staffId: appointment.staffId,
          serviceId: appointment.serviceId,
          pricePaid: appointment.pricePaid,
        },
        previousSlot: oldSlotInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/customers/me/appointments
// customer only — full appointment history with stats
// ================================
const getMyAppointmentHistory = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const {
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sort = "newest",
    } = req.query;

    // --------------------------------
    // Step 1 — build filter
    // --------------------------------
    const filter = { customerId: userId };

    // optional status filter
    if (status) {
      filter.status = status.toUpperCase();
    }

    // optional date range filter
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate; // "YYYY-MM-DD"
      if (toDate) filter.date.$lte = toDate;
    }

    // --------------------------------
    // Step 2 — pagination
    // --------------------------------
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder =
      sort === "oldest"
        ? { date: 1, startTime: 1 }
        : { date: -1, startTime: -1 };

    // --------------------------------
    // Step 3 — fetch appointments + count in parallel
    // --------------------------------
    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("staffId", "name")
        .populate("serviceId", "name price durationMinutes")
        .populate("branchId", "name address")
        .populate("salonId", "name")
        .sort(sortOrder)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    // --------------------------------
    // Step 4 — compute summary stats
    // --------------------------------
    const stats = await Appointment.aggregate([
      { $match: { customerId: userId } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
          upcomingCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["PENDING", "CONFIRMED"]] }, 1, 0],
            },
          },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ["$status", "COMPLETED"] }, "$pricePaid", 0],
            },
          },
          averageRating: {
            $avg: "$rating.score",
          },
        },
      },
    ]);

    const summary = stats[0] || {
      totalAppointments: 0,
      completedCount: 0,
      cancelledCount: 0,
      upcomingCount: 0,
      totalSpent: 0,
      averageRating: null,
    };

    res.status(200).json({
      success: true,
      data: {
        appointments,
        summary: {
          totalAppointments: summary.totalAppointments,
          completed: summary.completedCount,
          cancelled: summary.cancelledCount,
          upcoming: summary.upcomingCount,
          totalSpent: summary.totalSpent,
          averageRatingGiven: summary.averageRating
            ? Math.round(summary.averageRating * 10) / 10
            : null,
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  rateAppointment,
  rescheduleAppointment,
  getMyAppointmentHistory,
};
