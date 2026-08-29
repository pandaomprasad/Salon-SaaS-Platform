const router = require('express').Router()
const {
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
} = require('../controllers/auth.controller')

const authenticate = require('../middleware/authenticate')
const validate = require('../middleware/validate')
const {
  registerValidator,
  ownerRegisterValidator,
  loginValidator,
  refreshValidator
} = require('../validators/auth.validator')

const { authLimiter } = require('../middleware/rateLimiter.middleware')

// public routes — no token needed
router.post('/register', authLimiter, registerValidator, validate, register)
router.post('/register-owner', authLimiter, ownerRegisterValidator, validate, registerOwner)
router.post('/login', authLimiter, loginValidator, validate, login)
router.post('/google', authLimiter, googleLogin)
router.post('/apple', authLimiter, appleLogin)
router.post('/refresh', authLimiter, refreshValidator, validate, refresh)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)
router.get('/verify-email', verifyEmail)
router.get('/verify-email-landing', verifyEmailLanding)
router.post('/resend-verification', authLimiter, resendVerification)

// protected routes — token required
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)
router.patch('/me', authenticate, updateMe)
router.post('/change-password', authenticate, changePassword)
router.delete('/delete-account', authenticate, deleteAccount)

module.exports = router