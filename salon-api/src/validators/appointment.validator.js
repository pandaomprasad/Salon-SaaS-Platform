const { body } = require('express-validator');

const bookAppointmentValidator = [
  body('slotId')
    .notEmpty()
    .withMessage('Slot ID is required')
    .isMongoId()
    .withMessage('Invalid Slot ID format'),

  body('customerNotes')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Customer notes cannot exceed 500 characters')
    .escape(), // Escapes HTML entities (< > & " ') to prevent stored XSS
];

module.exports = { bookAppointmentValidator };
