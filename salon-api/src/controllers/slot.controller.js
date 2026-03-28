const Slot = require("../models/slot.model");
const Branch = require("../models/branch.model");
const User = require("../models/user.model");
const Appointment = require("../models/appointment.model");
const Role = require("../models/role.model");
const AppError = require("../utils/AppError");
const { generateDaySlots } = require("../utils/slotGenerator");
const dayjs = require("dayjs");

// ================================
// POST /api/v1/branches/:branchId/slots/generate
// owner or manager — generate slots for a staff member for a date range
// ================================
const generateSlots = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { staffId, startDate, endDate } = req.body;
    const { salonId, branchId: userBranchId, role } = req.user;

    // scope check
    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    // verify branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    // verify staff belongs to this branch
    const staff = await User.findOne({ _id: staffId, branchId });
    if (!staff) {
      return next(new AppError("Staff member not found in this branch", 404));
    }

    // validate dates
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) {
      return next(new AppError("Invalid date format. Use YYYY-MM-DD", 400));
    }

    if (end.isBefore(start)) {
      return next(new AppError("End date must be after start date", 400));
    }

    // max 30 days at a time to prevent abuse
    if (end.diff(start, "day") > 30) {
      return next(
        new AppError("Cannot generate more than 30 days of slots at once", 400),
      );
    }

    // generate slots for each day in range
    const slotsToInsert = [];
    let current = start;

    while (current.isBefore(end.add(1, "day"))) {
      const date = current.format("YYYY-MM-DD");
      const daySlots = generateDaySlots(branch, date);

      daySlots.forEach((slot) => {
        slotsToInsert.push({
          branchId,
          salonId: branch.salonId,
          staffId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "AVAILABLE",
        });
      });

      current = current.add(1, "day");
    }

    if (slotsToInsert.length === 0) {
      return next(
        new AppError("No slots generated. Check branch working hours.", 400),
      );
    }

    // insertMany with ordered:false continues even if some slots already exist
    // this prevents duplicate slot errors from stopping the whole batch
    let inserted = 0;
    let skipped = 0;

    try {
      const result = await Slot.insertMany(slotsToInsert, { ordered: false });
      inserted = result.length;
    } catch (err) {
      // err.insertedDocs has successful ones, err.writeErrors has duplicates
      inserted = err.insertedDocs ? err.insertedDocs.length : 0;
      skipped = err.writeErrors ? err.writeErrors.length : 0;
    }

    res.status(201).json({
      success: true,
      message: `Slot generation complete`,
      data: {
        inserted,
        skipped,
        total: slotsToInsert.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/branches/:branchId/slots
// get available slots for a branch on a date
// customers use this to see what's bookable
// ================================
const getSlots = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { date, staffId, status } = req.query;

    if (!date) {
      return next(new AppError("Date is required. Use ?date=YYYY-MM-DD", 400));
    }

    const filter = { branchId, date };

    // optionally filter by staff
    if (staffId) filter.staffId = staffId;

    // optionally filter by status — default to AVAILABLE for customers
    filter.status = status || "AVAILABLE";

    const slots = await Slot.find(filter)
      .populate("staffId", "name")
      .sort({ startTime: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { slots },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/branches/:branchId/slots/:slotId/block
// manager or staff — block a slot manually
// e.g. lunch break, leave
// ================================
const blockSlot = async (req, res, next) => {
  try {
    const { branchId, slotId } = req.params;
    const { reason } = req.body;
    const { userId, branchId: userBranchId, role } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const slot = await Slot.findOne({ _id: slotId, branchId });
    if (!slot) {
      return next(new AppError("Slot not found", 404));
    }

    if (slot.status === "BOOKED") {
      return next(
        new AppError("Cannot block a slot that is already booked", 400),
      );
    }

    slot.status = "BLOCKED";
    slot.blockReason = reason || "Blocked by staff";
    await slot.save();

    res.status(200).json({
      success: true,
      message: "Slot blocked successfully",
      data: { slot },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/branches/:branchId/slots/block-check
// manager checks what will be affected before blocking
// ================================
const blockCheck = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { staffId, date, startDate, endDate, slotIds } = req.body;
    const { branchId: userBranchId, role } = req.user;

    // scope check
    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(
        new AppError("Access denied. This branch is not assigned to you.", 403),
      );
    }

    // build slot filter based on what was sent
    let filter = { branchId };

    if (slotIds && slotIds.length > 0) {
      // specific slots
      filter._id = { $in: slotIds };
    } else if (date) {
      // single day
      filter.staffId = staffId;
      filter.date = date;
    } else if (startDate && endDate) {
      // date range
      filter.staffId = staffId;
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      return next(
        new AppError("Provide date, startDate+endDate, or slotIds", 400),
      );
    }

    // exclude already blocked slots
    filter.status = { $in: ["AVAILABLE", "BOOKED"] };

    const slots = await Slot.find(filter).populate("appointmentId").lean();

    // separate available and booked
    const availableSlots = slots.filter((s) => s.status === "AVAILABLE");
    const bookedSlots = slots.filter((s) => s.status === "BOOKED");

    // get appointment details for booked slots
    const bookedDetails = await Promise.all(
      bookedSlots.map(async (slot) => {
        const appointment = await Appointment.findById(slot.appointmentId)
          .populate("customerId", "name phone email")
          .populate("serviceId", "name")
          .lean();

        return {
          slotId: slot._id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          appointment: appointment
            ? {
                appointmentId: appointment._id,
                customerName: appointment.customerId?.name,
                customerPhone: appointment.customerId?.phone,
                customerEmail: appointment.customerId?.email,
                serviceName: appointment.serviceId?.name,
                status: appointment.status,
              }
            : null,
        };
      }),
    );

    // get available staff in this branch for reassignment suggestion
    const Role = require("../models/role.model");
    const staffRole = await Role.findOne({ name: "staff" }).lean();
    const availableStaff = await User.find({
      branchId,
      _id: { $ne: staffId }, // exclude the staff being blocked
      role: staffRole._id,
      isActive: true,
    })
      .select("name email")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSlots: slots.length,
          availableSlots: availableSlots.length,
          bookedSlots: bookedSlots.length,
        },
        bookedSlots: bookedDetails,
        availableStaffForReassignment: availableStaff,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/branches/:branchId/slots/block-bulk
// manager confirms blocking after checking
// handles booked slots by cancelling or reassigning
// ================================
const blockBulk = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const {
      staffId,
      date,
      startDate,
      endDate,
      slotIds,
      reason,
      bookedSlotAction, // "cancel" or "reassign"
      reassignStaffId, // required if bookedSlotAction === "reassign"
    } = req.body;
    const { branchId: userBranchId, role, userId } = req.user;

    // scope check
    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(
        new AppError("Access denied. This branch is not assigned to you.", 403),
      );
    }

    // reason is required
    if (!reason || reason.trim() === "") {
      return next(new AppError("Reason is required for blocking slots", 400));
    }

    // validate reassign
    if (bookedSlotAction === "reassign" && !reassignStaffId) {
      return next(
        new AppError(
          "reassignStaffId is required when action is reassign",
          400,
        ),
      );
    }

    // if reassigning — verify new staff exists in this branch
    let newStaff = null;
    if (bookedSlotAction === "reassign") {
      newStaff = await User.findOne({
        _id: reassignStaffId,
        branchId,
        isActive: true,
      });
      if (!newStaff) {
        return next(
          new AppError("Reassign staff not found in this branch", 404),
        );
      }
    }

    // build filter same as block-check
    let filter = { branchId };

    if (slotIds && slotIds.length > 0) {
      filter._id = { $in: slotIds };
    } else if (date) {
      filter.staffId = staffId;
      filter.date = date;
    } else if (startDate && endDate) {
      filter.staffId = staffId;
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      return next(
        new AppError("Provide date, startDate+endDate, or slotIds", 400),
      );
    }

    filter.status = { $in: ["AVAILABLE", "BOOKED"] };

    const slots = await Slot.find(filter).lean();

    if (slots.length === 0) {
      return next(new AppError("No slots found to block", 404));
    }

    const bookedSlots = slots.filter((s) => s.status === "BOOKED");
    const availableSlots = slots.filter((s) => s.status === "AVAILABLE");

    let cancelledCount = 0;
    let reassignedCount = 0;
    const errors = [];

    // --------------------------------
    // Handle booked slots
    // --------------------------------
    for (const slot of bookedSlots) {
      try {
        const appointment = await Appointment.findById(slot.appointmentId);
        if (!appointment) continue;

        if (bookedSlotAction === "cancel") {
          // cancel the appointment
          appointment.status = "CANCELLED";
          appointment.cancellation = {
            cancelledBy: userId,
            reason: `Staff unavailable: ${reason}`,
            cancelledAt: new Date(),
          };
          appointment.statusHistory.push({
            status: "CANCELLED",
            changedBy: userId,
            changedAt: new Date(),
            note: `Staff unavailable: ${reason}`,
          });
          await appointment.save();

          // free the slot then block it
          await Slot.findByIdAndUpdate(slot._id, {
            status: "BLOCKED",
            blockReason: reason,
            appointmentId: null,
          });

          cancelledCount++;
        } else if (bookedSlotAction === "reassign") {
          // find an available slot for new staff at same date+time
          const newSlot = await Slot.findOne({
            branchId,
            staffId: reassignStaffId,
            date: slot.date,
            startTime: slot.startTime,
            status: "AVAILABLE",
          });

          if (!newSlot) {
            // new staff has no slot at this time — can't reassign
            errors.push({
              slotId: slot._id,
              date: slot.date,
              startTime: slot.startTime,
              error: `${newStaff.name} has no available slot at ${slot.startTime} on ${slot.date}`,
            });
            continue;
          }

          // update appointment to new staff and slot
          appointment.staffId = reassignStaffId;
          appointment.slotId = newSlot._id;
          appointment.status = "PENDING"; // reset to pending — needs reconfirmation
          appointment.statusHistory.push({
            status: "PENDING",
            changedBy: userId,
            changedAt: new Date(),
            note: `Reassigned from ${slot.startTime} to ${newStaff.name} due to: ${reason}`,
          });
          await appointment.save();

          // book new staff slot
          await Slot.findByIdAndUpdate(newSlot._id, {
            status: "BOOKED",
            appointmentId: appointment._id,
          });

          // block old slot
          await Slot.findByIdAndUpdate(slot._id, {
            status: "BLOCKED",
            blockReason: reason,
            appointmentId: null,
          });

          reassignedCount++;
        }
      } catch (err) {
        errors.push({
          slotId: slot._id,
          error: err.message,
        });
      }
    }

    // --------------------------------
    // Block all available slots in bulk
    // --------------------------------
    const availableSlotIds = availableSlots.map((s) => s._id);
    await Slot.updateMany(
      { _id: { $in: availableSlotIds } },
      { status: "BLOCKED", blockReason: reason },
    );

    res.status(200).json({
      success: true,
      message: "Slots blocked successfully",
      data: {
        summary: {
          totalSlots: slots.length,
          availableBlocked: availableSlots.length,
          appointmentsCancelled: cancelledCount,
          appointmentsReassigned: reassignedCount,
          errors: errors.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/branches/:branchId/slots/unblock-bulk
// manager unblocks multiple slots at once
// ================================
const unblockBulk = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { staffId, date, startDate, endDate, slotIds } = req.body;
    const { branchId: userBranchId, role } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    let filter = { branchId, status: "BLOCKED" };

    if (slotIds && slotIds.length > 0) {
      filter._id = { $in: slotIds };
    } else if (date) {
      filter.staffId = staffId;
      filter.date = date;
    } else if (startDate && endDate) {
      filter.staffId = staffId;
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      return next(
        new AppError("Provide date, startDate+endDate, or slotIds", 400),
      );
    }

    const result = await Slot.updateMany(filter, {
      status: "AVAILABLE",
      blockReason: null,
    });

    res.status(200).json({
      success: true,
      message: "Slots unblocked successfully",
      data: {
        unblockedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/branches/:branchId/slots/:slotId/unblock
// manager — unblock a slot
// ================================
const unblockSlot = async (req, res, next) => {
  try {
    const { branchId, slotId } = req.params;
    const { branchId: userBranchId, role } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const slot = await Slot.findOne({ _id: slotId, branchId });
    if (!slot) {
      return next(new AppError("Slot not found", 404));
    }

    if (slot.status !== "BLOCKED") {
      return next(new AppError("Slot is not blocked", 400));
    }

    slot.status = "AVAILABLE";
    slot.blockReason = null;
    await slot.save();

    res.status(200).json({
      success: true,
      message: "Slot unblocked successfully",
      data: { slot },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSlots,
  getSlots,
  blockSlot,
  unblockSlot,
  blockCheck,
  blockBulk,
  unblockBulk,
};
