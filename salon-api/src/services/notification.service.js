const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const Salon = require("../models/salon.model");
const { getIO } = require("../config/socket");

// ================================
// notifyUser
// ================================
// Create a notification for a single recipient and emit a real-time
// socket event. Safe to fail silently — notifications are best-effort
// and never break the leave request / approval flow.
const notifyUser = async ({
  recipientId,
  type,
  title,
  body,
  data = null,
  branchId = null,
  salonId = null,
}) => {
  try {
    await Notification.create({
      recipientId,
      type,
      title,
      body,
      data,
      branchId,
      salonId,
    });

    const io = getIO();
    if (io) {
      io.to(`user_${String(recipientId)}`).emit("notification:new", {
        type,
        title,
        body,
        data,
      });
    }
  } catch (error) {
    console.error("Notification emit error:", error.message);
  }
};

// ================================
// notifyLeaveRequestToManagers
// ================================
// Notify every manager of a branch plus the salon owner that a staff
// member submitted a leave request waiting for approval.
const notifyLeaveRequestToManagers = async ({
  branchId,
  salonId,
  title,
  body,
  data,
}) => {
  try {
    const managerRole = await Role.findOne({ name: "manager" })
      .select("_id")
      .lean();

    let managers = [];
    if (managerRole) {
      managers = await User.find({
        role: managerRole._id,
        branchId,
        salonId,
        isActive: true,
      })
        .select("_id")
        .lean();
    }

    const salon = await Salon.findById(salonId).select("owner").lean();
    let owner = null;
    if (salon?.owner) {
      owner = await User.findOne({ _id: salon.owner, isActive: true })
        .select("_id")
        .lean();
    }

    const seen = new Set();
    const targets = [];
    for (const m of managers) {
      const id = String(m._id);
      if (!seen.has(id)) {
        seen.add(id);
        targets.push(m._id);
      }
    }
    if (owner) {
      const id = String(owner._id);
      if (!seen.has(id)) {
        seen.add(id);
        targets.push(owner._id);
      }
    }

    for (const recipientId of targets) {
      await notifyUser({
        recipientId,
        type: "leave.requested",
        title,
        body,
        data,
        branchId,
        salonId,
      });
    }
  } catch (error) {
    console.error("notifyLeaveRequestToManagers error:", error.message);
  }
};

module.exports = { notifyUser, notifyLeaveRequestToManagers };