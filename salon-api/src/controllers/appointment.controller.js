const mongoose = require("mongoose");
const Appointment = require("../models/appointment.model");
const Slot = require("../models/slot.model");
const Service = require("../models/service.model");
const User = require("../models/user.model");
const Salon = require("../models/salon.model");
const Branch = require("../models/branch.model");
const AppError = require("../utils/AppError");
const dayjs = require("dayjs");
const { getIO } = require("../config/socket");
const { slotOverlapsLeave } = require("../utils/staffLeaveHelper");
const { getActiveStaffLeaves } = require("../utils/staffLeaveQueries");

const { delCachePattern } = require("../services/cache.service");
const { sendPushToUser } = require("../services/push.service");
const { notifyUser } = require("../services/notification.service");
const {
  sendBookingConfirmationEmail,
  sendAppointmentStatusEmail,
  sendRescheduleConfirmationEmail,
  sendNewBookingAlertToSalon,
} = require("../services/email.service");

// Build a human push notification for an appointment status change.
// Returns null when the status has no customer-facing push to send.
const buildStatusPush = (appointment, serviceName = "appointment", salonName = "Salon") => {
  const copy = {
    CONFIRMED: { title: "Booking accepted", body: `${salonName} accepted your ${serviceName} appointment.` },
    PENDING: { title: "Booking pending", body: `Your ${serviceName} booking at ${salonName} is awaiting confirmation.` },
    IN_PROGRESS: { title: "Service started", body: `Your ${serviceName} at ${salonName} has started.` },
    COMPLETED: { title: "Service completed", body: `Your ${serviceName} at ${salonName} was completed. Don't forget to rate it.` },
    CANCELLED: { title: "Booking cancelled", body: `Your ${serviceName} appointment at ${salonName} was cancelled.` },
    REJECTED: { title: "Booking rejected", body: `Your ${serviceName} booking at ${salonName} was not accepted.` },
    NO_SHOW: { title: "Missed appointment", body: `You missed your ${serviceName} appointment at ${salonName}.` },
  }[appointment.status];

  if (!copy) return null;

  return {
    userId: appointment.customerId?._id || appointment.customerId,
    title: copy.title,
    body: copy.body,
    data: {
      appointmentId: String(appointment._id),
      status: appointment.status,
      type: "appointment.status",
    },
  };
};

// ================================
// POST /api/v1/appointments
// customer only — book an appointment
// ================================
const bookAppointment = async (req, res, next) => {
  try {
    const { slotId, serviceId, serviceIds, customerNotes, guests } = req.body;
    const { userId } = req.user;

    const guestCount = Math.min(Math.max(parseInt(guests, 10) || 1, 1), 10);

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

    // --------------------------------
    // Step 1b — staff availability (leave) check
    // a slot may still be AVAILABLE in DB but the staff is on leave
    // for this window — never allow a hard conflict
    // --------------------------------
    const staffLeaves = await getActiveStaffLeaves({
      staffId: slot.staffId,
      startDate: slot.date,
      endDate: slot.date,
    });

    if (
      staffLeaves.length > 0 &&
      slotOverlapsLeave(slot.startTime, slot.endTime, staffLeaves, slot.date)
    ) {
      return next(
        new AppError(
          "This staff member is not available at that time. Please pick another slot.",
          400,
        ),
      );
    }

    const slotDateTime = dayjs(`${slot.date} ${slot.startTime}`);
    if (slotDateTime.isBefore(dayjs())) {
      return next(new AppError("Cannot book a slot in the past", 400));
    }

    // --------------------------------
    // Step 2 — validate service(s)
    // Supports single serviceId or array of serviceIds for multi-service selection
    // --------------------------------
    const requestedServiceIds = Array.isArray(serviceIds) && serviceIds.length > 0
      ? serviceIds
      : (serviceId ? [serviceId] : []);

    if (requestedServiceIds.length === 0) {
      return next(new AppError("At least one service is required", 400));
    }

    const services = await Service.find({
      _id: { $in: requestedServiceIds },
    });

    if (!services || services.length === 0) {
      return next(new AppError("Selected service(s) not found", 404));
    }

    const primaryService = services[0];
    let totalPricePaid = 0;

    for (const svc of services) {
      if (!svc.isActive) {
        return next(new AppError(`Service "${svc.name}" is not available`, 400));
      }

      if (svc.branchId.toString() !== slot.branchId.toString()) {
        return next(new AppError(`Service "${svc.name}" does not belong to this branch`, 400));
      }

      if (
        svc.eligibleStaff &&
        svc.eligibleStaff.length > 0 &&
        !svc.eligibleStaff
          .map((id) => id.toString())
          .includes(slot.staffId.toString())
      ) {
        return next(
          new AppError(
            `This staff member cannot perform the selected service "${svc.name}"`,
            400,
          ),
        );
      }

      totalPricePaid += (svc.price ?? 0);
    }

    const serviceIdList = services.map((s) => s._id);

    // --------------------------------
    // Step 3 — check customer conflict
    // --------------------------------
    const conflict = await Appointment.findOne({
      customerId: userId,
      date: slot.date,
      startTime: slot.startTime,
      status: { $in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
    })
      .populate("salonId", "name")
      .populate("serviceId", "name")
      .populate("staffId", "name");

    if (conflict) {
      const err = new AppError("You already have an appointment at this time", 400);
      err.conflictAppointment = {
        _id: conflict._id,
        salonName: conflict.salonId?.name || "Salon Luxe",
        serviceName: conflict.serviceId?.name || "Service",
        staffName: conflict.staffId?.name || "Specialist",
        date: conflict.date,
        startTime: conflict.startTime,
        endTime: conflict.endTime,
        status: conflict.status,
      };
      return next(err);
    }

    // --------------------------------
    // Step 4 — atomic booking inside a transaction
    // if ANY step fails, ALL steps roll back
    // --------------------------------
    let appointment;
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const slotToBook = await Slot.findOneAndUpdate(
          { _id: slotId, status: "AVAILABLE" },
          { status: "BOOKED" },
          { new: true, session },
        );

        if (!slotToBook) {
          throw new AppError("Slot was just booked by another customer", 409);
        }

        const created = await Appointment.create(
          [
            {
              salonId: slot.salonId,
              branchId: slot.branchId,
              customerId: userId,
              staffId: slot.staffId,
              serviceId: primaryService._id,
              services: serviceIdList,
              slotId,
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              pricePaid: totalPricePaid,
              currency: primaryService.currency || "INR",
              customerNotes,
              guests: guestCount,
              status: "PENDING",
              history: [
                {
                  status: "PENDING",
                  changedBy: userId,
                  changedAt: new Date(),
                  note: "Appointment booked by customer",
                },
              ],
            },
          ],
          { session },
        );

        appointment = created[0];

        await Slot.findByIdAndUpdate(
          slotId,
          { appointmentId: appointment._id },
          { session },
        );
      });
    } finally {
      session.endSession();
    }

    // Invalidate Redis slot caches for this branch/date only.
    // NOTE: we deliberately do NOT flush `initial_load:*` here — nuking
    // the whole city's cached dataset on every booking forced a full slow
    // rebuild for every subsequent request. The 300s TTL keeps it fresh
    // enough, and the next customer that books this branch still sees the
    // just-invalidated slots on the booking screen.
    delCachePattern(`branch:slots:${slot.branchId}:${slot.date}:*`);

    // Selectively invalidate the initial_load cache for THIS branch's city
    // (instead of flushing every city) so the home screen shows fresh
    // slot availability without a full rebuild of all cities.
    try {
      const branchForCache = await Branch.findById(slot.branchId)
        .select("citySlug")
        .lean();
      if (branchForCache?.citySlug) {
        delCachePattern(`initial_load:${branchForCache.citySlug}:*`);
      }
    } catch (e) {
      console.log("initial_load invalidation error:", e.message);
    }

    // Emit real-time WebSocket event for new appointment
    try {
      const io = getIO();
      if (io) {
        const customerIdStr = String(appointment.customerId);
        const branchIdStr = String(appointment.branchId);
        const salonIdStr = String(appointment.salonId);

        const populatedAppt = await Appointment.findById(appointment._id)
          .populate("customerId", "name email phone")
          .populate("serviceId", "name durationMinutes price")
          .populate("staffId", "name")
          .populate("branchId", "name")
          .populate("salonId", "name");

        const eventData = {
          appointmentId: appointment._id,
          status: appointment.status,
          appointment: populatedAppt || appointment,
        };

        console.log(`⚡ [SOCKET EMIT] Emitting new appointment (${appointment._id}) to branch_${branchIdStr}`);
        io.to(`customer_${customerIdStr}`).emit("appointment_created", eventData);
        io.to(`customer_${customerIdStr}`).emit("appointment_status_changed", eventData);
        io.to(`branch_${branchIdStr}`).emit("appointment_created", eventData);
        io.to(`branch_${branchIdStr}`).emit("appointment_updated", eventData);
        if (salonIdStr) {
          io.to(`salon_${salonIdStr}`).emit("appointment_created", eventData);
          io.to(`salon_${salonIdStr}`).emit("appointment_updated", eventData);
        }
      }
    } catch (e) {
      console.log("WebSocket emit error:", e.message);
    }

    // send the customer a push notification for the new booking
    try {
      const push = buildStatusPush(appointment, service?.name || "appointment");
      if (push) await sendPushToUser(push);
    } catch (e) {
      console.log("Push notification error:", e.message);
    }

    // send confirmation email to customer
    try {
      const fullAppt = await Appointment.findById(appointment._id)
        .populate("customerId", "name email")
        .populate("salonId", "name")
        .populate("branchId", "name")
        .populate("serviceId", "name price")
        .populate("staffId", "name")
        .populate("slotId", "date startTime endTime")
        .lean();

      const custUser = fullAppt?.customerId;
      const salonName = fullAppt?.salonId?.name || "Luxe Salon";
      const branchName = fullAppt?.branchId?.name || "Main Branch";
      const serviceName = fullAppt?.serviceId?.name || service?.name || "Service";
      const staffName = fullAppt?.staffId?.name || "Any Available Staff";
      const apptDate = fullAppt?.date || slot.date;
      const apptTime = fullAppt?.startTime || slot.startTime;
      const priceInINR = fullAppt?.serviceId?.price
        ? (fullAppt.serviceId.price / 100).toFixed(2)
        : service?.price
        ? (service.price / 100).toFixed(2)
        : "0";

      if (custUser?.email) {
        await sendBookingConfirmationEmail({
          to: custUser.email,
          customerName: custUser.name,
          salonName,
          branchName,
          serviceName,
          staffName,
          date: apptDate,
          time: apptTime,
          price: priceInINR,
          bookingId: appointment._id,
        });

        // Track email dispatch on appointment document
        await Appointment.findByIdAndUpdate(appointment._id, {
          emailSent: true,
          lastEmailSentAt: new Date(),
          $push: {
            emailLogs: {
              type: "BOOKING_SUBMITTED",
              sentTo: custUser.email,
              sentAt: new Date(),
            },
          },
        });
      }

      // Also notify Salon Owner / Manager via email
      const salonDoc = await Salon.findById(appointment.salonId).populate("owner", "email name").lean();
      const salonContactEmail = salonDoc?.owner?.email || salonDoc?.contactEmail;
      if (salonContactEmail) {
        await sendNewBookingAlertToSalon({
          to: salonContactEmail,
          ownerOrManagerName: salonDoc?.owner?.name || salonName,
          customerName: custUser?.name || "Customer",
          customerPhone: custUser?.phone,
          salonName,
          branchName,
          serviceName,
          staffName,
          date: apptDate,
          time: apptTime,
          bookingId: appointment._id,
        });
      }
    } catch (e) {
      console.log("Email dispatch error:", e.message);
    }

    // save persistent in-app notification for customer
    try {
      await notifyUser({
        recipientId: appointment.customerId,
        type: "appointment.created",
        title: "Booking Received",
        body: `Your appointment for ${service?.name || "Service"} has been booked for ${slot.date} at ${slot.startTime}.`,
        data: { appointmentId: appointment._id, status: appointment.status },
        branchId: appointment.branchId,
        salonId: appointment.salonId,
      });
    } catch (e) {
      console.log("In-app notification save error:", e.message);
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: { appointment },
    });
  } catch (error) {
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
        .populate("salonId", "name")
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

    // Update slot status in DB + appointment status inside a transaction
    // so the two writes can never drift out of sync
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        if (appointment.slotId) {
          if (status === "CANCELLED") {
            const freedSlot = await Slot.findByIdAndUpdate(
              appointment.slotId,
              {
                status: "AVAILABLE",
                appointmentId: null,
              },
              { session, new: true },
            );
            appointment.cancellation = {
              cancelledBy: userId,
              reason: note || "No reason provided",
              cancelledAt: new Date(),
            };
            if (freedSlot) {
              delCachePattern(`branch:slots:${freedSlot.branchId}:${freedSlot.date}:*`);
              try {
                const branchForCache = await Branch.findById(freedSlot.branchId)
                  .select("citySlug")
                  .lean();
                if (branchForCache?.citySlug) {
                  delCachePattern(`initial_load:${branchForCache.citySlug}:*`);
                }
              } catch (e) {
                console.log("initial_load invalidation error:", e.message);
              }
            }
          } else if (status === "COMPLETED") {
            // Free the slot time — the appointment is done, so the slot
            // becomes bookable again for another customer
            const freedSlot = await Slot.findByIdAndUpdate(
              appointment.slotId,
              {
                status: "AVAILABLE",
                appointmentId: null,
              },
              { session, new: true },
            );
            if (freedSlot) {
              delCachePattern(`branch:slots:${freedSlot.branchId}:${freedSlot.date}:*`);
              // refresh the home-screen dataset for this city too
              try {
                const branchForCache = await Branch.findById(freedSlot.branchId)
                  .select("citySlug")
                  .lean();
                if (branchForCache?.citySlug) {
                  delCachePattern(`initial_load:${branchForCache.citySlug}:*`);
                }
              } catch (e) {
                console.log("initial_load invalidation error:", e.message);
              }
            }
          } else if (status === "NO_SHOW") {
            // NO_SHOW is a correction recorded after COMPLETED, by which point
            // the slot was already freed. The time has passed, so the slot stays
            // AVAILABLE — the nightly cron marks past AVAILABLE slots as COMPLETED.
            // Do nothing to the slot.
          } else if (["CONFIRMED", "PENDING", "IN_PROGRESS"].includes(status)) {
            await Slot.findByIdAndUpdate(
              appointment.slotId,
              {
                status: "BOOKED",
                appointmentId: appointment._id,
              },
              { session },
            );
          }
        } else if (
          appointment.staffId &&
          appointment.date &&
          appointment.startTime
        ) {
          if (status === "CANCELLED") {
            await Slot.updateMany(
              {
                staffId: appointment.staffId,
                date: appointment.date,
                startTime: appointment.startTime,
              },
              { status: "AVAILABLE", appointmentId: null },
              { session },
            );
            if (appointment.branchId && appointment.date) {
              delCachePattern(`branch:slots:${appointment.branchId}:${appointment.date}:*`);
            }
          } else if (status === "COMPLETED") {
            await Slot.updateMany(
              {
                staffId: appointment.staffId,
                date: appointment.date,
                startTime: appointment.startTime,
              },
              { status: "AVAILABLE", appointmentId: null },
              { session },
            );
          } else if (["CONFIRMED", "PENDING", "IN_PROGRESS"].includes(status)) {
            await Slot.updateMany(
              {
                staffId: appointment.staffId,
                date: appointment.date,
                startTime: appointment.startTime,
              },
              { status: "BOOKED", appointmentId: appointment._id },
              { session },
            );
          }
        }

        // update status — pre-save hook records it in statusHistory
        appointment.status = status;
        appointment.statusHistory.push({
          status,
          changedBy: userId,
          changedAt: new Date(),
          note: note || null,
        });

        await appointment.save({ session });
      });
    } finally {
      session.endSession();
    }

    // Emit real-time WebSocket event to customer and branch
    try {
      const io = getIO();
      if (io) {
        const customerIdStr = String(appointment.customerId?._id || appointment.customerId);
        const branchIdStr = String(appointment.branchId?._id || appointment.branchId);
        const salonIdStr = String(appointment.salonId?._id || appointment.salonId);

        console.log(`⚡ [SOCKET EMIT] Emitting status change (${appointment.status}) to room customer_${customerIdStr} & branch_${branchIdStr}`);

        const eventPayload = {
          appointmentId: appointment._id,
          status: appointment.status,
          appointment,
        };

        io.to(`customer_${customerIdStr}`).emit("appointment_status_changed", eventPayload);
        io.to(`branch_${branchIdStr}`).emit("appointment_updated", eventPayload);
        if (salonIdStr) {
          io.to(`salon_${salonIdStr}`).emit("appointment_updated", eventPayload);
        }
      }
    } catch (e) {
      console.log("WebSocket emit error:", e.message);
    }

    // notify the customer via push — but not when THEY were the one who changed it
    try {
      if (role !== "customer") {
        const push = buildStatusPush(
          appointment,
          appointment.serviceId?.name || "appointment",
          appointment.salonId?.name || "Salon",
        );
        if (push) await sendPushToUser(push);
      }
    } catch (e) {
      console.log("Push notification error:", e.message);
    }

    // send status change email to customer (skip IN_PROGRESS)
    try {
      if (appointment.status !== "IN_PROGRESS") {
        const fullAppt = await Appointment.findById(appointment._id)
          .populate("customerId", "name email")
          .populate("salonId", "name")
          .populate("serviceId", "name")
          .populate("slotId", "date startTime endTime")
          .lean();

        const custUser = fullAppt?.customerId;
        const salonName = fullAppt?.salonId?.name || "Salon";
        const serviceName = fullAppt?.serviceId?.name || "Service";
        const apptDate = fullAppt?.date || fullAppt?.slotId?.date || "";
        const apptTime = fullAppt?.startTime || fullAppt?.slotId?.startTime || "";

        if (custUser?.email) {
          await sendAppointmentStatusEmail({
            to: custUser.email,
            customerName: custUser.name,
            status: appointment.status,
            salonName,
            serviceName,
            date: apptDate,
            time: apptTime,
            bookingId: appointment._id,
            cancellationReason: appointment.cancellation?.reason || note,
          });

          // Track email dispatch on appointment document
          const logType = appointment.status === "CONFIRMED" ? "APPOINTMENT_ACCEPTED" : appointment.status === "COMPLETED" ? "THANK_YOU_SENT" : `STATUS_${appointment.status}`;
          await Appointment.findByIdAndUpdate(appointment._id, {
            emailSent: true,
            lastEmailSentAt: new Date(),
            $push: {
              emailLogs: {
                type: logType,
                sentTo: custUser.email,
                sentAt: new Date(),
              },
            },
          });
        }
      }
    } catch (e) {
      console.log("Email dispatch error:", e.message);
    }

    // save persistent in-app notification for customer
    try {
      const custId = appointment.customerId?._id || appointment.customerId;
      const salonName = appointment.salonId?.name || "Salon";
      const serviceName = appointment.serviceId?.name || "Service";

      await notifyUser({
        recipientId: custId,
        type: `appointment.${appointment.status.toLowerCase()}`,
        title: `Appointment ${appointment.status}`,
        body: `Your ${serviceName} booking at ${salonName} status has been updated to ${appointment.status}.`,
        data: { appointmentId: appointment._id, status: appointment.status },
        branchId: appointment.branchId?._id || appointment.branchId,
        salonId: appointment.salonId?._id || appointment.salonId,
      });
    } catch (e) {
      console.log("In-app notification save error:", e.message);
    }

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
    const userId = req.user.userId || req.user._id;

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

    if (appointment.rating && appointment.rating.score) {
      return next(new AppError("Appointment already rated", 400));
    }

    const numScore = Number(score);
    if (!numScore || numScore < 1 || numScore > 5) {
      return next(new AppError("Score must be between 1 and 5", 400));
    }

    appointment.rating = {
      score: numScore,
      review: review ? String(review).trim() : null,
      ratedAt: new Date(),
    };

    await appointment.save();

    // Invalidate public browse review caches
    try {
      if (appointment.salonId) delCachePattern(`salon:reviews:${appointment.salonId}*`);
      if (appointment.branchId) delCachePattern(`branch:reviews:${appointment.branchId}*`);
    } catch (cacheErr) {
      console.log("Cache clear error on rating submission:", cacheErr.message);
    }

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
    const appointmentId = req.params.appointmentId || req.params.id;
    const { newSlotId, slotId, newServiceId, newStaffId, reason } = req.body;
    const targetSlotId = newSlotId || slotId;
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
    if (!targetSlotId) {
      return next(new AppError("New slot is required", 400));
    }

    // make sure new slot is different from current
    if (targetSlotId === appointment.slotId.toString()) {
      return next(
        new AppError("New slot must be different from current slot", 400),
      );
    }

    const newSlot = await Slot.findById(targetSlotId);
    if (!newSlot) {
      return next(new AppError("New slot not found", 404));
    }

    if (newSlot.status !== "AVAILABLE") {
      return next(new AppError("Selected slot is not available", 400));
    }

    // staff availability — a slot may be marked AVAILABLE but the staff
    // is on leave for this window; never allow a hard conflict
    const newStaffLeaves = await getActiveStaffLeaves({
      staffId: newSlot.staffId,
      startDate: newSlot.date,
      endDate: newSlot.date,
    });
    if (
      newStaffLeaves.length > 0 &&
      slotOverlapsLeave(newSlot.startTime, newSlot.endTime, newStaffLeaves, newSlot.date)
    ) {
      return next(
        new AppError(
          "Selected staff member is not available at that time. Please pick another slot.",
          400,
        ),
      );
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
    // Step 5 — determine final staff & service
    // --------------------------------
    let finalServiceId = appointment.serviceId;
    let finalStaffId = newSlot.staffId;
    let finalPrice = appointment.pricePaid;

    if ((role === "manager" || role === "owner") && newServiceId) {
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

    // verify new staff can perform the service
    const serviceToCheck = await Service.findById(finalServiceId);
    if (
      serviceToCheck &&
      serviceToCheck.eligibleStaff &&
      serviceToCheck.eligibleStaff.length > 0 &&
      !serviceToCheck.eligibleStaff
        .map((id) => id.toString())
        .includes(finalStaffId.toString())
    ) {
      return next(
        new AppError("Selected staff cannot perform this service", 400),
      );
    }

    // --------------------------------
    // Step 7 — atomic slot swap inside a transaction
    // book new slot + free old slot + update appointment atomically
    // if ANY step fails, ALL steps roll back
    // --------------------------------
    const oldSlotInfo = {
      slotId: appointment.slotId,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    };

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // atomically book new slot — prevents double booking
        const bookedNewSlot = await Slot.findOneAndUpdate(
          { _id: targetSlotId, status: "AVAILABLE" },
          { status: "BOOKED", appointmentId: appointment._id },
          { new: true, session },
        );

        if (!bookedNewSlot) {
          throw new AppError(
            "This slot was just booked by someone else. Please choose another.",
            400,
          );
        }

        // free the old slot
        await Slot.findByIdAndUpdate(
          appointment.slotId,
          { status: "AVAILABLE", appointmentId: null },
          { session },
        );

        // --------------------------------
        // Step 8 — update appointment
        // --------------------------------
        appointment.slotId = targetSlotId;
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

        await appointment.save({ session });
      });
    } finally {
      session.endSession();
    }

    // Emit real-time WebSocket event for rescheduled appointment
    try {
      const io = getIO();
      if (io) {
        const customerIdStr = String(appointment.customerId?._id || appointment.customerId);
        const branchIdStr = String(appointment.branchId?._id || appointment.branchId);
        const salonIdStr = String(appointment.salonId?._id || appointment.salonId);

        const populatedAppt = await Appointment.findById(appointment._id)
          .populate("customerId", "name email phone")
          .populate("serviceId", "name durationMinutes price")
          .populate("staffId", "name")
          .populate("branchId", "name")
          .populate("salonId", "name");

        const eventData = {
          appointmentId: appointment._id,
          status: appointment.status,
          appointment: populatedAppt || appointment,
        };

        console.log(`⚡ [SOCKET EMIT] Emitting rescheduled appointment (${appointment._id}) to branch_${branchIdStr}`);
        io.to(`customer_${customerIdStr}`).emit("appointment_updated", eventData);
        io.to(`customer_${customerIdStr}`).emit("appointment_status_changed", eventData);
        io.to(`branch_${branchIdStr}`).emit("appointment_updated", eventData);
        if (salonIdStr) {
          io.to(`salon_${salonIdStr}`).emit("appointment_updated", eventData);
        }
      }
    } catch (e) {
      console.log("WebSocket emit error:", e.message);
    }

    // notify the customer their appointment was moved
    try {
      const reschedulePush = {
        userId: appointment.customerId?._id || appointment.customerId,
        title: "Appointment rescheduled",
        body: `Your appointment moved to ${newSlot.date} at ${newSlot.startTime}. Awaiting confirmation.`,
        data: {
          appointmentId: String(appointment._id),
          status: appointment.status,
          type: "appointment.status",
        },
      };
      await sendPushToUser(reschedulePush);
    } catch (e) {
      console.log("Push notification error:", e.message);
    }

    // send reschedule email to customer
    try {
      const custId = appointment.customerId?._id || appointment.customerId;
      const custUser = await User.findById(custId).select("name email").lean();
      const salonDoc = await Salon.findById(appointment.salonId).select("name").lean();
      const serviceDoc = await Service.findById(appointment.serviceId).select("name").lean();

      if (custUser?.email) {
        await sendRescheduleConfirmationEmail({
          to: custUser.email,
          customerName: custUser.name,
          salonName: salonDoc?.name || "Salon",
          serviceName: serviceDoc?.name || "Service",
          oldDate: oldSlotInfo.date || "Previous date",
          oldTime: oldSlotInfo.startTime || "Previous time",
          newDate: newSlot.date,
          newTime: newSlot.startTime,
          bookingId: appointment._id,
        });
      }
    } catch (e) {
      console.log("Email dispatch error:", e.message);
    }

    // save persistent in-app notification for customer
    try {
      const custId = appointment.customerId?._id || appointment.customerId;
      await notifyUser({
        recipientId: custId,
        type: "appointment.rescheduled",
        title: "Appointment Rescheduled",
        body: `Your appointment moved to ${newSlot.date} at ${newSlot.startTime}.`,
        data: { appointmentId: appointment._id, status: appointment.status },
        branchId: appointment.branchId?._id || appointment.branchId,
        salonId: appointment.salonId?._id || appointment.salonId,
      });
    } catch (e) {
      console.log("In-app notification save error:", e.message);
    }

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
