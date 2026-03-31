const AppError = require('../utils/AppError')
const logger = require('../utils/logger')

const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true'
const redis = REDIS_ENABLED ? require('../config/redis') : null

// ================================
// idempotency middleware
// ================================
// how it works:
//   client sends a unique key with every booking request
//   header: Idempotency-Key: <uuid>
//
//   first request with key X:
//     → process normally
//     → cache the response with key X for 24 hours
//     → return response
//
//   duplicate request with same key X:
//     → found in cache
//     → return SAME original response
//     → never hit the controller
//
// this means even if client sends 10 identical requests
// only 1 appointment is ever created

const IDEMPOTENCY_TTL = 60 * 60 * 24 // 24 hours
const IDEMPOTENCY_PREFIX = 'idem:'

const idempotency = async (req, res, next) => {
  // if Redis is not enabled — skip idempotency check
  // log a warning so developer knows
  if (!redis) {
    logger.warn('Idempotency check skipped — Redis not enabled')
    return next()
  }

  const idempKey = req.headers['idempotency-key']

  // if no key provided — block the request
  // booking without idempotency key is not allowed
  if (!idempKey) {
    return next(
      new AppError(
        'Idempotency-Key header is required for booking. Generate a UUID and send it in the header.',
        400
      )
    )
  }

  // validate key format — must be UUID v4
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(idempKey)) {
    return next(
      new AppError(
        'Invalid Idempotency-Key format. Must be a valid UUID v4.',
        400
      )
    )
  }

  // scope key to user — prevents one user using another user's key
  const scopedKey = `${IDEMPOTENCY_PREFIX}${req.user.userId}:${idempKey}`

  try {
    // check if we've seen this key before
    const cached = await redis.get(scopedKey)

    if (cached) {
      // duplicate request — return original response
      logger.info(`Idempotency hit: ${idempKey} — returning cached response`)

      const { statusCode, body } = JSON.parse(cached)

      return res.status(statusCode).json({
        ...body,
        // add header so client knows this was a cached response
        idempotent: true
      })
    }

    // first time seeing this key
    // intercept res.json to cache the response after it's sent
    const originalJson = res.json.bind(res)

    res.json = async (body) => {
      // only cache successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await redis.setex(
            scopedKey,
            IDEMPOTENCY_TTL,
            JSON.stringify({
              statusCode: res.statusCode,
              body
            })
          )
          logger.info(`Idempotency key cached: ${idempKey}`)
        } catch (err) {
          // if caching fails — still send the response
          // don't block the user
          logger.error(`Failed to cache idempotency key: ${err.message}`)
        }
      }

      return originalJson(body)
    }

    next()

  } catch (error) {
    // if Redis fails — let the request through
    // better to risk a duplicate than block all bookings
    logger.error(`Idempotency middleware error: ${error.message}`)
    next()
  }
}

module.exports = idempotency