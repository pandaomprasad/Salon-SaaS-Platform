const mongoose = require("mongoose");
const tenantPlugin = require('../utils/tenantPlugin')

// Service = what a branch offers
// Each branch has its OWN services with its OWN prices
// e.g. "Haircut" at Bandra branch = ₹500, at Andheri branch = ₹400

const serviceSchema = new mongoose.Schema(
  {
    // which branch this service belongs to
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch reference is required"],
    },

    // denormalized for quick queries without join
    // avoids having to populate branch just to get salonId
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: [true, "Salon reference is required"],
    },

    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["hair", "skin", "nails", "makeup", "spa", "combo", "other"],
      lowercase: true,
    },

    // Optional package / offer subtitle, e.g. "Completed Package Offer till sep 18, 2021"
    packageOfferTag: {
      type: String,
      trim: true,
      maxlength: [150, "Offer tag cannot exceed 150 characters"],
    },

    // Included sub-services for combo / package service
    // e.g. ["Hairstyling", "Nail", "Hair color", "Body Glowing", "Facial", "Spa", "Eyebrows", "Make up", "Retouch", "Corner Lashes"]
    includedServices: [
      {
        type: String,
        trim: true,
      },
    ],

    // Banner image for package / service
    image: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },

    // price in smallest currency unit (paise for INR)
    // storing as integer avoids floating point issues
    // e.g. ₹500 stored as 50000
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    // display currency
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    // how long this service takes in minutes
    // used to calculate slot requirements
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [15, "Minimum duration is 15 minutes"],
    },

    // which staff members can perform this service
    // array of user references
    eligibleStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// ================================
// Indexes
// ================================
serviceSchema.index({ branchId: 1 });
serviceSchema.index({ branchId: 1, category: 1 });
serviceSchema.index({ branchId: 1, isActive: 1 });
// browse-by-category: filter services by category across branches
serviceSchema.index({ category: 1, isActive: 1 });
// pre-save hook — last line of defense for price validation
serviceSchema.pre("save", function () {
  if (this.price !== undefined) {
    if (!Number.isInteger(this.price) || this.price < 100) {
      throw new Error(
        `Invalid price: ${this.price}. Price must be in paise. Send 50000 for ₹500`,
      );
    }
  }
});

// virtual — formatted price display
// service.priceDisplay => "₹500.00"
// serviceSchema.virtual("priceDisplay").get(function () {
//   return `₹${(this.price / 100).toFixed(2)}`;
// });
serviceSchema.plugin(tenantPlugin)
module.exports = mongoose.model("Service", serviceSchema);
