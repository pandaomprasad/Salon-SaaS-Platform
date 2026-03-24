const { body } = require('express-validator')

const createSalonValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Salon name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('contactEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email'),

  body('contactPhone')
    .optional()
    .trim()
]

const updateSalonValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('contactEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email'),
]

module.exports = { createSalonValidator, updateSalonValidator }