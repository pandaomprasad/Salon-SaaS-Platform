const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
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

    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      match: [/^[+]?[\d\s\-().]{7,15}$/, "Please provide a valid phone number"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never return password in queries by default
    },

    // reference to Role document
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required"],
    },

    // ================================
    // Scope fields — who belongs where
    // ================================

    // owner + manager + staff → which salon org they belong to
    // customer → null (they book at any branch)
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      default: null,
    },

    // manager + staff → which single branch they belong to
    // owner + customer → null
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },

    // ================================
    // Token security
    // ================================

    // increment this to invalidate all existing tokens for this user
    // e.g. when password changes, role changes, branch reassignment
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // store refresh token hash in DB so we can revoke it
    refreshToken: {
      type: String,
      default: null,
      select: false, // never return in queries
    },

    // ================================
    // Profile
    // ================================
    avatar: {
      type: String,
      default: null,
    },
    // extra permissions assigned to this specific user
    // overrides and extends their role permissions
    // e.g. give one manager "report:read" without giving all managers that permission
    extraPermissions: [
      {
        type: String,
        trim: true,
        lowercase: true,
        // format: "resource:action" e.g. "report:read"
      },
    ],

    // permissions explicitly denied for this user
    // even if their role has it — these are blocked
    // e.g. deny "staff:delete" for a specific manager
    deniedPermissions: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    // track last login for analytics
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ================================
// Indexes for performance
// ================================
// email already has unique:true above so no need to re-index it
// we query staff/managers by their branch often
userSchema.index({ branchId: 1 });
// we query all users under a salon often
userSchema.index({ salonId: 1 });

// ================================
// Hash password before saving
// ================================
// "pre save hook" — runs automatically before every .save()
// we use next-less async style which works correctly in mongoose v8+
userSchema.pre("save", async function () {
  // only hash if password was changed/is new
  // without this check, re-saving a user would double-hash the password
  if (!this.isModified("password")) return;

  // 12 = salt rounds — higher = more secure but slower
  // 12 is a good balance for production
  this.password = await bcrypt.hash(this.password, 12);
});

// ================================
// Instance method — compare passwords
// ================================
// called as: user.comparePassword(candidatePassword)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ================================
// Instance method — increment token version
// ================================
// called when we want to invalidate all existing JWTs for this user
userSchema.methods.invalidateTokens = async function () {
  this.tokenVersion += 1;
  await this.save();
};

module.exports = mongoose.model("User", userSchema);
