const CircuitBreaker = require("opossum");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");

// Default Circuit Breaker configuration for database operations
const defaultOptions = {
  timeout: 5000, // 5 seconds execution timeout before failing fast
  errorThresholdPercentage: 50, // Trip open circuit if 50% or more requests fail
  resetTimeout: 10000, // 10 seconds before testing half-open recovery
  name: "db-circuit-breaker",
};

// Map of named circuit breakers
const breakerRegistry = new Map();

/**
 * Gets or creates a circuit breaker instance for a given key/name
 * @param {Function} actionFn Async function wrapping the DB query
 * @param {Object} options Custom options
 */
const getOrCreateBreaker = (actionFn, options = {}) => {
  const name = options.name || "db-circuit-breaker";

  if (breakerRegistry.has(name)) {
    return breakerRegistry.get(name);
  }

  const breaker = new CircuitBreaker(actionFn, {
    ...defaultOptions,
    ...options,
    name,
  });

  breaker.fallback((err) => {
    logger.warn(`[CIRCUIT BREAKER FALLBACK] '${name}' open/failed: ${err.message}`);
    const serviceErr = new AppError(
      "Database service is temporarily struggling or unavailable. Please retry shortly.",
      503
    );
    serviceErr.retryAfter = 10;
    throw serviceErr;
  });

  breaker.on("open", () => {
    logger.error(`🚨 [CIRCUIT BREAKER OPEN] '${name}' TRIPPED! Fast failing incoming DB calls.`);
  });

  breaker.on("halfOpen", () => {
    logger.info(`🟡 [CIRCUIT BREAKER HALF-OPEN] '${name}' testing recovery...`);
  });

  breaker.on("close", () => {
    logger.info(`🟢 [CIRCUIT BREAKER CLOSED] '${name}' recovered normal DB operations.`);
  });

  breakerRegistry.set(name, breaker);
  return breaker;
};

/**
 * Executes a database operation wrapped in an opossum circuit breaker
 * @param {Function} fn Function returning a promise
 * @param {String} name Identifier for the circuit breaker
 */
const executeDbOperation = async (fn, name = "db-query") => {
  const breaker = getOrCreateBreaker(fn, { name });
  return breaker.fire();
};

module.exports = {
  createCircuitBreaker: getOrCreateBreaker,
  executeDbOperation,
};
