const { body } = require('express-validator')

const createStaffValidator = [
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
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number')
    .matches(/[!@#$%^&*]/).withMessage('Must contain a special character'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['manager', 'staff']).withMessage('Role must be manager or staff'),
]

const updateStaffValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('phone')
    .optional()
    .trim(),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be true or false'),
]

module.exports = { createStaffValidator, updateStaffValidator }