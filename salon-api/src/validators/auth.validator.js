const { body } = require('express-validator')

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain a special character'),
]

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required'),
]

const refreshValidator = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),
]

module.exports = { registerValidator, loginValidator, refreshValidator }