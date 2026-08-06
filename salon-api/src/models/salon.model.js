const mongoose = require('mongoose')

// Salon = the parent organization / brand
// e.g. "Glamour Studios" — one owner, multiple branches
// Think of it like a franchise — one brand, many locations

const salonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Salon name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    // the owner of this salon org
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },

    logo: {
      type: String,
      default: null
    },

    // contact for the brand (not branch-specific)
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true
    },

    contactPhone: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    },
    deactivatedByAdmin: {
      type: Boolean,
      default: false
    },
    adminDeactivationReason: {
      type: String,
      default: null,
      trim: true
    },
    adminDeactivatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    // toJSON virtuals lets virtual fields show up in res.json()
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// virtual field — get all branches of this salon
// usage: await Salon.findById(id).populate('branches')
salonSchema.virtual('branches', {
  ref: 'Branch',        // look in Branch model
  localField: '_id',    // match salon._id
  foreignField: 'salonId' // to branch.salonId
})

// index on owner — owner queries their salons often
salonSchema.index({ owner: 1 })

// browse/filter: every public listing filters by active salon
salonSchema.index({ isActive: 1, deactivatedByAdmin: 1 })

module.exports = mongoose.model('Salon', salonSchema)