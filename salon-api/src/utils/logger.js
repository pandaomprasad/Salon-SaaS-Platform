const winston = require('winston')

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`
    })
  ),
  transports: [
    // always log to console
    new winston.transports.Console(),
    // log errors to a file
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ]
})

module.exports = logger