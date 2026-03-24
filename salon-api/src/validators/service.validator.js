const { body } = require('express-validator')

const createServiceValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Service name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['hair', 'skin', 'nails', 'makeup', 'spa', 'other'])
    .withMessage('Invalid category'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isInt({ min: 0 }).withMessage('Price must be a positive number in paise'),

  body('durationMinutes')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 15 }).withMessage('Minimum duration is 15 minutes'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Description cannot exceed 300 characters'),
]

const updateServiceValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('category')
    .optional()
    .isIn(['hair', 'skin', 'nails', 'makeup', 'spa', 'other'])
    .withMessage('Invalid category'),

  body('price')
    .optional()
    .isInt({ min: 0 }).withMessage('Price must be a positive number in paise'),

  body('durationMinutes')
    .optional()
    .isInt({ min: 15 }).withMessage('Minimum duration is 15 minutes'),
]

module.exports = { createServiceValidator, updateServiceValidator }