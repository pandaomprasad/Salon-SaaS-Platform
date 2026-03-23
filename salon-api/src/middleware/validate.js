const { validationResult } = require('express-validator')
const AppError = require('../utils/AppError')

// ================================
// validate middleware
// ================================
// works together with express-validator rules
//
// usage in routes:
//   router.post('/login',
//     [body('email').isEmail(), body('password').notEmpty()],
//     validate,         // <-- this middleware catches any validation errors
//     authController.login
//   )
//
// if any validation rule failed, we return a clean 400 response
// with all error messages listed — never reach the controller

const validate = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    // format errors into a clean array of messages
    const messages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg
    }))

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages
    })
  }

  next()
}

module.exports = validate