const { performance } = require("perf_hooks");
const logger = require("../utils/logger");

/**
 * API Call Timing Middleware
 * Logs exact API request timing (duration in ms) and sets X-Response-Time header.
 */
const apiTiming = (req, res, next) => {
  const start = performance.now();
  const startTimeISO = new Date().toISOString();

  // Intercept writeHead to set X-Response-Time header before response headers are sent
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const durationMs = (performance.now() - start).toFixed(2);
      res.setHeader("X-Response-Time", `${durationMs}ms`);
    }
    return originalWriteHead.apply(this, args);
  };

  // Log summary on completion
  res.on("finish", () => {
    const durationMs = (performance.now() - start).toFixed(2);
    const status = res.statusCode;
    const statusSymbol = status >= 500 ? "❌" : status >= 400 ? "⚠️" : "✅";
    const logMsg = `⏱️ [API TIME] ${statusSymbol} ${req.method} ${req.originalUrl} | Status: ${status} | Duration: ${durationMs}ms | Started: ${startTimeISO}`;

    // Cyan output in console stdout for test log visibility
    console.log(`\x1b[36m${logMsg}\x1b[0m`);

    if (logger && typeof logger.info === "function") {
      logger.info(`[API TIME] ${req.method} ${req.originalUrl} - ${status} (${durationMs}ms)`);
    }
  });

  next();
};

module.exports = apiTiming;
