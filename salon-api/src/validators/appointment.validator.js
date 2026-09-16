const { body } = require('express-validator');
const mongoose = require('mongoose');

const bookAppointmentValidator = [
  body('slotId')
    .notEmpty()
    .withMessage('Slot ID is required')
    .isMongoId()
    .withMessage('Invalid Slot ID format'),

  body('serviceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Service ID format'),

  body('serviceIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('serviceIds must be a non-empty array')
    .custom((value) => value.every((id) => mongoose.Types.ObjectId.isValid(id)))
    .withMessage('Each serviceId must be a valid MongoDB ObjectId'),

  body('guests')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Guests must be an integer between 1 and 10'),

  body('customerNotes')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Customer notes cannot exceed 500 characters')
    .escape(),
];

module.exports = { bookAppointmentValidator };
