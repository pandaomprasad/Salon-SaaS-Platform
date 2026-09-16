const multer = require("multer");

// Use memory storage so file buffers can be uploaded directly to Cloudflare R2
const storage = multer.memoryStorage();

// Allowed MIME types whitelist
// SVG removed due to XSS risk (can contain executable JavaScript)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

// 5 MB max file size limit for general uploads
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type '${file.mimetype}'. Allowed types: JPEG, PNG, WEBP, GIF, SVG, PDF.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

// Wrapper middleware to handle Multer specific error instances cleanly
const handleMulterError = (multerSingleOrArrayMiddleware) => {
  return (req, res, next) => {
    multerSingleOrArrayMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          message: err.message || "Invalid upload request",
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle: handleMulterError(upload.single("file")),
  uploadMultiple: handleMulterError(upload.array("files", 5)),
};
