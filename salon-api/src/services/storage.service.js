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
  static async uploadBuffer({ buffer, originalName, mimeType, folder = "uploads" }) {
    const ext = this._getExtension(originalName, mimeType);
    const uniqueHash = crypto.randomBytes(8).toString("hex");
    const key = `${folder}/${Date.now()}-${uniqueHash}.${ext}`;

    if (!isConfigured || !s3Client) {
      logger.warn(
        `[StorageService] R2 not configured. Mocking upload for key '${key}'. Set R2 environment variables to upload to cloud.`
      );
      return {
        url: `https://placeholder.yoursalon.com/${key}`,
        key,
        bucket: bucketName,
        size: buffer ? buffer.length : 0,
        mimeType,
        isMock: true,
      };
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

      return {
        url: publicUrl,
        key,
        bucket: bucketName,
        size: buffer.length,
        mimeType,
        isMock: false,
      };
    } catch (error) {
      logger.error(`🚨 Cloudflare R2 Upload Error for key '${key}': ${error.message}`);
      throw new Error(`Cloud storage upload failed: ${error.message}`);
    }
  }

  /**
   * Delete an object from Cloudflare R2 bucket
   */
  static async deleteFile(fileUrlOrKey) {
    if (!fileUrlOrKey) return { success: false, message: "No file URL or key provided" };

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

    if (!isConfigured || !s3Client) {
      logger.warn(`[StorageService] R2 not configured. Mocking deletion for key '${key}'.`);
      return { success: true, key, isMock: true };
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`🗑️ Deleted asset from Cloudflare R2: ${key}`);

      return { success: true, key, isMock: false };
    } catch (error) {
      logger.error(`🚨 Cloudflare R2 Deletion Error for key '${key}': ${error.message}`);
      throw new Error(`Cloud storage deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate a Presigned Upload URL for direct client-to-R2 uploads
   */
  static async generatePresignedUploadUrl({ fileName, fileType, folder = "uploads", expiresIn = 900 }) {
    const ext = this._getExtension(fileName, fileType);
    const uniqueHash = crypto.randomBytes(8).toString("hex");
    const key = `${folder}/${Date.now()}-${uniqueHash}.${ext}`;

    if (!isConfigured || !s3Client) {
      logger.warn(`[StorageService] R2 not configured. Mocking presigned URL for key '${key}'.`);
      return {
        uploadUrl: `https://placeholder.yoursalon.com/upload-mock?key=${key}`,
        publicUrl: `https://placeholder.yoursalon.com/${key}`,
        key,
        expiresIn,
        isMock: true,
      };
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

      return {
        uploadUrl,
        publicUrl,
        key,
        expiresIn,
        isMock: false,
      };
    } catch (error) {
      logger.error(`🚨 Cloudflare R2 Presigned URL Error: ${error.message}`);
      throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
    }
  }
}

module.exports = StorageService;
