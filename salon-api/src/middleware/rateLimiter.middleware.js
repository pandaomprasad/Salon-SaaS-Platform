const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");

// Helper to create RedisStore using existing Redis client connection (src/config/redis.js)
const createRedisStore = (prefix) => {
  if (redisClient && (typeof redisClient.call === "function" || typeof redisClient.sendCommand === "function")) {
    return new RedisStore({
      sendCommand: (...args) => {
        if (typeof redisClient.call === "function") {
          return redisClient.call(...args);
        }
        return redisClient.sendCommand(...args);
      },
      prefix: `rl:${prefix}:`,
    });
  } else {
    logger.warn(`⚠️ Redis client not available for rate limiter [${prefix}] — falling back to per-process MemoryStore. Distributed rate limiting is INACTIVE.`);
    return undefined; // Fallback to MemoryStore
  }
};

const userKeyGenerator = (req) => req.user?.userId || req.headers['x-forwarded-for'] || req.ip;

// General API rate limiter (200 requests per 15 mins)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  store: createRedisStore("api"),
  message: {
    success: false,
    message: "Too many requests from this client. Please try again later.",
  },
});

// Strict auth rate limiter for login / register / OTP endpoints (10 requests per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  store: createRedisStore("auth"),
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// Booking rate limiter for appointment creation (30 requests per 15 mins)
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  store: createRedisStore("booking"),
  message: {
    success: false,
    message: "Too many booking requests. Please wait a moment before trying again.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  bookingLimiter,
};
