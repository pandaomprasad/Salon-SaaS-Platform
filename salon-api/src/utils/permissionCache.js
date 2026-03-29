const Role = require("../models/role.model");
const logger = require("./logger");

const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";
const redis = REDIS_ENABLED ? require("../config/redis") : null;

const CACHE_TTL = 60 * 60 * 24;
const CACHE_PREFIX = "permissions:";

// ================================
// getRolePermissions
// ================================
// gets base permissions for a role
// cached in Redis for 24 hours

const getRolePermissions = async (roleName) => {
  try {
    if (redis) {
      const cacheKey = `${CACHE_PREFIX}${roleName}`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const role = await Role.findOne({ name: roleName }).populate("permissions");

    if (!role) return [];

    const permissionKeys = role.permissions.map(
      (p) => `${p.resource}:${p.action}`,
    );

    if (redis) {
      const cacheKey = `${CACHE_PREFIX}${roleName}`;
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(permissionKeys));
    }

    return permissionKeys;
  } catch (error) {
    logger.error(`Permission cache error: ${error.message}`);
    const role = await Role.findOne({ name: roleName }).populate("permissions");
    if (!role) return [];
    return role.permissions.map((p) => `${p.resource}:${p.action}`);
  }
};

// ================================
// getUserPermissions
// ================================
// gets FINAL permissions for a specific user
// merges role permissions + extra permissions
// then removes denied permissions
//
// flow:
//   1. get role base permissions
//   2. add user's extraPermissions
//   3. remove user's deniedPermissions
//   4. return final unique list

const getUserPermissions = async (roleName, userId) => {
  try {
    const User = require("../models/user.model");

    // get base role permissions
    const rolePermissions = await getRolePermissions(roleName);

    // get user specific overrides
    const user = await User.findById(userId)
      .select("extraPermissions deniedPermissions")
      .lean();

    if (!user) return rolePermissions;

    const extra = user.extraPermissions || [];
    const denied = user.deniedPermissions || [];

    // merge role + extra, then remove denied
    const merged = [...new Set([...rolePermissions, ...extra])];
    const final = merged.filter((p) => !denied.includes(p));

    return final;
  } catch (error) {
    logger.error(`getUserPermissions error: ${error.message}`);
    return await getRolePermissions(roleName);
  }
};

const bustRoleCache = async (roleName) => {
  if (!redis) return;
  try {
    await redis.del(`${CACHE_PREFIX}${roleName}`);
    logger.info(`Cache busted for role: ${roleName}`);
  } catch (error) {
    logger.error(`Cache bust error: ${error.message}`);
  }
};

module.exports = { getRolePermissions, getUserPermissions, bustRoleCache };
