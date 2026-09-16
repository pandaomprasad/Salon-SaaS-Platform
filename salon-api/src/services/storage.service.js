const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const path = require("path");
const { s3Client, bucketName, publicDomain, isConfigured } = require("../config/r2.config");
const logger = require("../utils/logger");
const UploadedFile = require("../models/uploadedFile.model");

class StorageService {
  /**
   * Helper to derive file extension safely
   */
  static _getExtension(originalName, mimeType) {
    const ext = path.extname(originalName || "").toLowerCase();
    if (ext) return ext.replace(".", "");

    const mimeMap = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/svg+xml": "svg",
      "application/pdf": "pdf",
    };
    return mimeMap[mimeType] || "bin";
  }

  /**
   * Helper to format public CDN URL for an R2 object key
   */
  static _getPublicUrl(key) {
    if (publicDomain) {
      return `${publicDomain}/${key}`;
    }
    return `https://${bucketName}.r2.dev/${key}`;
  }

  /**
   * Upload a raw file Buffer to Cloudflare R2
   */
  static async uploadBuffer({ buffer, originalName, mimeType, folder = "uploads", uploadedBy, salonId, branchId }) {
    const ext = this._getExtension(originalName, mimeType);
    const uniqueHash = crypto.randomBytes(8).toString("hex");
    const key = `${folder}/${Date.now()}-${uniqueHash}.${ext}`;

    if (!isConfigured || !s3Client) {
      logger.warn(
        `[StorageService] R2 not configured. Mocking upload for key '${key}'. Set R2 environment variables to upload to cloud.`
      );
      const mockResult = {
        url: `https://placeholder.yoursalon.com/${key}`,
        key,
        bucket: bucketName,
        size: buffer ? buffer.length : 0,
        mimeType,
        isMock: true,
      };
      if (uploadedBy) {
        await UploadedFile.create({
          key,
          url: mockResult.url,
          originalName,
          mimeType,
          size: buffer ? buffer.length : 0,
          folder,
          uploadedBy,
          salonId,
          branchId,
          isMock: true,
        });
      }
      return mockResult;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);
      const publicUrl = this._getPublicUrl(key);

      logger.info(`✅ Uploaded asset to Cloudflare R2: ${key}`);

      const result = {
        url: publicUrl,
        key,
        bucket: bucketName,
        size: buffer.length,
        mimeType,
        isMock: false,
      };

      if (uploadedBy) {
        await UploadedFile.create({
          key,
          url: publicUrl,
          originalName,
          mimeType,
          size: buffer.length,
          folder,
          uploadedBy,
          salonId,
          branchId,
          isMock: false,
        });
      }

      return result;
    } catch (error) {
      logger.error(`🚨 Cloudflare R2 Upload Error for key '${key}': ${error.message}`);
      throw new Error(`Cloud storage upload failed: ${error.message}`);
    }
  }

  /**
   * Delete an object from Cloudflare R2 bucket
   * @param {string} fileUrlOrKey - The file URL or key to delete
   * @param {Object} options - Options for ownership verification
   * @param {string} options.userId - The user ID requesting the deletion
   * @param {string[]} options.allowedRoles - Roles that can delete any file (e.g., ['owner', 'admin', 'manager'])
   * @param {string} options.role - The role of the user requesting deletion
   * @returns {Promise<Object>} Result of deletion
   */
  static async deleteFile(fileUrlOrKey, options = {}) {
    if (!fileUrlOrKey) return { success: false, message: "No file URL or key provided" };

    const { userId, allowedRoles = ["owner", "admin", "manager"], role } = options;

    // Extract key if a full URL was provided
    let key = fileUrlOrKey;
    if (fileUrlOrKey.startsWith("http://") || fileUrlOrKey.startsWith("https://")) {
      try {
        const parsed = new URL(fileUrlOrKey);
        key = parsed.pathname.replace(/^\/+/, ""); // strip leading slash
      } catch (e) {
        key = fileUrlOrKey;
      }
    }

    // Verify ownership before deletion
    if (userId) {
      const fileRecord = await UploadedFile.findOne({ key });
      if (fileRecord) {
        const isOwner = fileRecord.uploadedBy.toString() === userId.toString();
        const hasElevatedRole = allowedRoles.includes(role);

        if (!isOwner && !hasElevatedRole) {
          logger.warn(`🚫 Unauthorized deletion attempt: user ${userId} (role: ${role}) tried to delete file ${key} owned by ${fileRecord.uploadedBy}`);
          return { success: false, message: "Unauthorized: You can only delete files you uploaded", code: "UNAUTHORIZED" };
        }
      } else {
        // File not tracked in DB - could be a legacy file or external file
        // For safety, only allow elevated roles to delete untracked files
        if (!allowedRoles.includes(role)) {
          logger.warn(`🚫 Unauthorized deletion attempt: user ${userId} (role: ${role}) tried to delete untracked file ${key}`);
          return { success: false, message: "Unauthorized: File ownership cannot be verified", code: "UNAUTHORIZED" };
        }
      }
    }

    if (!isConfigured || !s3Client) {
      logger.warn(`[StorageService] R2 not configured. Mocking deletion for key '${key}'.`);
      // Still remove from DB if tracked
      await UploadedFile.deleteOne({ key });
      return { success: true, key, isMock: true };
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`🗑️ Deleted asset from Cloudflare R2: ${key}`);

      // Remove from tracking DB
      await UploadedFile.deleteOne({ key });

      return { success: true, key, isMock: false };
    } catch (error) {
      logger.error(`🚨 Cloudflare R2 Deletion Error for key '${key}': ${error.message}`);
      throw new Error(`Cloud storage deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate a Presigned Upload URL for direct client-to-R2 uploads
   */
  static async generatePresignedUploadUrl({ fileName, fileType, folder = "uploads", expiresIn = 900, uploadedBy, salonId, branchId }) {
    const ext = this._getExtension(fileName, fileType);
    const uniqueHash = crypto.randomBytes(8).toString("hex");
    const key = `${folder}/${Date.now()}-${uniqueHash}.${ext}`;

    if (!isConfigured || !s3Client) {
      logger.warn(`[StorageService] R2 not configured. Mocking presigned URL for key '${key}'.`);
      const mockResult = {
        uploadUrl: `https://placeholder.yoursalon.com/upload-mock?key=${key}`,
        publicUrl: `https://placeholder.yoursalon.com/${key}`,
        key,
        expiresIn,
        isMock: true,
      };
      if (uploadedBy) {
        await UploadedFile.create({
          key,
          url: mockResult.publicUrl,
          originalName: fileName,
          mimeType: fileType,
          size: 0,
          folder,
          uploadedBy,
          salonId,
          branchId,
          isMock: true,
        });
      }
      return mockResult;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
      const publicUrl = this._getPublicUrl(key);

      logger.info(`🔑 Generated R2 presigned upload URL for key: ${key}`);

      const result = {
        uploadUrl,
        publicUrl,
        key,
        expiresIn,
        isMock: false,
      };

      if (uploadedBy) {
        await UploadedFile.create({
          key,
          url: publicUrl,
          originalName: fileName,
          mimeType: fileType,
          size: 0,
          folder,
          uploadedBy,
          salonId,
          branchId,
          isMock: false,
        });
      }

      return result;
    } catch (error) {
      logger.error(`🚨 Cloudflare R2 Presigned URL Error: ${error.message}`);
      throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
    }
  }
}

module.exports = StorageService;
