const router = require("express").Router();

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notification.controller");

const authenticate = require("../middleware/authenticate");

// notifications are personal; any authenticated user can read their own
router.use(authenticate);

/**
 * GET /api/v1/notifications
 * list my notifications (?unread=true, ?limit=N)
 */
router.get("/", getMyNotifications);

/**
 * GET /api/v1/notifications/unread-count
 * lightweight count for the sidebar badge
 */
router.get("/unread-count", getUnreadCount);

/**
 * PATCH /api/v1/notifications/:notificationId/read
 * mark a single notification as read
 */
router.patch("/:notificationId/read", markAsRead);

/**
 * POST /api/v1/notifications/read-all
 * mark every notification as read
 */
router.post("/read-all", markAllAsRead);

/**
 * DELETE /api/v1/notifications/:notificationId
 * delete a single notification
 */
router.delete("/:notificationId", deleteNotification);

module.exports = router;