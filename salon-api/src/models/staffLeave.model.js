const mongoose = require('mongoose')
const tenantPlugin = require('../utils/tenantPlugin')

// StaffLeave = when a staff member is NOT available
// A dedicated record separate from branch working hours
// so staff can mark days off, leaves, and time windows
// e.g. "Priya is on leave 2026-08-10 → 2026-08-12"
//      "Ravi is unavailable every Thursday"
//      "Neha is off 14:00–16:00 on 2026-08-14"
//
// Three supported shapes:
//   1. type: 'SINGLE'       — one date  (date required)
//   2. type: 'RANGE'        — date range (startDate + endDate required)
//   3. type: 'RECURRING'    — weekly recurring day(s) of week within a range
//
// All types can optionally constrain a time window on each covered day
// via startTime/endTime (e.g. afternoon off, not the whole day).
// If startTime/endTime are null the ENTIRE day(s) are unavailable.

const staffLeaveSchema = new mongoose.Schema(
  {
    // ================================
    // Who & where
    // ================================
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff is required'],
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },

    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required'],
    },

    // who created/updated this leave (manager, owner, or staff self-service)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },

    // ======================================================================
    // Leave definition
    // ======================================================================
    type: {
      type: String,
      enum: ['SINGLE', 'RANGE', 'RECURRING'],
      default: 'SINGLE',
    },

    // SINGLE → date; RANGE → startDate..endDate; RECURRING → applies weekly
    date: {
      type: String, // "YYYY-MM-DD"
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
      default: null,
    },

    startDate: {
      type: String, // "YYYY-MM-DD"
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'],
      default: null,
    },

    endDate: {
      type: String, // "YYYY-MM-DD"
      match: [/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'],
      default: null,
    },

    // RECURRING — which days of the week (0=Sunday ... 6=Saturday)
    weekdays: {
      type: [Number],
      min: 0,
      max: 6,
      default: [],
    },

    // ======================================================================
    // Optional time window — if both null the whole day is unavailable
    // ======================================================================
    allDay: {
      type: Boolean,
      default: true,
    },

    startTime: {
      type: String, // "HH:MM" 24hr
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'],
      default: null,
    },

    endTime: {
      type: String, // "HH:MM" 24hr
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'],
      default: null,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: [200, 'Reason cannot exceed 200 characters'],
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true, // false = this leave has been cancelled/withdrawn
    },

    // ======================================================================
    // Approval workflow
    // ======================================================================
    // Staff self-service requests start PENDING; they only take effect
    // (block slots / skip generation / block bookings) once a manager or
    // owner APPROVES them. Leaves created directly by owner/manager are
    // APPROVED immediately.
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    // ======================================================================
    // Who did what — audit trail
    // ======================================================================
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // manager/owner who approved or rejected
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [200, "Rejection reason cannot exceed 200 characters"],
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// ================================
// Indexes — "which leaves overlap date X for staff Y" is the hot query
// ================================
staffLeaveSchema.index({ staffId: 1, isActive: 1, status: 1 })
staffLeaveSchema.index({ branchId: 1, isActive: 1, status: 1 })
staffLeaveSchema.index({ staffId: 1, startDate: 1, endDate: 1, isActive: 1, status: 1 })
staffLeaveSchema.plugin(tenantPlugin)

module.exports = mongoose.model('StaffLeave', staffLeaveSchema)