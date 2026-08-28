const { body } = require("express-validator");

const createServiceValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Service name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["hair", "skin", "nails", "makeup", "spa", "combo", "other"])
    .withMessage("Invalid category"),

  // price must be in paise — minimum ₹1 = 100 paise
  // maximum ₹100,000 = 10,000,000 paise (prevents absurd values)
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isInt({ min: 100, max: 10000000 })
    .withMessage(
      "Price must be in paise. Min ₹1 = 100 paise, Max ₹1,00,000 = 10000000 paise. Example: send 50000 for ₹500",
    ),

  body("durationMinutes")
    .notEmpty()
    .withMessage("Duration is required")
    .isInt({ min: 15, max: 480 })
    .withMessage("Duration must be between 15 and 480 minutes"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Description cannot exceed 300 characters"),

  body("packageOfferTag")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("Offer tag cannot exceed 150 characters"),

  body("includedServices")
    .optional()
    .isArray()
    .withMessage("Included services must be an array of strings"),

  body("image")
    .optional()
    .trim(),

  body("imageUrl")
    .optional()
    .trim(),
];

const updateServiceValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("category")
    .optional()
    .isIn(["hair", "skin", "nails", "makeup", "spa", "combo", "other"])
    .withMessage("Invalid category"),

  body("price")
    .optional()
    .isInt({ min: 100, max: 10000000 })
    .withMessage(
      "Price must be in paise. Min ₹1 = 100 paise, Max ₹1,00,000 = 10000000 paise. Example: send 50000 for ₹500",
    ),

  body("durationMinutes")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("Duration must be between 15 and 480 minutes"),

  body("packageOfferTag")
    .optional()
    .trim()
    .isLength({ max: 150 }),

  body("includedServices")
    .optional()
    .isArray(),

  body("image")
    .optional()
    .trim(),

  body("imageUrl")
    .optional()
    .trim(),
];

module.exports = { createServiceValidator, updateServiceValidator };
