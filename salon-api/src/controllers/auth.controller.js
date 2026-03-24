const User = require('../models/user.model')
const Role = require('../models/role.model')
const AppError = require('../utils/AppError')
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/token')
const bcrypt = require('bcryptjs')

// ================================
// Helper — build user payload for token
// ================================
const buildUserPayload = async (user) => {
  const role = await Role.findById(user.role).select('name').lean()
  return {
    _id: user._id,
    salonId: user.salonId,
    branchId: user.branchId,
    tokenVersion: user.tokenVersion,
    roleName: role.name
  }
}

// ================================
// POST /api/v1/auth/register
// ================================
// only registers CUSTOMERS publicly
// staff/manager/owner are created by owner (we build that later)
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body

    // check if email already exists
    const existing = await User.findOne({ email })
    if (existing) {
      return next(new AppError('Email already registered', 400))
    }

    // get customer role
    const customerRole = await Role.findOne({ name: 'customer' })
    if (!customerRole) {
      return next(new AppError('Customer role not found. Please run seeder.', 500))
    }

    // create user — password gets hashed by pre-save hook
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: customerRole._id
    })

    // build tokens
    const payload = await buildUserPayload(user)
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // save hashed refresh token to DB
    user.refreshToken = await bcrypt.hash(refreshToken, 10)
    user.lastLoginAt = new Date()
    await user.save()

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'customer'
        },
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// POST /api/v1/auth/login
// ================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // find user — select password explicitly since select:false
    const user = await User.findOne({ email })
      .select('+password +refreshToken')
      .populate('role', 'name')

    if (!user) {
      return next(new AppError('Invalid email or password', 401))
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated', 401))
    }

    // compare password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401))
    }

    // build tokens
    const payload = {
      _id: user._id,
      salonId: user.salonId,
      branchId: user.branchId,
      tokenVersion: user.tokenVersion,
      roleName: user.role.name
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // save hashed refresh token
    user.refreshToken = await bcrypt.hash(refreshToken, 10)
    user.lastLoginAt = new Date()
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.name,
          salonId: user.salonId,
          branchId: user.branchId
        },
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// POST /api/v1/auth/refresh
// ================================
// when access token expires, frontend sends refresh token
// we verify it and issue a new access token
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    // verify the refresh token signature
    let decoded
    try {
      decoded = verifyRefreshToken(refreshToken)
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token', 401))
    }

    // find user and check stored refresh token
    const user = await User.findById(decoded.userId)
      .select('+refreshToken')
      .populate('role', 'name')

    if (!user || !user.refreshToken) {
      return next(new AppError('Refresh token not found. Please log in again.', 401))
    }

    // compare the incoming token against stored hash
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!isValid) {
      return next(new AppError('Refresh token mismatch. Please log in again.', 401))
    }

    // check tokenVersion
    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new AppError('Session expired. Please log in again.', 401))
    }

    // issue new access token
    const payload = {
      _id: user._id,
      salonId: user.salonId,
      branchId: user.branchId,
      tokenVersion: user.tokenVersion,
      roleName: user.role.name
    }

    const newAccessToken = generateAccessToken(payload)

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken: newAccessToken
      }
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// POST /api/v1/auth/logout
// ================================
// clears the refresh token from DB
// frontend should delete the access token from memory
const logout = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    await User.findByIdAndUpdate(req.user.userId, {
      refreshToken: null
    })

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    next(error)
  }
}

// ================================
// GET /api/v1/auth/me
// ================================
// returns current logged-in user's profile
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('role', 'name')
      .populate('salonId', 'name')
      .populate('branchId', 'name address')
      .lean()

    if (!user) {
      return next(new AppError('User not found', 404))
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
          lastLoginAt: user.lastLoginAt
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login, refresh, logout, me }