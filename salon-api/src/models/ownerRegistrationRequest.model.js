const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// OwnerRegistrationRequest = a salon owner who self-registered from the
// public landing page. Requests stay PENDING until a superadmin approves
// (creates the owner user + salon) or rejects them.

const ownerRegistrationRequestSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    ownerEmail: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },

    ownerPhone: {
      type: String,
      trim: true,
      required: false,
    },

    // password the owner will use once their account is approved.
    // hashed at rest — the approved User record re-uses this hash.
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    salonName: {
      type: String,
      required: [true, "Salon name is required"],
      trim: true,
      minlength: [2, "Salon name must be at least 2 characters"],
      maxlength: [100, "Salon name cannot exceed 100 characters"],
    },

    salonDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    adminNote: {
      type: String,
      trim: true,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ================================
// Hash password before saving
// ================================
ownerRegistrationRequestSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ================================
// Instance method — compare passwords
// ================================
ownerRegistrationRequestSchema.methods.comparePassword = async function (
  candidatePassword,
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model(
  "OwnerRegistrationRequest",
  ownerRegistrationRequestSchema,
);