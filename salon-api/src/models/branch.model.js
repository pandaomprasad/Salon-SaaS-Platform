const mongoose = require('mongoose')

// Branch = a single physical location of a salon
// Each branch has its own address, services, staff, and slots
// e.g. "Glamour Studios — Bandra" and "Glamour Studios — Andheri"

const branchSchema = new mongoose.Schema(
  {
    // which salon org this branch belongs to
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: [true, 'Salon reference is required']
    },

    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    // ================================
    // Address — embedded document
    // ================================
    // we embed address directly instead of a separate collection
    // because address only belongs to one branch, never shared
    address: {
      street: {
        type: String,
        required: [true, 'Street is required'],
        trim: true
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true
      },
      country: {
        type: String,
        default: 'India',
        trim: true
      },
      // geo coordinates for map integration later
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
      }
    },

    contactPhone: {
      type: String,
      required: [true, 'Branch contact phone is required'],
      trim: true
    },

    contactEmail: {
      type: String,
      lowercase: true,
      trim: true
    },

    // ================================
    // Working Hours
    // ================================
    // stored as array of 7 days (0=Sunday ... 6=Saturday)
    workingHours: [
      {
        // 0 = Sunday, 1 = Monday ... 6 = Saturday
        day: {
          type: Number,
          min: 0,
          max: 6,
          required: true
        },
        isOpen: {
          type: Boolean,
          default: true
        },
        // stored as "HH:MM" 24hr format e.g. "09:00"
        openTime: {
          type: String,
          default: '09:00'
        },
        closeTime: {
          type: String,
          default: '21:00'
        }
      }
    ],

    // ================================
    // Slot Configuration
    // ================================
    // how long is each appointment slot in minutes
    // e.g. 60 means slots are 10:00, 11:00, 12:00 ...
    slotDurationMinutes: {
      type: Number,
      default: 60,
      min: [15, 'Minimum slot duration is 15 minutes'],
      max: [240, 'Maximum slot duration is 240 minutes']
    },

    // how many days in advance can customers book
    advanceBookingDays: {
      type: Number,
      default: 30
    },

    // assigned manager for this branch
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// ================================
// Indexes
// ================================
branchSchema.index({ salonId: 1 })
branchSchema.index({ salonId: 1, isActive: 1 })

module.exports = mongoose.model('Branch', branchSchema)