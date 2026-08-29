// load .env file first before anything else
require("dotenv").config();
const validateEnvSecrets = require("./config/validateEnv");
validateEnvSecrets();

console.log("🚀 Starting Salon API Server...");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const connectDB = require("./config/database");
const logger = require("./utils/logger");

// ================================
// Initialize Express app
// ================================
const app = express();

// Trust proxy (required when behind tunnel/proxy like localtunnel, ngrok, NGINX, Vercel, Render)
app.set("trust proxy", 1);

// ================================
// Connect to MongoDB
// ================================
console.log("📦 Initializing database connection...");
connectDB();

// Register all models
console.log("📦 Registering Mongoose models...");
require("./models/permission.model");
require("./models/role.model");
require("./models/user.model");
require("./models/salon.model");
require("./models/branch.model");
require("./models/service.model");
require("./models/slot.model");
require("./models/appointment.model");
require("./models/staffLeave.model");
require("./models/notification.model");
require("./models/ownerRegistrationRequest.model");
const adminRoutes = require('./routes/admin.routes')
const adminController = require('./controllers/admin.controller')

// Initialize cron jobs
console.log("🕒 Initializing cron jobs...");
const { initCronJobs } = require("./config/cron");
initCronJobs();
console.log("✅ Cron jobs initialized.");

// ================================
// Security Middleware
// ================================

// helmet adds security headers to every response
app.use(helmet());

// Configure strict CORS for development, staging, & production
const parseAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) return [];
  return envOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
};

const allowedOriginsList = parseAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile native apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Development mode: allow explicit origins, localhost, local dev IPs
    if (process.env.NODE_ENV === "development") {
      if (
        allowedOriginsList.includes("*") ||
        allowedOriginsList.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }
    }

    // Production & Staging: Strict whitelist match ONLY (wildcards explicitly forbidden)
    if (allowedOriginsList.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS Security Violation: Origin ${origin} is not allowed by CORS policy.`)
    );
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "bypass-tunnel-reminder",
    "ngrok-skip-browser-warning",
    "X-Requested-With",
  ],
  exposedHeaders: ["X-Response-Time"],
  credentials: true,
};

app.use(cors(corsOptions));

// rate limiting — max 500 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 500,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api", limiter);

// ================================
// Body Parsing Middleware
// ================================
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ================================
// Request Logging & Timing & Prometheus Metrics
// ================================
const apiTiming = require("./middleware/apiTiming");
const { metricsMiddleware, metricsHandler } = require("./middleware/metrics.middleware");

app.use(apiTiming);
app.use(metricsMiddleware);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Prometheus scrapeable metrics endpoint
app.get("/metrics", metricsHandler);

// ================================
// OpenAPI Swagger UI Documentation
// ================================
const setupSwagger = require("./config/swagger");
setupSwagger(app);

// ================================
// Health Check & Diagnostics Route
// ================================
app.get("/health", async (req, res) => {
  const redisClient = require("./config/redis");
  let redisStatus = "OFFLINE (Fallback Active)";
  let totalKeys = 0;

  // Live MongoDB Diagnostic Ping
  let dbStatus = "DISCONNECTED";
  let dbPingMs = null;
  let isDbHealthy = false;

  try {
    const mongoState = mongoose.connection.readyState;
    if (mongoState === 1) { // 1 = connected
      const dbStart = Date.now();
      await mongoose.connection.db.admin().ping();
      dbPingMs = Date.now() - dbStart;
      dbStatus = "CONNECTED";
      isDbHealthy = true;
    } else {
      const stateNames = { 0: "DISCONNECTED", 2: "CONNECTING", 3: "DISCONNECTING" };
      dbStatus = stateNames[mongoState] || "UNKNOWN";
    }
  } catch (e) {
    dbStatus = `PING_FAILED (${e.message})`;
  }

  try {
    if (redisClient && redisClient.status === "ready") {
      redisStatus = "CONNECTED & ACTIVELY STORING DATA";
      const keys = await redisClient.scan(0, "COUNT", 50);
      totalKeys = (keys[1] || []).length;
    }
  } catch (e) {
    redisStatus = `OFFLINE (${e.message})`;
  }

  const isHealthy = isDbHealthy;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: isHealthy,
    message: isHealthy ? "Salon API Health Diagnostics" : "Service Unavailable: Database Ping Failed",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    databaseDiagnostics: {
      status: dbStatus,
      latencyMs: dbPingMs,
    },
    redisDiagnostics: {
      status: redisStatus,
      keysStored: totalKeys,
    },
  });
});

// ================================
// API Routes
// ================================
app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use('/api/v1/admin', adminRoutes);
app.use("/api/v1/browse", require("./routes/browse.routes"));
app.use("/api/v1/salons", require("./routes/salon.routes"));
app.use("/api/v1/salons/:salonId/branches", require("./routes/branch.routes"));
app.use("/api/v1/branches/:branchId/staff", require("./routes/staff.routes"));
app.use(
  "/api/v1/branches/:branchId/services",
  require("./routes/service.routes"),
);
app.use("/api/v1/branches/:branchId/slots", require("./routes/slot.routes"));
app.use("/api/v1/appointments", require("./routes/appointment.routes"));
app.use("/api/v1/customers", require("./routes/customer.routes"));
app.use("/api/v1/staff", require("./routes/staffSelf.routes"));
app.use("/api/v1/notifications", require("./routes/notification.routes"));
app.use("/api/v1/reports", require("./routes/report.routes"));
app.use("/api/v1/location", require("./routes/location.routes"));
app.use("/api/v1/banners", require("./routes/banner.routes"));
app.get('/api/v1/salon-status/:salonId', require('./middleware/authenticate'), adminController.getSalonStatus);

// ================================
// 404 Handler
// ================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ================================
// Global Error Handler
// ================================
app.use((err, req, res, next) => {
  logger.error(`${err.message} — ${req.method} ${req.originalUrl}`);

  const statusCode = err.statusCode || err.status || 500;

  if (statusCode === 503 || err.retryAfter) {
    res.setHeader("Retry-After", String(err.retryAfter || 10));
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    conflictAppointment: err.conflictAppointment || null,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ================================
// Start Server with WebSockets
// ================================
const http = require("http");
const { initSocket } = require("./config/socket");

const PORT = process.env.PORT || 6969;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode with WebSockets on port ${PORT}`);
  });
}

// Graceful shutdown process listeners
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log("🌐 Express server closed.");
    try {
      await mongoose.connection.close();
      console.log("📦 MongoDB connection closed.");
    } catch (e) {
      console.error("Error closing MongoDB connection:", e);
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = { app, server };
