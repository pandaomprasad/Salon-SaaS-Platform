const { S3Client } = require("@aws-sdk/client-s3");
const logger = require("../utils/logger");

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "salon-saas-media";
const publicDomain = process.env.R2_PUBLIC_DOMAIN || "";

const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey);

let s3Client = null;

if (isConfigured) {
  try {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    logger.info("☁️ Cloudflare R2 S3 Storage Client successfully initialized.");
  } catch (err) {
    logger.error(`Failed to initialize Cloudflare R2 S3 Client: ${err.message}`);
  }
} else {
  logger.warn(
    "⚠️ Cloudflare R2 credentials missing (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY). Cloud storage operations will run in fallback/mock mode."
  );
}

module.exports = {
  s3Client,
  bucketName,
  publicDomain: publicDomain.replace(/\/+$/, ""), // strip trailing slash
  isConfigured,
};
