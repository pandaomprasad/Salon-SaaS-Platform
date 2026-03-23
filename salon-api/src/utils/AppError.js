// AppError is a custom error class
// it extends the built-in Error class
// so we can attach a statusCode to it
//
// usage anywhere in the app:
//   throw new AppError('Not found', 404)
//   next(new AppError('Unauthorized', 401))

class AppError extends Error {
  constructor(message, statusCode) {
    // call the parent Error constructor with the message
    super(message)

    this.statusCode = statusCode

    // 4xx = client error (their fault)
    // 5xx = server error (our fault)
    this.isOperational = true

    // captures the stack trace cleanly
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError