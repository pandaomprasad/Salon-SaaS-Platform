const Redis = require('ioredis')
const logger = require('../utils/logger')

// ================================
// Redis is OPTIONAL
// ================================
// If Redis isn't configured (e.g. Railway without a provisioned Redis
// service) we don't create a client at all. The cache service then
// silently falls back to the database instead of spamming error logs
// with connection-retry failures on every request.
//
// To enable caching, set any of:
//   REDIS_URL=https://...
//   REDIS_HOST + REDIS_PORT + (optional REDIS_PASSWORD)
// To force-disable even when host vars exist: REDIS_ENABLED=false
// ================================

const isEnabled = (process.env.REDIS_ENABLED ?? 'true').toLowerCase() !== 'false'
const isConfigured = Boolean(
  process.env.REDIS_URL ||
    process.env.REDIS_HOST ||
    process.env.REDISHOST,
)

let redis

if (!isEnabled || !isConfigured) {
  logger.info(
    'Redis not configured — caching disabled, falling back to the database',
  )
  // No-op stub that satisfies the cache.service API without connecting.
  redis = {
    on: () => {},
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    scan: async () => ['0', []],
  }
} else {
  const host = process.env.REDIS_HOST || process.env.REDISHOST || ''
  const isUpstash = host.includes('upstash.io') || (process.env.REDIS_URL || '').includes('upstash.io')

  const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
        host: host || 'localhost',
        port: Number(process.env.REDIS_PORT || process.env.REDISPORT) || 6379,
        password:
          process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
        ...(isUpstash && { tls: { rejectUnauthorized: false } }),
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => (times > 10 ? null : Math.min(times * 50, 2000)),
      }

  redis = new Redis(redisConfig)

  redis.on('connect', () => logger.info('Redis connected'))
  redis.on('end', () =>
    logger.warn('Redis connection closed — continuing without cache'),
  )
  // 'error' events are handled once in cache.service (it logs a single
  // warning and flips to the database fallback), so we don't double-log
  // every retry attempt here.
}

module.exports = redis