const mongoose = require('mongoose')

// Appointment = a confirmed booking
// Links: customer → branch → staff → service → slot
// Has a full lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
//                                           ↘ CANCELLED / NO_SHOW

const appointmentSchema = new mongoose.Schema(
  {
    // ================================
    // Core references
    // ================================

    // who booked
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required']
    },

    // at which branch
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required']
    },

    // under which salon org
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon is required']
    },

    // which staff member will serve
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff is required']
    },

    // which service is booked
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required']
    },

    // which time slot
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot is required']
    },

    // ================================
    // Denormalized time fields
    // ================================
    // We copy these from the slot so we can query appointments by date
    // without always populating the slot
    date: {
      type: String, // "YYYY-MM-DD"
      required: true
    },

    startTime: {
      type: String, // "HH:MM"
      required: true
    },

    endTime: {
      type: String, // "HH:MM"
      required: true
    },

    // ================================
    // Lifecycle Status
    // ================================
    status: {
      type: String,
      enum: [
        'PENDING',      // customer booked, awaiting confirmation
        'CONFIRMED',    // manager/staff confirmed
        'IN_PROGRESS',  // customer is currently being served
        'COMPLETED',    // service done
        'CANCELLED',    // cancelled by customer or salon
        'NO_SHOW'       // customer didn't show up
      ],
      default: 'PENDING'
    },

    // who cancelled and why
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      reason: {
        type: String,
        default: null
      },
      cancelledAt: {
        type: Date,
        default: null
      }
    },

    // ================================
    // Pricing snapshot
    // ================================
    // We snapshot the price at time of booking
    // so if service price changes later, history is accurate
    pricePaid: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: 'INR'
    },

    // ================================
    // Notes & Feedback
    // ================================
    customerNotes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: null
    },

    staffNotes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: null
    },

    // customer rating after completion
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      review: {
        type: String,
        maxlength: [500, 'Review cannot exceed 500 characters'],
        default: null
      },
      ratedAt: {
        type: Date,
        default: null
      }
    },

    // ================================
    // Status history — full audit trail
    // ================================
    // every status change is recorded with who changed it and when
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        changedAt: {
          type: Date,
          default: Date.now
        },
        note: String
      }
    ]
  },
  {
    timestamps: true
  }
)

// ================================
// Indexes — built for 10k bookings/day
// ================================

// most common: get all appointments for a branch on a date
appointmentSchema.index({ branchId: 1, date: 1 })

// get all appointments for a branch by status
appointmentSchema.index({ branchId: 1, status: 1 })

// customer views their own appointment history
appointmentSchema.index({ customerId: 1, date: -1 })

// staff views their schedule
appointmentSchema.index({ staffId: 1, date: 1 })

// compound — branch + date + status (most frequent analytics query)
appointmentSchema.index({ branchId: 1, date: 1, status: 1 })

// ================================
// Pre-save hook — auto-record status changes
// ================================
appointmentSchema.pre('save', function (next) {
  // if status was modified, push to history
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    })
  }
  next()
})

module.exports = mongoose.model('Appointment', appointmentSchema)