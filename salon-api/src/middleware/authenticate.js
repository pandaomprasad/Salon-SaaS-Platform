const User = require('../models/user.model')
const AppError = require('../utils/AppError')
const { verifyAccessToken } = require('../utils/token')
const logger = require('../utils/logger')
const { setTenantContext } = require('../utils/tenantContext')
// ================================
// authenticate middleware
// ================================
// this runs on every protected route FIRST
// it does 3 things:
//   1. extracts the JWT from Authorization header
//   2. verifies it is valid and not expired
//   3. checks tokenVersion matches DB (catches revoked tokens)
//   4. attaches user info to req.user for downstream middleware

const authenticate = async (req, res, next) => {
  try {
    // --------------------------------
    // Step 1 — extract token
    // --------------------------------
    // clients send: Authorization: Bearer <token>
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided. Please log in.', 401))
    }

    // split "Bearer eyJhbGc..." => ["Bearer", "eyJhbGc..."]
    const token = authHeader.split(' ')[1]

    if (!token) {
      return next(new AppError('Invalid token format.', 401))
    }

    // --------------------------------
    // Step 2 — verify token signature and expiry
    // --------------------------------
    // this throws if token is expired or tampered
    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token expired. Please refresh your session.', 401))
      }
      return next(new AppError('Invalid token. Please log in again.', 401))
    }

    // --------------------------------
    // Step 3 — check tokenVersion
    // --------------------------------
    // we only hit the DB here to verify the token hasn't been revoked
    // this is the ONLY DB call in the auth chain
    const user = await User.findById(decoded.userId)
      .select('_id name email role salonId branchId tokenVersion isActive')
      .lean() // .lean() returns plain JS object instead of mongoose document
    // faster for reads — we don't need mongoose methods here

    if (!user) {
      return next(new AppError('User no longer exists.', 401))
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated.', 401))
    }

    // tokenVersion mismatch means the token was invalidated
    // e.g. password changed, role changed, manually logged out
    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new AppError('Session expired. Please log in again.', 401))
    }

    // --------------------------------
    // Step 4 — role name comes from the JWT payload (signed at login),
    // so we avoid a second DB query per request. The user doc is still
    // loaded above for the isActive/tokenVersion revocation checks.
    // --------------------------------
    const roleName = decoded.role || "customer";

    // --------------------------------
    // Attach to req.user — available in all downstream middleware
    // --------------------------------
    req.user = {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: roleName,            // "owner", "manager", "staff", "customer"
      salonId: user.salonId,     // null for customer
      branchId: user.branchId,   // null for owner + customer
      tokenVersion: user.tokenVersion
    }

    logger.info(`Authenticated: ${user.email} [${roleName}]`)
    // --------------------------------
    // Step 6 — wrap request in tenant context
    // --------------------------------
    // AsyncLocalStorage makes salonId/branchId available
    // to mongoose plugin on every query in this request
    // without passing req around
    setTenantContext(
      {
        userId: user._id,
        role: roleName,
        salonId: user.salonId || null,
        branchId: user.branchId || null
      },
      () => next()
    )

  } catch (error) {
    next(new AppError('Authentication failed.', 401))
  }
}

module.exports = authenticate