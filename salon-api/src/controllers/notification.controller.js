const Notification = require("../models/notification.model");
const AppError = require("../utils/AppError");

// ================================
// GET /api/v1/notifications
// my notifications (newest first)
// query: ?unread=true  → only unread
//        ?limit=N      → cap returned items
// ================================
const getMyNotifications = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const filter = { recipientId: userId };
    if (req.query.unread === "true") filter.isRead = false;

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    res.status(200).json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/notifications/unread-count
// lightweight — for the sidebar badge
// ================================
const getUnreadCount = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    res.status(200).json({ success: true, data: { unreadCount } });
  } catch (error) {
    next(error);
  }
};

// ================================
// PATCH /api/v1/notifications/:notificationId/read
// mark one notification as read
// ================================
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.user;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!notification) return next(new AppError("Notification not found", 404));

    res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/notifications/read-all
// mark all my notifications as read
// ================================
const markAllAsRead = async (req, res, next) => {
  try {
    const { userId } = req.user;

    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};