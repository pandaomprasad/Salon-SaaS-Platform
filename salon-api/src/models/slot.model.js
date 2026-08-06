const mongoose = require('mongoose')
const tenantPlugin = require('../utils/tenantPlugin')

// Slot = a bookable time window for a specific staff on a specific day
// e.g. Staff John, Branch Bandra, 2024-01-15, 10:00 AM - 11:00 AM
//
// Slots are pre-generated based on branch working hours
// e.g. Branch opens 9AM closes 9PM with 60min slots =>
// generates: 9-10, 10-11, 11-12, 12-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6-7, 7-8, 8-9
//
// WHY pre-generate?
// At 10k bookings/day, checking real-time availability is expensive
// Pre-generated slots can be cached in Redis and queried instantly

const slotSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },

    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true
    },

    // which staff member this slot belongs to
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // ================================
    // Time fields
    // ================================

    // date stored as YYYY-MM-DD string for easy querying
    // e.g. "2024-01-15"
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
    },

    // start time as "HH:MM" 24hr format e.g. "10:00"
    startTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format']
    },

    // end time e.g. "11:00"
    endTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format']
    },

    // ================================
    // Availability
    // ================================

    // AVAILABLE — no booking yet
    // BOOKED     — has an appointment
    // BLOCKED    — manually blocked by staff/manager (break, leave)
    // COMPLETED  — past slot, appointment done
    status: {
      type: String,
      enum: ['AVAILABLE', 'BOOKED', 'BLOCKED', 'COMPLETED'],
      default: 'AVAILABLE'
    },

    // reference to the appointment that booked this slot
    // null if status is AVAILABLE or BLOCKED
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },

    // reason when manually blocked
    // e.g. "Lunch break", "Public holiday"
    blockReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// ================================
// Indexes — critical for performance
// ================================

// most common query: "show me available slots for branch X on date Y"
slotSchema.index({ branchId: 1, date: 1, status: 1 })

// same query + sorted by start time (covers the sort, avoids in-memory sort)
slotSchema.index({ branchId: 1, date: 1, status: 1, startTime: 1 })

// "show me all slots for staff X on date Y"
slotSchema.index({ staffId: 1, date: 1 })

// owner-level slot reports: filter by salon instead of branch
slotSchema.index({ salonId: 1, date: 1 })

// browse "which branches have slots on date X" (distinct branchId)
slotSchema.index({ date: 1, status: 1 })

// prevent duplicate slots for same staff at same time
slotSchema.index(
  { staffId: 1, date: 1, startTime: 1 },
  { unique: true }
)
slotSchema.plugin(tenantPlugin)
module.exports = mongoose.model('Slot', slotSchema)