const router = require('express').Router()
const {
  register,
  registerOwner,
  login,
  googleLogin,
  refresh,
  logout,
  me
} = require('../controllers/auth.controller')

const authenticate = require('../middleware/authenticate')
const validate = require('../middleware/validate')
const {
  registerValidator,
  ownerRegisterValidator,
  loginValidator,
  refreshValidator
} = require('../validators/auth.validator')

// public routes — no token needed
router.post('/register', registerValidator, validate, register)
router.post('/register-owner', ownerRegisterValidator, validate, registerOwner)
router.post('/login',    loginValidator,    validate, login)
router.post('/google',   googleLogin)
router.post('/refresh',  refreshValidator,  validate, refresh)

// protected routes — token required
router.post('/logout', authenticate, logout)
router.get('/me',      authenticate, me)

module.exports = router