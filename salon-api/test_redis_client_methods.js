process.env.REDIS_ENABLED = "true";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";

const redisClient = require("./src/config/redis");

console.log("🔍 Diagnostic Inspection of Connected ioredis Instance:");
console.log("  typeof redisClient.sendCommand:", typeof redisClient.sendCommand);
console.log("  typeof redisClient.call:", typeof redisClient.call);

if (typeof redisClient.call === "function") {
  console.log("✅ redisClient.call IS A VALID FUNCTION on ioredis instance!");
} else {
  console.log("❌ redisClient.call IS NOT DEFINED!");
}

if (typeof redisClient.sendCommand === "function") {
  console.log("✅ redisClient.sendCommand IS A VALID FUNCTION on ioredis instance!");
} else {
  console.log("❌ redisClient.sendCommand IS NOT DEFINED!");
}

process.exit(0);
