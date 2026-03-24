const { body } = require('express-validator')

const createBranchValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Branch name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('address.street')
    .trim()
    .notEmpty().withMessage('Street is required'),

  body('address.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('address.state')
    .trim()
    .notEmpty().withMessage('State is required'),

  body('address.pincode')
    .trim()
    .notEmpty().withMessage('Pincode is required'),

  body('contactPhone')
    .trim()
    .notEmpty().withMessage('Contact phone is required'),

  body('slotDurationMinutes')
    .optional()
    .isInt({ min: 15, max: 240 }).withMessage('Slot duration must be 15–240 minutes'),

  body('advanceBookingDays')
    .optional()
    .isInt({ min: 1, max: 90 }).withMessage('Advance booking must be 1–90 days'),

  body('workingHours')
    .optional()
    .isArray().withMessage('Working hours must be an array'),
]

const updateBranchValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('contactPhone')
    .optional()
    .trim(),

  body('slotDurationMinutes')
    .optional()
    .isInt({ min: 15, max: 240 }).withMessage('Slot duration must be 15–240 minutes'),

  body('workingHours')
    .optional()
    .isArray().withMessage('Working hours must be an array'),
]

module.exports = { createBranchValidator, updateBranchValidator }