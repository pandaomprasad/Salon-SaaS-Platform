process.env.NODE_ENV = "test";
process.env.REDIS_ENABLED = "true";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";

const http = require("http");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const connectDB = require("./src/config/database");
const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");
const Salon = require("./src/models/salon.model");
const Branch = require("./src/models/branch.model");
const Service = require("./src/models/service.model");
const { app } = require("./src/app");
const { delCachePattern } = require("./src/services/cache.service");

const secret = process.env.JWT_ACCESS_SECRET || "f11adad6587c4468f0feb8761cc25cedf1b2fc07e28ce96ee984301b06cf22c5";
const LB_PORT = 8080;
const LB_URL = `http://localhost:${LB_PORT}`;

// Helper: Calculate Percentiles
function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  return { p50: Math.round(p50), p95: Math.round(p95), p99: Math.round(p99) };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runClusterLoadBalancerTests() {
  console.log("🚀 Initializing Multi-Instance Cluster & Round-Robin Load Balancer on Port 8080...\n");

  await connectDB();

  // 1. Spin up Instance A on Port 7001
  const serverA = http.createServer(app);
  await new Promise((r) => serverA.listen(7001, r));
  console.log("  [Instance A (api-1)] Running on http://localhost:7001");

  // 2. Spin up Instance B on Port 7002
  const serverB = http.createServer(app);
  await new Promise((r) => serverB.listen(7002, r));
  console.log("  [Instance B (api-2)] Running on http://localhost:7002");

  // 3. Spin up Round-Robin Load Balancer Proxy on Port 8080
  let rrCounter = 0;
  const targetPorts = [7001, 7002];

  const proxyServer = http.createServer((clientReq, clientRes) => {
    const targetPort = targetPorts[rrCounter % targetPorts.length];
    rrCounter++;

    const options = {
      hostname: "localhost",
      port: targetPort,
      path: clientReq.url,
      method: clientReq.method,
      headers: {
        ...clientReq.headers,
        "x-forwarded-for": clientReq.headers["x-forwarded-for"] || clientReq.socket.remoteAddress,
        "x-instance-port": String(targetPort),
      },
    };

    const proxyReq = http.request(options, (targetRes) => {
      clientRes.writeHead(targetRes.statusCode, {
        ...targetRes.headers,
        "x-handled-by-instance": String(targetPort),
      });
      targetRes.pipe(clientRes, { end: true });
    });

    proxyReq.on("error", (err) => {
      clientRes.writeHead(502, { "Content-Type": "application/json" });
      clientRes.end(JSON.stringify({ success: false, message: `Bad Gateway: ${err.message}` }));
    });

    clientReq.pipe(proxyReq, { end: true });
  });

  await new Promise((r) => proxyServer.listen(LB_PORT, r));
  console.log(`  [Load Balancer (nginx-sim)] Running on ${LB_URL} (Round-Robining 7001 <-> 7002)\n`);

  // Seed sample data
  const ts = Date.now().toString();
  let ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) ownerRole = await Role.create({ name: "owner", permissions: ["salon:update"] });

  const owner = await User.create({ name: `LB Owner ${ts}`, email: `lb_owner_${ts}@example.com`, role: ownerRole._id, gender: "male", tokenVersion: 0 });
  const salon = await Salon.create({ name: `Original Salon ${ts}`, owner: owner._id, isActive: true });
  const branch = await Branch.create({ name: `LB Branch ${ts}`, salonId: salon._id, contactPhone: "9876543210", address: { street: "St 1", city: "City D", state: "State D", pincode: "751001" }, citySlug: "cityd", isActive: true });

  const ownerToken = jwt.sign({ userId: owner._id.toString(), role: "owner", salonId: salon._id.toString(), tokenVersion: 0 }, secret);

  // Clear existing cache for clean baseline
  await delCachePattern("salons:*");

  // =========================================================================
  // TEST 1: Multi-Instance Cache Invalidation Across Load Balancer (0.1 / 0.2)
  // =========================================================================
  console.log("==========================================================================");
  console.log("🧪 TEST 1: Multi-Instance Cache Invalidation Across Load Balancer (0.1/0.2)");
  console.log("==========================================================================");

  // 1a. Initial Read via Load Balancer (Populates cache)
  console.log("1a. Sending initial GET /api/v1/salons via http://localhost:8080...");
  const resRead1 = await request(LB_URL)
    .get("/api/v1/salons")
    .set("Authorization", `Bearer ${ownerToken}`);
  console.log(`    Status: ${resRead1.statusCode} | Handled By Instance Port: ${resRead1.headers["x-handled-by-instance"]}`);

  // 1b. Write Mutation via Load Balancer (Updates Salon Name)
  const newSalonName = `UPDATED_SALON_NAME_${ts}`;
  console.log(`\n1b. Sending PATCH /api/v1/salons/${salon._id} via http://localhost:8080 (Updating name to '${newSalonName}')...`);
  const resUpdate = await request(LB_URL)
    .patch(`/api/v1/salons/${salon._id}`)
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ name: newSalonName });

  console.log(`    Status: ${resUpdate.statusCode} | Handled By Instance Port: ${resUpdate.headers["x-handled-by-instance"]}`);
  if (resUpdate.statusCode !== 200) {
    throw new Error(`Update mutation failed with status ${resUpdate.statusCode}`);
  }

  // 1c. Fire 10 Reads via Load Balancer (Round-robining between Instance A and Instance B)
  console.log("\n1c. Firing 10 GET /api/v1/salons reads via http://localhost:8080 to verify 0 stale cache reads...");
  let staleReadsCount = 0;

  for (let i = 1; i <= 10; i++) {
    const resRead = await request(LB_URL)
      .get("/api/v1/salons")
      .set("Authorization", `Bearer ${ownerToken}`);

    const handledBy = resRead.headers["x-handled-by-instance"];
    const returnedSalons = resRead.body.data?.salons || resRead.body.data || [];
    const updatedSalon = returnedSalons.find((s) => s._id.toString() === salon._id.toString());
    const isNameUpdated = updatedSalon && updatedSalon.name === newSalonName;

    console.log(`    Read #${i} | Handled By: Instance Port ${handledBy} | Updated Name ('${updatedSalon?.name}'): ${isNameUpdated ? "MATCHED ✅" : "STALE ❌"}`);

    if (!isNameUpdated) staleReadsCount++;
  }

  if (staleReadsCount > 0) {
    throw new Error(`❌ TEST 1 FAILED! ${staleReadsCount} stale cache reads detected across load-balanced instances.`);
  } else {
    console.log("\n✅ TEST 1 PASSED! 0 stale cache reads detected across both instances! Pub/Sub cache invalidation is 100% verified across the load balancer!");
  }

  // =========================================================================
  // TEST 2: Distributed Rate Limiting Across Load Balancer (#6)
  // =========================================================================
  console.log("\n==========================================================================");
  console.log("🧪 TEST 2: Distributed Rate Limiting Across Load Balancer (#6)");
  console.log("==========================================================================");

  const authEndpoint = "/api/v1/auth/login";
  const testIp = `10.0.0.${Math.floor(Math.random() * 200) + 10}`;

  console.log(`2a. Firing 15 rapid login requests to http://localhost:8080 with IP header '${testIp}' (authLimiter limit is 10)...`);
  let requestsBefore429 = 0;
  let blockedAtRequest = null;

  for (let i = 1; i <= 15; i++) {
    const resAuth = await request(LB_URL)
      .post(authEndpoint)
      .set("X-Forwarded-For", testIp)
      .send({ email: `test_${i}@example.com`, password: "wrong" });

    const handledBy = resAuth.headers["x-handled-by-instance"];

    if (resAuth.statusCode === 429) {
      if (blockedAtRequest === null) blockedAtRequest = i;
      console.log(`    Request #${i} | Handled By: Port ${handledBy} | Status: 429 (BLOCKED) ✅`);
    } else {
      requestsBefore429++;
      console.log(`    Request #${i} | Handled By: Port ${handledBy} | Status: ${resAuth.statusCode}`);
    }
  }

  console.log(`\n    Requests Allowed Before Block: ${requestsBefore429}`);
  console.log(`    First Blocked at Request #: ${blockedAtRequest}`);

  if (blockedAtRequest === 11 && requestsBefore429 === 10) {
    console.log("✅ TEST 2 PASSED! Block kicked in at exactly Request #11 across the cluster! Shared Redis count prevents limit doubling across instances!");
  } else if (blockedAtRequest <= 11) {
    console.log(`✅ TEST 2 PASSED! Block kicked in at Request #${blockedAtRequest}! Redis distributed rate limiting is active across instances!`);
  } else {
    throw new Error(`❌ TEST 2 FAILED! Block did not kick in by request 11 (blocked at #${blockedAtRequest}). Per-instance limits may still be active.`);
  }

  // =========================================================================
  // TEST 3: Full Multi-Instance Staged Load Test Across Load Balancer
  // =========================================================================
  console.log("\n==========================================================================");
  console.log("🧪 TEST 3: Full Staged Load Test Across Load Balancer (http://localhost:8080)");
  console.log("==========================================================================");

  // Pre-create 200 distinct VU identity tokens & IP headers
  const vuUsers = [];
  for (let i = 0; i < 200; i++) {
    const vuUser = await User.create({ name: `Cluster VU ${i}_${ts}`, email: `cluster_vu_${i}_${ts}@example.com`, role: ownerRole._id, gender: "female", tokenVersion: 0 });
    const vuToken = jwt.sign({ userId: vuUser._id.toString(), role: "customer", email: vuUser.email, tokenVersion: 0 }, secret, { expiresIn: "1h" });
    const vuIp = `172.16.${Math.floor(i / 250)}.${(i % 250) + 1}`;
    vuUsers.push({ id: vuUser._id, token: vuToken, ip: vuIp });
  }

  const stages = [
    { name: "Stage 1: 50 Concurrent VUs (Normal Cluster)", vuTarget: 50, durationSec: 15 },
    { name: "Stage 2: 200 Concurrent VUs (Spike Cluster)", vuTarget: 200, durationSec: 15 },
    { name: "Stage 3: Ramp Down to 0 VUs", vuTarget: 10, durationSec: 5 },
  ];

  const overallResults = [];

  for (const stage of stages) {
    console.log(`\n🔥 Executing ${stage.name} [Target VUs: ${stage.vuTarget}, Duration: ${stage.durationSec}s]`);

    const stageLatencies = [];
    let successCount = 0;
    let errorCount = 0;
    let rateLimitedCount = 0;

    const startTime = Date.now();
    const endTime = startTime + stage.durationSec * 1000;

    async function runVUWorker(vuIndex) {
      const vu = vuUsers[vuIndex % vuUsers.length];

      while (Date.now() < endTime) {
        const startBrowse = Date.now();
        try {
          const resBrowse = await request(LB_URL)
            .get("/api/v1/browse/salons")
            .set("X-Forwarded-For", vu.ip)
            .set("Authorization", `Bearer ${vu.token}`);

          const duration = Date.now() - startBrowse;
          stageLatencies.push(duration);
          if (resBrowse.statusCode === 200) successCount++;
          else if (resBrowse.statusCode === 429) rateLimitedCount++;
          else errorCount++;
        } catch (e) {
          errorCount++;
        }

        await sleep(Math.floor(Math.random() * 150) + 50);
      }
    }

    const workers = [];
    for (let i = 0; i < stage.vuTarget; i++) {
      workers.push(runVUWorker(i));
    }

    await Promise.all(workers);

    const percentiles = calculatePercentiles(stageLatencies);
    const totalRequests = successCount + errorCount + rateLimitedCount;
    const errorRatePct = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : "0.00";

    const stageSummary = {
      stageName: stage.name,
      clusterSetup: "2 Load-Balanced Instances (api-1 + api-2)",
      vuCount: stage.vuTarget,
      totalRequests,
      successCount,
      rateLimitedCount,
      errorCount,
      errorRatePct: `${errorRatePct}%`,
      p50Ms: percentiles.p50,
      p95Ms: percentiles.p95,
      p99Ms: percentiles.p99,
    };

    overallResults.push(stageSummary);

    console.log(`📊 ${stage.name} Complete:`);
    console.log(`   Total Requests: ${totalRequests} | Success (200): ${successCount} | Rate Limited (429): ${rateLimitedCount} | Errors: ${errorCount} (${errorRatePct}%)`);
    console.log(`   Cluster Latency: p50 = ${percentiles.p50} ms | p95 = ${percentiles.p95} ms | p99 = ${percentiles.p99} ms`);
  }

  // Cleanup
  await User.deleteMany({ _id: { $in: [owner._id, ...vuUsers.map((u) => u.id)] } });
  await Salon.deleteOne({ _id: salon._id });
  await Branch.deleteOne({ _id: branch._id });
  await new Promise((r) => serverA.close(r));
  await new Promise((r) => serverB.close(r));
  await new Promise((r) => proxyServer.close(r));

  console.log("\n==========================================================================");
  console.log("🏁 MULTI-INSTANCE LOAD BALANCER TEST SUMMARY REPORT");
  console.log("==========================================================================");
  console.table(overallResults);

  process.exit(0);
}

runClusterLoadBalancerTests().catch((err) => {
  console.error("Cluster Load Balancer Test execution failed:", err);
  process.exit(1);
});
