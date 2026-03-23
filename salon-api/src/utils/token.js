const jwt = require('jsonwebtoken')

// ================================
// Generate Access Token
// ================================
// access token lives for 15 minutes
// contains just enough info so we never need to hit DB for basic auth checks
//
// payload we put inside:
//   userId       — who is this
//   role         — what type of user (owner/manager/staff/customer)
//   salonId      — which salon org they belong to
//   branchId     — which branch they belong to (manager/staff only)
//   tokenVersion — used to invalidate old tokens

const generateAccessToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.roleName,       // "owner", "manager", "staff", "customer"
    salonId: user.salonId,
    branchId: user.branchId,
    tokenVersion: user.tokenVersion
  }

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
  })
}

// ================================
// Generate Refresh Token
// ================================
// refresh token lives for 7 days
// stored in DB so we can revoke it
// only contains userId and tokenVersion — nothing else needed

const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    tokenVersion: user.tokenVersion
  }

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  })
}

// ================================
// Verify Access Token
// ================================
// returns decoded payload if valid
// throws error if expired or tampered

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET)
}

// ================================
// Verify Refresh Token
// ================================
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
}