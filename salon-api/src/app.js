// load .env file first before anything else
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/database");
const logger = require("./utils/logger");

// ================================
// Initialize Express app
// ================================
const app = express();

// ================================
// Connect to MongoDB
// ================================
connectDB();

// Register all models
require("./models/permission.model");
require("./models/role.model");
require("./models/user.model");
require("./models/salon.model");
require("./models/branch.model");
require("./models/service.model");
require("./models/slot.model");
require("./models/appointment.model");
const adminRoutes = require('./routes/admin.routes')
const adminController = require('./controllers/admin.controller')


// Initialize cron jobs  ← add this
const { initCronJobs } = require("./config/cron");
initCronJobs();

// TEMPORARY — remove after testing
app.get("/test-cron", async (req, res) => {
  const { generateSlotsForAllBranches } = require("./utils/autoSlotGenerator");
  await generateSlotsForAllBranches();
  res.json({ success: true, message: "Slot generation ran manually" });
});
// ================================
// Security Middleware
// ================================

// helmet adds security headers to every response
// protects against common attacks like clickjacking, XSS
app.use(helmet());

// cors tells the server which clients are allowed to call it
// right now we allow all origins — we'll tighten this in production
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "bypass-tunnel-reminder",
      "ngrok-skip-browser-warning",
      "X-Requested-With",
    ],
  }),
);

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

// tells express to parse incoming JSON bodies
app.use(express.json({ limit: "5mb" })); // 10kb limit prevents huge payloads

// parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ================================
// Request Logging
// ================================

// morgan logs every HTTP request: method, url, status, response time
// "dev" format is colorful and compact — good for development
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ================================
// Health Check Route
// ================================

// simple route to check if the server is running
// useful for deployment pipelines and load balancers
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Salon API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// DEBUG — log every request before route matching
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
  next();
});

// ================================
// API Routes — we'll add these next
// ================================
app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use('/api/v1/admin', adminRoutes)
app.use("/api/v1/browse", require("./routes/browse.routes")); // ← add this
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
app.use("/api/v1/reports", require("./routes/report.routes"));
app.get('/api/v1/salon-status/:salonId', require('./middleware/authenticate'), adminController.getSalonStatus)

// ================================
// 404 Handler
// ================================

// if no route matched, send a clean 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ================================
// Global Error Handler
// ================================

// express calls this automatically when next(error) is called
// the 4-parameter signature is required for express to recognize it as error handler
app.use((err, req, res, next) => {
  logger.error(`${err.message} — ${req.method} ${req.originalUrl}`);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    conflictAppointment: err.conflictAppointment || null,
    // only show stack trace in development
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

server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode with WebSockets on port ${PORT}`);
});

module.exports = { app, server };
