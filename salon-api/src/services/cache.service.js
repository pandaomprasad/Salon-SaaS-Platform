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

const IN_MEMORY_FALLBACK_CACHE = new Map()
const INVALIDATE_CHANNEL = 'cache:invalidate'

let subClient = null
if (typeof redis.duplicate === 'function') {
  try {
    subClient = redis.duplicate()
    subClient.on('error', () => {})
    subClient.subscribe(INVALIDATE_CHANNEL, (err) => {
      if (!err) {
        logger.info(`[REDIS PUB/SUB] Subscribed to multi-instance invalidation channel: ${INVALIDATE_CHANNEL}`)
      }
    })

    subClient.on('message', (channel, message) => {
      if (channel === INVALIDATE_CHANNEL) {
        try {
          const payload = JSON.parse(message)
          if (payload.type === 'del' && payload.key) {
            IN_MEMORY_FALLBACK_CACHE.delete(payload.key)
            logger.info(`[REDIS PUB/SUB SYNC] Cleared local key: ${payload.key}`)
          } else if (payload.type === 'pattern' && payload.pattern) {
            const regexPattern = new RegExp('^' + payload.pattern.replace(/\*/g, '.*') + '$')
            for (const k of IN_MEMORY_FALLBACK_CACHE.keys()) {
              if (regexPattern.test(k)) {
                IN_MEMORY_FALLBACK_CACHE.delete(k)
              }
            }
            logger.info(`[REDIS PUB/SUB SYNC] Cleared local pattern: ${payload.pattern}`)
          }
        } catch (e) {}
      }
    })
  } catch (e) {
    logger.warn(`Redis Pub/Sub setup skipped: ${e.message}`)
  }
}

const { cacheHitsTotal, cacheMissesTotal } = require('./metrics.service')

const getCache = async (key) => {
  if (isRedisWorking) {
    try {
      const data = await redis.get(key)
      if (data) {
        logger.info(`[REDIS CACHE HIT] ${key}`)
        try { cacheHitsTotal.inc({ tier: 'layer2_redis' }) } catch (e) {}
        return JSON.parse(data)
      }
    } catch (err) {
      logger.warn(`Redis getCache error for key ${key}: ${err.message}`)
    }
  }

  // Fallback to fast in-memory TTL cache
  const memItem = IN_MEMORY_FALLBACK_CACHE.get(key)
  if (memItem) {
    if (Date.now() < memItem.expiresAt) {
      logger.info(`[MEMORY CACHE HIT] ${key}`)
      try { cacheHitsTotal.inc({ tier: 'layer1_memory' }) } catch (e) {}
      return memItem.value
    } else {
      IN_MEMORY_FALLBACK_CACHE.delete(key)
    }
  }

  try { cacheMissesTotal.inc() } catch (e) {}
  return null
}

const setCache = async (key, value, ttlSeconds = 300) => {
  // Always store in memory fallback cache for instant local hits
  IN_MEMORY_FALLBACK_CACHE.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  })

  // Prevent memory leak by bounding memory cache size
  if (IN_MEMORY_FALLBACK_CACHE.size > 300) {
    const oldestKey = IN_MEMORY_FALLBACK_CACHE.keys().next().value
    if (oldestKey) IN_MEMORY_FALLBACK_CACHE.delete(oldestKey)
  }

  if (!isRedisWorking) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    logger.info(`[REDIS CACHE SET] ${key} (TTL: ${ttlSeconds}s)`)
  } catch (err) {
    logger.warn(`Redis setCache error for key ${key}: ${err.message}`)
  }
}

const delCache = async (key) => {
  IN_MEMORY_FALLBACK_CACHE.delete(key)
  if (isRedisWorking) {
    try {
      await redis.del(key)
      logger.info(`[REDIS CACHE DEL] ${key}`)
      if (typeof redis.publish === 'function') {
        await redis.publish(INVALIDATE_CHANNEL, JSON.stringify({ type: 'del', key }))
      }
    } catch (err) {
      logger.warn(`Redis delCache error for key ${key}: ${err.message}`)
    }
  }
}

const delCachePattern = async (pattern) => {
  // Clear pattern from in-memory cache
  const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  for (const k of IN_MEMORY_FALLBACK_CACHE.keys()) {
    if (regexPattern.test(k)) {
      IN_MEMORY_FALLBACK_CACHE.delete(k)
    }
  }

  if (isRedisWorking) {
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

      if (typeof redis.publish === 'function') {
        await redis.publish(INVALIDATE_CHANNEL, JSON.stringify({ type: 'pattern', pattern }))
      }
    } catch (err) {
      logger.warn(`Redis delCachePattern error for pattern ${pattern}: ${err.message}`)
    }
  }
}

const invalidateCatalogCache = async (options = {}) => {
  try {
    await delCachePattern('salons:list:*')
    await delCachePattern('initial_load:*')
    if (options.salonId) {
      await delCachePattern(`salon:detail:${options.salonId}*`)
    }
    if (options.branchId) {
      await delCachePattern(`branch:detail:${options.branchId}*`)
      await delCachePattern(`branch:services:${options.branchId}:*`)
    }
  } catch (err) {
    logger.warn(`invalidateCatalogCache error: ${err.message}`)
  }
}

module.exports = {
  getCache,
  setCache,
  delCache,
  delCachePattern,
  deleteCache: delCache,
  deleteCachePattern: delCachePattern,
  invalidateCatalogCache,
}
