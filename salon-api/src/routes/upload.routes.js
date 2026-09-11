const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { uploadSingle, uploadMultiple } = require("../middleware/upload.middleware");
const uploadController = require("../controllers/upload.controller");

// All upload routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/upload/single
 * @desc    Upload a single image or PDF document to Cloudflare R2
 * @access  Private (Authenticated users)
 */
router.post("/single", uploadSingle, uploadController.uploadSingle);

/**
 * @route   POST /api/v1/upload/multiple
 * @desc    Batch upload up to 5 images to Cloudflare R2
 * @access  Private (Authenticated users)
 */
router.post("/multiple", uploadMultiple, uploadController.uploadMultiple);

/**
 * @route   POST /api/v1/upload/presigned-url
 * @desc    Generate a presigned URL for direct client-side upload to R2
 * @access  Private (Authenticated users)
 */
router.post("/presigned-url", uploadController.getPresignedUrl);

/**
 * @route   DELETE /api/v1/upload
 * @desc    Delete an asset from Cloudflare R2 by file URL or key
 * @access  Private (Authenticated users)
 */
router.delete("/", uploadController.deleteFile);

module.exports = router;
