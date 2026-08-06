const redis = require('../config/redis')
const logger = require('../utils/logger')

let isRedisWorking = true

redis.on('error', (err) => {
  if (isRedisWorking) {
    logger.warn(`Redis connection unavailable, falling back to database: ${err.message}`)
  }
  isRedisWorking = false
})

redis.on('connect', () => {
  isRedisWorking = true
  logger.info('Redis connection established')
})

const getCache = async (key) => {
  if (!isRedisWorking) return null
  try {
    const data = await redis.get(key)
    if (data) {
      logger.info(`[REDIS CACHE HIT] ${key}`)
      return JSON.parse(data)
    }
  } catch (err) {
    logger.warn(`Redis getCache error for key ${key}: ${err.message}`)
  }
  return null
}

const setCache = async (key, value, ttlSeconds = 300) => {
  if (!isRedisWorking) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    logger.info(`[REDIS CACHE SET] ${key} (TTL: ${ttlSeconds}s)`)
  } catch (err) {
    logger.warn(`Redis setCache error for key ${key}: ${err.message}`)
  }
}

const delCache = async (key) => {
  if (!isRedisWorking) return
  try {
    await redis.del(key)
    logger.info(`[REDIS CACHE DEL] ${key}`)
  } catch (err) {
    logger.warn(`Redis delCache error for key ${key}: ${err.message}`)
  }
}

const delCachePattern = async (pattern) => {
  if (!isRedisWorking) return
  try {
    // SCAN is non-blocking and incremental — KEYS() blocks Redis for the
    // entire key space, which stalls every other request while it runs.
    let cursor = '0'
    let totalDeleted = 0
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      )
      cursor = nextCursor
      if (keys && keys.length > 0) {
        await redis.del(...keys)
        totalDeleted += keys.length
      }
    } while (cursor !== '0')
    if (totalDeleted > 0) {
      logger.info(`[REDIS CACHE PATTERN DEL] ${pattern} (${totalDeleted} keys removed)`)
    }
  } catch (err) {
    logger.warn(`Redis delCachePattern error for pattern ${pattern}: ${err.message}`)
  }
}

module.exports = {
  getCache,
  setCache,
  delCache,
  delCachePattern,
}
