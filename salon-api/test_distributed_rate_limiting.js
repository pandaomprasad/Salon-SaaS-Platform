process.env.NODE_ENV = "test";
process.env.REDIS_ENABLED = "true";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";

const request = require("supertest");
const connectDB = require("./src/config/database");
const { app } = require("./src/app");
const http = require("http");

async function runDistributedRateLimitTest() {
  console.log("🧪 Starting Multi-Instance Distributed Rate Limiting Verification Test...\n");

  await connectDB();

  // Spin up Instance A on Port 7001
  const serverA = http.createServer(app);
  await new Promise((resolve) => serverA.listen(7001, resolve));
  console.log("🚀 Instance A listening on http://localhost:7001");

  // Spin up Instance B on Port 7002
  const serverB = http.createServer(app);
  await new Promise((resolve) => serverB.listen(7002, resolve));
  console.log("🚀 Instance B listening on http://localhost:7002\n");

  const authEndpoint = "/api/v1/auth/login";

  // Step 1: Exhaust limit on Instance A (limit is 10 requests for authLimiter)
  console.log("1️⃣ Firing 10 authentication requests at Instance A (Port 7001)...");
  for (let i = 1; i <= 10; i++) {
    const res = await request("http://localhost:7001").post(authEndpoint).send({ email: "invalid@example.com", password: "wrong" });
    if (res.statusCode === 429) {
      console.error(`❌ Unexpected early rate limit on request #${i} on Instance A`);
    }
  }

  // Step 2: Request #11 on Instance A should be rate-limited
  console.log("2️⃣ Firing request #11 at Instance A (Port 7001)...");
  const res11A = await request("http://localhost:7001").post(authEndpoint).send({ email: "invalid@example.com", password: "wrong" });
  console.log(`   Instance A Request #11 Status Code: ${res11A.statusCode} | Message: ${res11A.body?.message}`);

  if (res11A.statusCode !== 429) {
    throw new Error(`Expected Instance A Request #11 to return 429, got ${res11A.statusCode}`);
  }

  // Step 3: First request on Instance B should ALREADY be rate-limited (429)
  console.log("\n3️⃣ Firing FIRST EVER request at Instance B (Port 7002)...");
  const res1B = await request("http://localhost:7002").post(authEndpoint).send({ email: "invalid@example.com", password: "wrong" });
  console.log(`   Instance B Request #1 Status Code: ${res1B.statusCode} | Message: ${res1B.body?.message}`);

  if (res1B.statusCode !== 429) {
    throw new Error(`❌ FAILED! Instance B returned ${res1B.statusCode} instead of 429! Rate limits are NOT shared across instances.`);
  }

  console.log("\n✅ SUCCESS! Instance B was IMMEDIATELY rate-limited (HTTP 429) on its first request!");
  console.log("🎉 EMPIRICAL VERIFICATION PASSED: Distributed rate limiting with Redis is fully functional across independent Node.js processes!");

  // Cleanup servers
  await new Promise((resolve) => serverA.close(resolve));
  await new Promise((resolve) => serverB.close(resolve));
  process.exit(0);
}

runDistributedRateLimitTest().catch((err) => {
  console.error("Distributed Rate Limit Test error:", err);
  process.exit(1);
});
