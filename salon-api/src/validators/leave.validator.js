const { body, param } = require("express-validator")

// ================================
// Leave validators
// ================================
// Shared field validation for create + update.
// Type-specific required fields are enforced in the controller
// (validateValidLeave) because they depend on each other (e.g. RANGE
// needs both startDate and endDate) which express-validator models
// awkwardly.

const leaveDate = (field, { optional = false } = {}) => {
  const chain = optional ? body(field).optional() : body(field)
  return chain
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${field} must be in YYYY-MM-DD format`)
}

const leaveTime = (field, { optional = false } = {}) => {
  const chain = optional ? body(field).optional() : body(field)
  return chain
    .trim()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage(`${field} must be in HH:MM format`)
}

const leaveIdParam = [
  param("branchId").isMongoId().withMessage("Invalid branch id"),
  param("staffId").isMongoId().withMessage("Invalid staff id"),
]

const createLeaveValidator = [
  ...leaveIdParam,
  body("type")
    .optional()
    .isIn(["SINGLE", "RANGE", "RECURRING"])
    .withMessage("type must be SINGLE, RANGE, or RECURRING"),
  leaveDate("date", { optional: true }),
  leaveDate("startDate", { optional: true }),
  leaveDate("endDate", { optional: true }),
  body("weekdays")
    .optional()
    .isArray({ min: 1 })
    .withMessage("weekdays must be an array")
    .custom((val) => val.every((d) => d >= 0 && d <= 6))
    .withMessage("weekdays must contain numbers 0-6"),
  leaveTime("startTime", { optional: true }),
  leaveTime("endTime", { optional: true }),
  body("reason")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("reason cannot exceed 200 characters"),
]

const updateLeaveValidator = [
  param("leaveId").isMongoId().withMessage("Invalid leave id"),
  ...createLeaveValidator,
]

// approve — params only, no body
const approveLeaveValidator = [
  ...leaveIdParam,
  param("leaveId").isMongoId().withMessage("Invalid leave id"),
]

// reject — optional rejectionReason
const rejectLeaveValidator = [
  ...approveLeaveValidator,
  body("rejectionReason")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("rejectionReason cannot exceed 200 characters"),
]

// self-service routes have no branchId/staffId in the URL
const myLeaveValidator = [
  body("type")
    .optional()
    .isIn(["SINGLE", "RANGE", "RECURRING"])
    .withMessage("type must be SINGLE, RANGE, or RECURRING"),
  leaveDate("date", { optional: true }),
  leaveDate("startDate", { optional: true }),
  leaveDate("endDate", { optional: true }),
  body("weekdays")
    .optional()
    .isArray({ min: 1 })
    .withMessage("weekdays must be an array")
    .custom((val) => val.every((d) => d >= 0 && d <= 6))
    .withMessage("weekdays must contain numbers 0-6"),
  leaveTime("startTime", { optional: true }),
  leaveTime("endTime", { optional: true }),
  body("reason")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("reason cannot exceed 200 characters"),
]

module.exports = {
  createLeaveValidator,
  updateLeaveValidator,
  approveLeaveValidator,
  rejectLeaveValidator,
  myLeaveValidator,
  leaveIdParam,
}