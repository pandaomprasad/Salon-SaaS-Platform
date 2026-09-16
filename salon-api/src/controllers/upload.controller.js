const StorageService = require("../services/storage.service");
const logger = require("../utils/logger");

const sanitizeFolder = (folder) => {
  if (!folder || typeof folder !== "string") return "general";
  const sanitized = folder.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 50);
  return sanitized || "general";
};

/**
 * Handle single file upload
 */
const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file payload provided in request under form field 'file'",
      });
    }

    const folder = sanitizeFolder(req.query.folder || req.body.folder);
    const { userId, role, salonId, branchId } = req.user;

    const result = await StorageService.uploadBuffer({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder,
      uploadedBy: userId,
      salonId,
      branchId,
    });

    return res.status(201).json({
      success: true,
      message: result.isMock
        ? "File processed (Cloudflare R2 is running in development fallback mode)"
        : "File uploaded successfully to Cloudflare R2",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle multiple files upload (batch up to 5 files)
 */
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files payload provided in request under form field 'files'",
      });
    }

    const folder = sanitizeFolder(req.query.folder || req.body.folder);
    const { userId, role, salonId, branchId } = req.user;

    const uploadPromises = req.files.map((file) =>
      StorageService.uploadBuffer({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder,
        uploadedBy: userId,
        salonId,
        branchId,
      })
    );

    const results = await Promise.all(uploadPromises);

    return res.status(201).json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Presigned Upload URL for direct client-to-R2 upload
 */
const getPresignedUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "Mandatory fields 'fileName' and 'fileType' are required",
      });
    }

    const { userId, role, salonId, branchId } = req.user;

    const result = await StorageService.generatePresignedUploadUrl({
      fileName,
      fileType,
      folder: sanitizeFolder(folder),
      uploadedBy: userId,
      salonId,
      branchId,
    });

    return res.status(200).json({
      success: true,
      message: result.isMock
        ? "Presigned URL generated (Development fallback mode active)"
        : "Presigned upload URL generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete uploaded asset from Cloudflare R2
 */
const deleteFile = async (req, res, next) => {
  try {
    const fileUrl = req.body.fileUrl || req.body.key || req.query.fileUrl || req.query.key;
    const { userId, role } = req.user;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Please provide 'fileUrl' or 'key' to delete",
      });
    }

    const result = await StorageService.deleteFile(fileUrl, { userId, role });

    if (!result.success && result.code === "UNAUTHORIZED") {
      return res.status(403).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  getPresignedUrl,
  deleteFile,
};
