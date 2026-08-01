const Redis = require('ioredis')
const logger = require('../utils/logger')

const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || process.env.REDISHOST || 'localhost',
      port: process.env.REDIS_PORT || process.env.REDISPORT || 6379,
      password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    }

const redis = new Redis(redisConfig)

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error(`Redis error: ${err.message}`))

module.exports = redis