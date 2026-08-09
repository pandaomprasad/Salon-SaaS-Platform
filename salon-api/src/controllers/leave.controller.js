const StaffLeave = require("../models/staffLeave.model");
const User = require("../models/user.model");
const Branch = require("../models/branch.model");
const Slot = require("../models/slot.model");
const {
  toDateRange,
  findOverlappingLeaves,
} = require("../utils/staffLeaveHelper");
const AppError = require("../utils/AppError");
const dayjs = require("dayjs");
const { delCachePattern } = require("../services/cache.service");
const {
  notifyUser,
  notifyLeaveRequestToManagers,
} = require("../services/notification.service");

// human-readable coverage of a leave for notification text
const leaveCoverageText = (leave) => {
  if (leave.type === "SINGLE") return leave.date || "";
  if (leave.type === "RECURRING") {
    const days = (leave.weekdays || [])
      .map((w) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][w])
      .join(", ");
    return `${days} weekly`;
  }
  return `${leave.startDate} → ${leave.endDate}`;
};

// ================================
// Shared helpers
// ================================

// normalize request body into leave model fields
const buildLeaveData = (body) => {
  const data = {
    reason: body.reason || null,
  };

  // no type given → infer from provided fields
  let type = body.type;
  if (!type) {
    if (body.date) type = "SINGLE";
    else if (body.weekdays?.length) type = "RECURRING";
    else type = "RANGE";
  }
  data.type = type;

  if (type === "SINGLE") {
    data.date = body.date;
    data.startDate = null;
    data.endDate = null;
  } else {
    data.startDate = body.startDate || null;
    data.endDate = body.endDate || null;
    data.date = null;
  }

  data.weekdays = type === "RECURRING" ? body.weekdays || [] : [];

  // time window — only meaningful when not full day
  const hasWindow = Boolean(body.startTime || body.endTime);
  data.allDay = !hasWindow;
  data.startTime = hasWindow ? body.startTime : null;
  data.endTime = hasWindow ? body.endTime : null;

  return data;
};

// validate leave definition, or throw AppError
const validateValidLeave = (data) => {
  const { type } = data;

  if (type === "SINGLE") {
    if (!data.date) throw new AppError("date is required for SINGLE leaves", 400);
  } else if (type === "RANGE") {
    if (!data.startDate || !data.endDate) {
      throw new AppError(
        "Both startDate and endDate are required for RANGE leaves",
        400,
      );
    }
    if (data.endDate < data.startDate) {
      throw new AppError("endDate must be on or after startDate", 400);
    }
  } else if (type === "RECURRING") {
    if (!data.startDate || !data.endDate) {
      throw new AppError(
        "Both startDate and endDate are required for RECURRING leaves",
        400,
      );
    }
    if (!data.weekdays || data.weekdays.length === 0) {
      throw new AppError(
        "At least one weekday is required for RECURRING leaves",
        400,
      );
    }
  } else {
    throw new AppError("type must be one of SINGLE, RANGE, RECURRING", 400);
  }

  if (!data.allDay) {
    if (!data.startTime || !data.endTime) {
      throw new AppError(
        "Both startTime and endTime are required when not all-day",
        400,
      );
    }
    if (data.endTime <= data.startTime) {
      throw new AppError("endTime must be after startTime", 400);
    }
  }
};

// verify the staff member belongs to the branch
const assertStaffInBranch = async ({ staffId, branchId, salonId }) => {
  const staff = await User.findOne({
    _id: staffId,
    branchId,
    salonId,
    isActive: true,
  }).select("_id name");
  if (!staff) throw new AppError("Staff member not found in this branch", 404);
  return staff;
};

// invalidate the branch slot caches so customers see the change immediately
const invalidateBranchSlotsCache = (branchId) => {
  delCachePattern(`branch:slots:${branchId}:*`);
};

// ================================
// POST /api/v1/branches/:branchId/staff/:staffId/leaves
// create a leave for a staff member
// ================================
const createLeave = async (req, res, next) => {
  try {
    const { branchId, staffId } = req.params;
    const { role, salonId, userId, branchId: userBranchId } = req.user;

    // scope — manager can only manage their own branch
    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const branch = await Branch.findOne({
      _id: branchId,
      ...(role === "owner" ? { salonId } : {}),
    });
    if (!branch) return next(new AppError("Branch not found", 404));

    await assertStaffInBranch({ staffId, branchId, salonId });

    let data;
    try {
      data = buildLeaveData(req.body);
      validateValidLeave(data);
    } catch (err) {
      return next(err);
    }

    // collision detection — reject if an active leave overlaps
    const existing = await StaffLeave.find({ staffId, isActive: true }).lean();
    const overlaps = findOverlappingLeaves(existing, data);
    if (overlaps.length > 0) {
      return next(new AppError("Overlaps an existing active leave", 409));
    }

    const leave = await StaffLeave.create({
      ...data,
      staffId,
      branchId,
      salonId: branch.salonId,
      createdBy: userId,
      isActive: true,
      // created directly by an owner/manager → approved immediately
      status: "APPROVED",
      reviewedBy: userId,
      reviewedAt: new Date(),
    });

    // block existing generated slots that fall inside the leave
    await applyLeaveToExistingSlots(leave);

    invalidateBranchSlotsCache(branchId);

    res.status(201).json({ success: true, data: { leave } });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/branches/:branchId/staff/:staffId/leaves
// ================================
const getStaffLeaves = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { role, salonId, userId, branchId: userBranchId } = req.user;

    // staff can only view their own leaves
    if (role === "staff") {
      if (staffId !== userId.toString()) {
        return next(new AppError("Access denied.", 403));
      }
    }

    const filter = { staffId };
    if (role === "manager") filter.branchId = userBranchId;
    else if (role === "owner") filter.salonId = salonId;

    if (req.query.includePast !== "true") {
      filter.isActive = true;
    }

    const leaves = await StaffLeave.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, data: { leaves } });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/branches/:branchId/staff/:staffId/leaves/:leaveId
// ================================
const getLeave = async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    const leave = await StaffLeave.findById(leaveId).lean();
    if (!leave) return next(new AppError("Leave not found", 404));

    res.status(200).json({ success: true, data: { leave } });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/branches/:branchId/staff/:staffId/leaves/:leaveId
// update a leave (dates/window/reason)
// ================================
const updateLeave = async (req, res, next) => {
  try {
    const { branchId, staffId, leaveId } = req.params;
    const { role, salonId, userId, branchId: userBranchId } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const leave = await StaffLeave.findOne({ _id: leaveId, staffId, branchId });
    if (!leave) return next(new AppError("Leave not found", 404));

    const branch = await Branch.findOne({
      _id: branchId,
      ...(role === "owner" ? { salonId } : {}),
    });
    if (!branch) return next(new AppError("Branch not found", 404));

    let data;
    try {
      data = buildLeaveData(req.body);
      validateValidLeave(data);
    } catch (err) {
      return next(err);
    }

    // collision detection against other active leaves
    const existing = await StaffLeave.find({
      staffId,
      isActive: true,
      _id: { $ne: leaveId },
    }).lean();
    const overlaps = findOverlappingLeaves(existing, data);
    if (overlaps.length > 0) {
      return next(new AppError("Overlaps an existing active leave", 409));
    }

    // undo slot-blocking from the old leave, then apply for the new one
    // (PENDING leaves never touch slots)
    if (leave.status === "APPROVED") {
      await revertLeaveFromExistingSlots(leave);
    }
    Object.assign(leave, data);
    await leave.save();

    if (leave.status === "APPROVED") {
      await applyLeaveToExistingSlots(leave);
      invalidateBranchSlotsCache(branchId);
    }

    res.status(200).json({ success: true, data: { leave } });
  } catch (error) {
    next(error);
  }
};

// ================================
// DELETE /api/v1/branches/:branchId/staff/:staffId/leaves/:leaveId
// cancel a leave — slot blocking is released
// ================================
const deleteLeave = async (req, res, next) => {
  try {
    const { branchId, staffId, leaveId } = req.params;
    const { role, salonId, userId, branchId: userBranchId } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const leave = await StaffLeave.findOne({
      _id: leaveId,
      staffId,
      isActive: true,
    });
    if (!leave) return next(new AppError("Leave not found or already cancelled", 404));

    // revert slot blocking only if the leave had taken effect
    if (leave.status === "APPROVED") {
      await revertLeaveFromExistingSlots(leave);
    }

    leave.isActive = false;
    leave.cancelledBy = userId;
    leave.cancelledAt = new Date();
    await leave.save();

    invalidateBranchSlotsCache(branchId);

    res.status(200).json({
      success: true,
      message: "Leave cancelled successfully",
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/branches/:branchId/staff/:staffId/leaves/:leaveId/approve
// manager/owner approves a PENDING staff request — slots get blocked
// and the leave takes effect immediately
// ================================
const approveLeave = async (req, res, next) => {
  try {
    const { branchId, staffId, leaveId } = req.params;
    const { role, salonId, userId, branchId: userBranchId } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const leave = await StaffLeave.findOne({ _id: leaveId, staffId, branchId });
    if (!leave) return next(new AppError("Leave not found", 404));

    if (leave.status !== "PENDING") {
      return next(new AppError("Only pending leaves can be approved", 400));
    }

    leave.status = "APPROVED";
    leave.reviewedBy = userId;
    leave.reviewedAt = new Date();
    leave.rejectionReason = null;
    await leave.save();

    // approval makes the leave real → block slots now
    await applyLeaveToExistingSlots(leave);
    invalidateBranchSlotsCache(branchId);

    // notify the staff member that their leave is approved
    await notifyUser({
      recipientId: leave.staffId,
      type: "leave.approved",
      title: "Leave approved",
      body: `Your leave on ${leaveCoverageText(leave)} has been approved${
        leave.allDay ? "" : ` (${leave.startTime}–${leave.endTime})`
      }. Your slots are now blocked.`,
      data: { leaveId: leave._id, staffId: leave.staffId, branchId },
      branchId,
      salonId,
    });

    res.status(200).json({
      success: true,
      message: "Leave approved — slots blocked",
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/branches/:branchId/staff/:staffId/leaves/:leaveId/reject
// manager/owner rejects a PENDING staff request (optional reason)
// ================================
const rejectLeave = async (req, res, next) => {
  try {
    const { branchId, staffId, leaveId } = req.params;
    const { role, salonId, userId, branchId: userBranchId } = req.user;

    if (role === "manager" && branchId !== userBranchId.toString()) {
      return next(new AppError("Access denied.", 403));
    }

    const leave = await StaffLeave.findOne({ _id: leaveId, staffId, branchId });
    if (!leave) return next(new AppError("Leave not found", 404));

    if (leave.status !== "PENDING") {
      return next(new AppError("Only pending leaves can be rejected", 400));
    }

    leave.status = "REJECTED";
    leave.reviewedBy = userId;
    leave.reviewedAt = new Date();
    leave.rejectionReason = req.body.rejectionReason || null;
    await leave.save();

    // rejected leaves never blocked slots, so nothing to revert

    // notify the staff member that their leave was rejected
    await notifyUser({
      recipientId: leave.staffId,
      type: "leave.rejected",
      title: "Leave request rejected",
      body: `Your leave on ${leaveCoverageText(leave)} was rejected${
        leave.rejectionReason ? `: ${leave.rejectionReason}` : ""
      }`,
      data: { leaveId: leave._id, staffId: leave.staffId, branchId },
      branchId,
      salonId,
    });

    res.status(200).json({
      success: true,
      message: "Leave request rejected",
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};
// mark existing AVAILABLE slots as BLOCKED on leave days/windows
// so that bookings already visible to customers disappear immediately
// ================================
const applyLeaveToExistingSlots = async (leave) => {
  const dates = datesCoveredByLeave(leave);
  if (dates.length === 0) return;

  // for all-day leaves every slot on the date is blocked; for time-window
  // leaves only slots overlapping the window are blocked. Fetch candidates
  // and filter in memory so we never block a slot outside the window.
  const slotOverlapsLeave = require("../utils/staffLeaveHelper").slotOverlapsLeave;

  const candidateSlots = await Slot.find({
    staffId: leave.staffId,
    branchId: leave.branchId,
    date: { $in: dates },
    status: "AVAILABLE",
  }).select("_id date startTime endTime");

  const toBlock = candidateSlots.filter((slot) =>
    slotOverlapsLeave(slot.startTime, slot.endTime, [leave], slot.date),
  );

  if (toBlock.length === 0) return;

  const leaveIdTag = `leave:${leave._id.toString()}`;
  await Slot.updateMany(
    { _id: { $in: toBlock.map((s) => s._id) } },
    { status: "BLOCKED", blockReason: leaveIdTag },
  );
};

// unblock slots that this leave had blocked
// we tag each blocked slot with "leave:<leaveId>" so removal is precise
const revertLeaveFromExistingSlots = async (leave) => {
  const leaveIdTag = `leave:${leave._id.toString()}`;

  await Slot.updateMany(
    {
      staffId: leave.staffId,
      branchId: leave.branchId,
      status: "BLOCKED",
      blockReason: leaveIdTag,
    },
    { status: "AVAILABLE", blockReason: null },
  );

  // if the leave was never applied (e.g. partial failure), also cover
  // the old broad block reason from earlier versions
  const legacyTag = `leave: ${leave.reason || "Unavailable"}`;
  await Slot.updateMany(
    {
      staffId: leave.staffId,
      branchId: leave.branchId,
      status: "BLOCKED",
      blockReason: legacyTag,
    },
    { status: "AVAILABLE", blockReason: null },
  );
};

// compute which dates a leave covers (bounded to a sensible horizon)
const datesCoveredByLeave = (leave) => {
  const dates = [];
  const { start, end } = toDateRange(leave);
  if (!start || !end) return dates;

  const startD = dayjs(start);
  const endD = dayjs(end);

  if (startD.isAfter(endD)) return dates;

  let cursor = startD;
  while (cursor.isBefore(endD.add(1, "day"))) {
    // recurring leaves only fire on matching weekdays
    if (leave.type === "RECURRING") {
      if (leave.weekdays?.includes(cursor.day())) {
        dates.push(cursor.format("YYYY-MM-DD"));
      }
    } else {
      dates.push(cursor.format("YYYY-MM-DD"));
    }
    cursor = cursor.add(1, "day");
  }
  return dates;
};

// ================================
// POST /api/v1/staff/me/leaves
// staff self-service — set their own availability
// ================================
const createMyLeave = async (req, res, next) => {
  try {
    const { role, salonId, userId, branchId } = req.user;

    if (role !== "staff") {
      return next(new AppError("This endpoint is for staff members only", 403));
    }
    if (!branchId) {
      return next(new AppError("No branch assigned to your account", 400));
    }

    const branch = await Branch.findOne({ _id: branchId });
    if (!branch) return next(new AppError("Branch not found", 404));

    let data;
    try {
      data = buildLeaveData(req.body);
      validateValidLeave(data);
    } catch (err) {
      return next(err);
    }

    // collision detection — reject if an active leave overlaps
    const existing = await StaffLeave.find({
      staffId: userId,
      isActive: true,
    }).lean();
    const overlaps = findOverlappingLeaves(existing, data);
    if (overlaps.length > 0) {
      return next(new AppError("Overlaps an existing active leave", 409));
    }

    // staff self-service → PENDING request. Does NOT block slots yet —
    // the manager/owner must approve it first (approveLeave applies
    // the slot blocking and cache invalidation).
    const leave = await StaffLeave.create({
      ...data,
      staffId: userId,
      branchId,
      salonId: branch.salonId,
      createdBy: userId,
      isActive: true,
      status: "PENDING",
    });

    // notify branch managers + salon owner — a leave request needs approval
    await notifyLeaveRequestToManagers({
      branchId,
      salonId: branch.salonId,
      title: `Leave request from ${req.user.name}`,
      body: `Requested ${leaveCoverageText(leave)}${
        leave.allDay ? "" : ` (${leave.startTime}–${leave.endTime})`
      } — awaiting your approval`,
      data: { leaveId: leave._id, staffId: userId, branchId },
    });

    res.status(201).json({ success: true, data: { leave } });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/staff/me/leaves
// staff self-service — view their own leaves
// ================================
const getMyLeaves = async (req, res, next) => {
  try {
    const { role, userId, branchId } = req.user;

    if (role !== "staff") {
      return next(new AppError("This endpoint is for staff members only", 403));
    }

    const filter = { staffId: userId, branchId };
    if (req.query.includePast !== "true") {
      filter.isActive = true;
    }

    const leaves = await StaffLeave.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, data: { leaves } });
  } catch (error) {
    next(error);
  }
};

// ================================
// DELETE /api/v1/staff/me/leaves/:leaveId
// staff self-service — cancel a leave they created
// ================================
const cancelMyLeave = async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    const { role, userId, branchId } = req.user;

    if (role !== "staff") {
      return next(new AppError("This endpoint is for staff members only", 403));
    }

    const leave = await StaffLeave.findOne({
      _id: leaveId,
      staffId: userId,
      isActive: true,
    });
    if (!leave) return next(new AppError("Leave not found", 404));

    if (leave.status === "APPROVED") {
      await revertLeaveFromExistingSlots(leave);
    }

    leave.isActive = false;
    leave.cancelledBy = userId;
    leave.cancelledAt = new Date();
    await leave.save();

    invalidateBranchSlotsCache(branchId);

    res.status(200).json({
      success: true,
      message: "Leave cancelled successfully",
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLeave,
  getStaffLeaves,
  getLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
  createMyLeave,
  getMyLeaves,
  cancelMyLeave,
  validateValidLeave,
};