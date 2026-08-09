const mongoose = require('mongoose')
const tenantPlugin = require('../utils/tenantPlugin')

// Notification = an in-app alert for a specific user (owner, manager, staff).
// Used to surface async events like "staff requested leave — approve it"
// or "your leave was approved/rejected" inside the salon panel without
// the user polling multiple collections.
//
// Types (lowercase kebab-case, extend as needed):
//   leave.requested   — staff asked for leave; recipient = branch managers + salon owner
//   leave.approved    - manager/owner approved; recipient = the staff member
//   leave.rejected    - manager/owner rejected; recipient = the staff member
//
// isRead starts false and is flipped by the notification routes.

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },

    type: {
      type: String,
      required: [true, 'Notification type is required'],
    },

    title: {
      type: String,
      trim: true,
      maxlength: [160, 'Title cannot exceed 160 characters'],
    },

    body: {
      type: String,
      trim: true,
      maxlength: [500, 'Body cannot exceed 500 characters'],
      default: null,
    },

    // structured payload so the frontend can deep-link (e.g. leaveId)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },

    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      default: null,
    },
  },
  { timestamps: true },
)

// "unread notifications for user X" is the hot query
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ salonId: 1, recipientId: 1 })

notificationSchema.plugin(tenantPlugin)

module.exports = mongoose.model('Notification', notificationSchema)