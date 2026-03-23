const redis = require('../config/redis')
const Role = require('../models/role.model')
const logger = require('./logger')

// ================================
// Cache key format
// ================================
// "permissions:owner"   => ["salon:create", "salon:read", ...]
// "permissions:manager" => ["branch:read", "staff:create", ...]
// TTL = 24 hours

const CACHE_TTL = 60 * 60 * 24 // 24 hours in seconds
const CACHE_PREFIX = 'permissions:'

// ================================
// Get permissions for a role
// ================================
// flow:
//   1. check Redis cache first
//   2. if not cached → query MongoDB, then cache it
//   3. return array of "resource:action" strings

const getRolePermissions = async (roleName) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${roleName}`

    // step 1 — check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      // redis stores strings, so we parse the JSON array back
      return JSON.parse(cached)
    }

    // step 2 — not in cache, query MongoDB
    // populate('permissions') fetches the actual Permission documents
    // instead of just their ObjectIds
    const role = await Role.findOne({ name: roleName })
      .populate('permissions')

    if (!role) return []

    // convert permission documents to "resource:action" strings
    // e.g. { resource: "appointment", action: "read" } => "appointment:read"
    const permissionKeys = role.permissions.map(
      (p) => `${p.resource}:${p.action}`
    )

    // step 3 — save to Redis for next time
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(permissionKeys))

    logger.info(`Permissions cached for role: ${roleName}`)
    return permissionKeys

  } catch (error) {
    // if Redis is down, fall back to MongoDB — don't crash the app
    logger.error(`Permission cache error: ${error.message}`)

    const role = await Role.findOne({ name: roleName }).populate('permissions')
    if (!role) return []
    return role.permissions.map((p) => `${p.resource}:${p.action}`)
  }
}

// ================================
// Bust cache for a role
// ================================
// call this whenever a role's permissions are updated
// so the next request re-fetches from MongoDB

const bustRoleCache = async (roleName) => {
  try {
    await redis.del(`${CACHE_PREFIX}${roleName}`)
    logger.info(`Cache busted for role: ${roleName}`)
  } catch (error) {
    logger.error(`Cache bust error: ${error.message}`)
  }
}

module.exports = { getRolePermissions, bustRoleCache }