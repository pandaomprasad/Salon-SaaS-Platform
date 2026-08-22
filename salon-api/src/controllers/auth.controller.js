const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const AppError = require("../utils/AppError");
const OwnerRegistrationRequest = require("../models/ownerRegistrationRequest.model");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");
const bcrypt = require("bcryptjs");
const {
  sendOwnerRegistrationReceivedEmail,
  sendPasswordResetOtpEmail,
  sendEmailVerificationLink,
  sendWelcomeOAuthEmail,
} = require("../services/email.service");
const { validateEmail } = require("../utils/emailValidation");

// ================================
// Helper — build user payload for token
// ================================
const buildUserPayload = async (user) => {
  const role = await Role.findById(user.role).select("name").lean();
  return {
    _id: user._id,
    salonId: user.salonId,
    branchId: user.branchId,
    tokenVersion: user.tokenVersion,
    roleName: role.name,
  };
};

// ================================
// POST /api/v1/auth/register
// ================================
// only registers CUSTOMERS publicly
// staff/manager/owner are created by owner (we build that later)
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Reject disposable emails & invalid MX records
    const check = await validateEmail(email);
    if (!check.valid) {
      return next(new AppError(check.reason, 400));
    }

    const cleanEmail = email.toLowerCase().trim();

    // check if email already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return next(new AppError("Email already registered", 400));
    }

    // get customer role
    const customerRole = await Role.findOne({ name: "customer" });
    if (!customerRole) {
      return next(
        new AppError("Customer role not found. Please run seeder.", 500),
      );
    }

    // create user — password gets hashed by pre-save hook
    const user = await User.create({
      name,
      email: cleanEmail,
      phone,
      password,
      role: customerRole._id,
      isEmailVerified: false,
    });

    // Generate JWT verification token (expires in 1 hour)
    const verificationSecret = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_ACCESS_SECRET || "secret-email-verification-key";
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      verificationSecret,
      { expiresIn: "1h" }
    );

    // Send confirmation link email asynchronously
    sendEmailVerificationLink({
      to: user.email,
      userName: user.name,
      token: verificationToken,
    }).catch((err) => console.error("Error sending verification link email:", err));

    // build tokens
    const payload = await buildUserPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // save hashed refresh token to DB
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.lastLoginAt = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: "customer",
          isEmailVerified: false,
          email_verified: false,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
const Salon = require("../models/salon.model");

// ================================
// POST /api/v1/auth/register-owner
// ================================
// Public self-registration for salon owners from the landing page.
// Does NOT create an account immediately — it creates a PENDING request
// that a superadmin reviews in the admin panel. Once APPROVED the owner
// can log in to the salon panel with the credentials they submitted.
const registerOwner = async (req, res, next) => {
  try {
    const { ownerName, ownerEmail, ownerPhone, salonName, salonDescription, password } = req.body;

    const email = ownerEmail.toLowerCase();

    // an existing platform user (any role) already owns this email
    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError("Email already registered", 400));
    }

    // an identical request is already waiting for review
    const pending = await OwnerRegistrationRequest.findOne({
      ownerEmail: email,
      status: "PENDING",
    });
    if (pending) {
      return next(
        new AppError("You already have a pending request. Our team will review it shortly.", 400),
      );
    }

    // an earlier request was approved for this email
    const approved = await OwnerRegistrationRequest.findOne({
      ownerEmail: email,
      status: "APPROVED",
    });
    if (approved) {
      return next(new AppError("This email is already registered as a salon owner. Please log in.", 400));
    }

    const request = await OwnerRegistrationRequest.create({
      ownerName,
      ownerEmail: email,
      ownerPhone,
      salonName,
      salonDescription,
      password,
      status: "PENDING",
    });

    // Send thank-you & pending approval email asynchronously
    sendOwnerRegistrationReceivedEmail({
      to: email,
      ownerName: request.ownerName,
      salonName: request.salonName,
    }).catch((err) => console.error("Error sending owner registration email:", err));

    res.status(201).json({
      success: true,
      message: "Registration submitted. Our team will review and activate your salon account shortly.",
      data: {
        request: {
          _id: request._id,
          ownerName: request.ownerName,
          ownerEmail: request.ownerEmail,
          salonName: request.salonName,
          status: request.status,
          createdAt: request.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/auth/login
// ================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // find user — select password explicitly since select:false
    const user = await User.findOne({ email })
      .select("+password +refreshToken")
      .populate("role", "name");

    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    if (!user.isActive) {
      return next(new AppError("Your account has been deactivated", 401));
    }

    // compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError("Invalid email or password", 401));
    }

    // build tokens
    const payload = {
      _id: user._id,
      salonId: user.salonId,
      branchId: user.branchId,
      tokenVersion: user.tokenVersion,
      roleName: user.role.name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // save hashed refresh token
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.lastLoginAt = new Date();
    await user.save();

    // Fetch salon data if user belongs to one
    let salon = null;
    if (user.salonId) {
      salon = await Salon.findById(user.salonId).select("_id name description logo isActive").lean();
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.name,
          salonId: user.salonId,
          branchId: user.branchId,
          isEmailVerified: user.isEmailVerified !== false,
          email_verified: user.isEmailVerified !== false,
        },
        salon,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/auth/refresh
// ================================
// when access token expires, frontend sends refresh token
// we verify it and issue a new access token
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // verify the refresh token signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return next(new AppError("Invalid or expired refresh token", 401));
    }

    // find user and check stored refresh token
    const user = await User.findById(decoded.userId)
      .select("+refreshToken")
      .populate("role", "name");

    if (!user || !user.refreshToken) {
      return next(
        new AppError("Refresh token not found. Please log in again.", 401),
      );
    }

    // compare the incoming token against stored hash
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      return next(
        new AppError("Refresh token mismatch. Please log in again.", 401),
      );
    }

    // check tokenVersion
    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new AppError("Session expired. Please log in again.", 401));
    }

    // issue new access token
    const payload = {
      _id: user._id,
      salonId: user.salonId,
      branchId: user.branchId,
      tokenVersion: user.tokenVersion,
      roleName: user.role.name,
    };

    const newAccessToken = generateAccessToken(payload);

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/auth/logout
// ================================
// clears the refresh token from DB
// frontend should delete the access token from memory
const logout = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    await User.findByIdAndUpdate(req.user.userId, {
      refreshToken: null,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/auth/me
// ================================
// returns current logged-in user's profile
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("role", "name")
      .populate("salonId", "name")
      .populate("branchId", "name address")
      .lean();

    if (!user) {
      return next(new AppError("User not found", 404));
    }

res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.name,
          salon: user.salonId,
          branch: user.branchId,
          isEmailVerified: user.isEmailVerified !== false,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/auth/me
// Update the logged-in user's own profile (name / phone)
const updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body || {};
    const updates = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (trimmed.length < 2) {
        return next(new AppError("Name must be at least 2 characters", 400));
      }
      updates.name = trimmed;
    }

    if (phone !== undefined) {
      const trimmed = String(phone).trim();
      if (trimmed === "") {
        return next(new AppError("Phone number cannot be empty", 400));
      }
      updates.phone = trimmed;
    }

    if (Object.keys(updates).length === 0) {
      return next(new AppError("Nothing to update", 400));
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    })
      .select("name email phone")
      .lean();

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client();
const googleClientIds = (
  process.env.GOOGLE_CLIENT_IDS ||
  [
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    "23232568516-arksroglu4uhc0ogqm94uh3e6cbln9lv.apps.googleusercontent.com",
    "23232568516-744mk3m6va3up35md674td07vdqseqnh.apps.googleusercontent.com",
  ]
    .filter(Boolean)
    .join(",")
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// ================================
// POST /api/v1/auth/google
// ================================
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    let email = null;
    let name = null;
    let googleId = null;
    let picture = null;

    if (!idToken) return next(new AppError("Google ID token required", 400));
    if (!googleClientIds.length) {
      return next(new AppError("Google sign-in is not configured on the server", 503));
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: googleClientIds,
      });
      const payload = ticket.getPayload();
      if (!payload?.email || payload.email_verified !== true) {
        return next(new AppError("Google email could not be verified", 401));
      }
      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
      picture = payload.picture;
    } catch {
      return next(new AppError("Invalid Google ID Token", 401));
    }

    if (!email) {
      return next(new AppError("Could not extract email from Google account", 400));
    }

    const requestedRole = req.body.role || "customer";
    let targetRole = await Role.findOne({ name: requestedRole });
    if (!targetRole) {
      targetRole = await Role.findOne({ name: "customer" });
    }
    if (!targetRole) {
      return next(new AppError("User role not found. Please run database seeder.", 500));
    }

    let user = await User.findOne({ email }).populate("role", "name");

    if (!user) {
      try {
        user = await User.create({
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          googleId,
          avatar: picture || null,
          role: targetRole._id,
          isEmailVerified: true,
        });

        // Send Welcome email asynchronously for Google Sign-In
        sendWelcomeOAuthEmail({
          to: user.email,
          userName: user.name,
          provider: "Google",
        }).catch((err) => console.error("Error sending Google welcome email:", err));
      } catch (createErr) {
        if (createErr.code === 11000) {
          user = await User.findOne({ email: email.toLowerCase() }).populate(
            "role",
            "name",
          );
          if (!user) throw createErr;
        } else {
          throw createErr;
        }
      }
      user = await User.findById(user._id).populate("role", "name");
    } else {
      if (!user.isActive) {
        return next(new AppError("Your account has been deactivated", 401));
      }
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
    }

    const payload = {
      _id: user._id,
      salonId: user.salonId,
      branchId: user.branchId,
      tokenVersion: user.tokenVersion,
      roleName: user.role?.name || "customer",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.lastLoginAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role?.name || "customer",
          avatar: user.avatar,
          salonId: user.salonId,
          branchId: user.branchId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/auth/apple
// ================================
const appleLogin = async (req, res, next) => {
  try {
    const { identityToken, user: appleUserId, fullName, email: providedEmail } = req.body;

    if (!identityToken) {
      return next(new AppError("Apple identityToken is required", 400));
    }

    const decoded = jwt.decode(identityToken);
    if (!decoded) {
      return next(new AppError("Invalid Apple identity token", 400));
    }

    const appleId = appleUserId || decoded.sub;
    const email = (providedEmail || decoded.email || `${appleId}@privaterelay.appleid.com`).toLowerCase();

    let name = "Apple User";
    if (fullName) {
      const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
      if (parts.length > 0) name = parts.join(" ");
    }

    const customerRole = await Role.findOne({ name: "customer" });
    if (!customerRole) {
      return next(new AppError("Customer role not found", 500));
    }

    let user = await User.findOne({
      $or: [{ appleId }, { email }],
    }).populate("role", "name");

    if (!user) {
      user = await User.create({
        name,
        email,
        appleId,
        role: customerRole._id,
        isEmailVerified: true,
      });

      // Send Welcome email asynchronously for Apple Sign-In
      sendWelcomeOAuthEmail({
        to: user.email,
        userName: user.name,
        provider: "Apple",
      }).catch((err) => console.error("Error sending Apple welcome email:", err));

      user = await User.findById(user._id).populate("role", "name");
    } else {
      if (!user.isActive) {
        return next(new AppError("Your account has been deactivated", 401));
      }
      if (!user.appleId) {
        user.appleId = appleId;
      }
    }

    const payload = {
      _id: user._id,
      salonId: user.salonId,
      branchId: user.branchId,
      tokenVersion: user.tokenVersion,
      roleName: user.role?.name || "customer",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.lastLoginAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Apple login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role?.name || "customer",
          avatar: user.avatar,
          salonId: user.salonId,
          branchId: user.branchId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/auth/forgot-password
// ================================
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError("Email is required", 400));

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a verification code has been sent.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = await bcrypt.hash(otp, 10);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    sendPasswordResetOtpEmail({
      to: user.email,
      userName: user.name,
      otp,
    }).catch((err) => console.error("Error sending reset OTP email:", err));

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/auth/reset-password
// ================================
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return next(new AppError("Email, OTP code, and new password are required", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +resetPasswordOtp +resetPasswordExpires"
    );

    if (!user || !user.resetPasswordOtp || !user.resetPasswordExpires) {
      return next(new AppError("Invalid or expired password reset request", 400));
    }

    if (user.resetPasswordExpires < new Date()) {
      return next(new AppError("Verification code has expired. Please request a new code.", 400));
    }

    const isValidOtp = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isValidOtp) {
      return next(new AppError("Invalid 6-digit verification code", 400));
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/auth/change-password
// ================================
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError("Current and new passwords are required", 400));
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user || !user.password) {
      return next(new AppError("User password not found or signed in via Google", 400));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Incorrect current password", 400));
    }

    user.password = newPassword;
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// DELETE /api/v1/auth/delete-account
// ================================
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    user.isActive = false;
    user.email = `deleted_${userId}_${Date.now()}@anonymized.local`;
    user.phone = null;
    user.googleId = null;
    user.refreshToken = null;
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/auth/verify-email
// ================================
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return next(new AppError("Missing verification token", 400));
    }

    const verificationSecret = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_ACCESS_SECRET || "secret-email-verification-key";

    let payload;
    try {
      payload = jwt.verify(token, verificationSecret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Verification link expired. Please request a new link.", 400));
      }
      return next(new AppError("Invalid verification link", 400));
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return next(new AppError("User account not found", 404));
    }

    if (user.email.toLowerCase() !== payload.email.toLowerCase()) {
      return next(new AppError("Token does not match account email", 400));
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified.",
        data: { isEmailVerified: true, email_verified: true },
      });
    }

    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: { isEmailVerified: true, email_verified: true },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// GET /api/v1/auth/verify-email-landing (Web Page Option A)
// ================================
const verifyEmailLanding = async (req, res) => {
  const { token } = req.query;
  const verificationSecret = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_ACCESS_SECRET || "secret-email-verification-key";

  let success = false;
  let title = "Verification Failed";
  let message = "Invalid or expired verification link.";

  if (token) {
    try {
      const payload = jwt.verify(token, verificationSecret);
      const user = await User.findById(payload.userId);
      if (user && user.email.toLowerCase() === payload.email.toLowerCase()) {
        user.isEmailVerified = true;
        await user.save();
        success = true;
        title = "Email Confirmed!";
        message = "Your ST CUT account is active. Tap the button below to return to the app.";
      }
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        message = "This confirmation link has expired (valid for 1 hour). Please request a new link inside the app.";
      }
    }
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ST CUT — Email Verification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0D0D0D; color: #F4F4F2; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1C1C1E; border: 1px solid #2A2A2C; border-radius: 24px; padding: 40px 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #FFFFFF; }
    p { font-size: 15px; color: #A0A09C; line-height: 1.6; margin: 0 0 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #D49B45 0%, #C48B36 100%); color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 14px; box-shadow: 0 8px 16px rgba(196,139,54,0.3); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✨" : "❌"}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${success ? `<a href="stcut://verify-email?token=${token}" class="btn">Open ST CUT App</a>` : `<p style="color:#D49B45; font-weight:600;">Return to ST CUT app to request a new link.</p>`}
  </div>
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
};

// ================================
// POST /api/v1/auth/resend-verification
// ================================
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError("Email is required", 400));

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return next(new AppError("Account not found with this email", 404));
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const verificationSecret = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_ACCESS_SECRET || "secret-email-verification-key";
    const verificationToken = jwt.sign(
      { userId: user._id, email: user.email },
      verificationSecret,
      { expiresIn: "1h" }
    );

    await sendEmailVerificationLink({
      to: user.email,
      userName: user.name,
      token: verificationToken,
    });

    res.status(200).json({
      success: true,
      message: "Verification email resent successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  registerOwner,
  login,
  googleLogin,
  appleLogin,
  refresh,
  logout,
  me,
  updateMe,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
  verifyEmail,
  verifyEmailLanding,
  resendVerification,
};
