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

const secret = process.env.JWT_ACCESS_SECRET || "f11adad6587c4468f0feb8761cc25cedf1b2fc07e28ce96ee984301b06cf22c5";
const PORT = 6969;
const BASE_URL = `http://localhost:${PORT}`;

// Calculate Percentiles
function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  return { p50: Math.round(p50), p95: Math.round(p95), p99: Math.round(p99) };
}

// Scrape Prometheus Metrics from /metrics
function fetchPrometheusMetrics() {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}/metrics`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let circuitBreakerTripped = false;
        let eventLoopLagSeconds = null;
        let eventLoopLagMaxSeconds = null;
        let dbQueryDurationSum = null;
        let dbQueryDurationCount = null;

        const lines = data.split("\n");
        for (const line of lines) {
          if (line.startsWith("circuit_breaker_state") && line.endsWith("1")) {
            if (line.includes('state="open"') || line.includes('state="half-open"')) {
              circuitBreakerTripped = true;
            }
          }
          if (line.startsWith("salon_api_nodejs_eventloop_lag_seconds ") || line.startsWith("nodejs_eventloop_lag_seconds ")) {
            const parts = line.trim().split(" ");
            eventLoopLagSeconds = parseFloat(parts[parts.length - 1]);
          }
          if (line.startsWith("salon_api_nodejs_eventloop_lag_max_seconds ")) {
            const parts = line.trim().split(" ");
            eventLoopLagMaxSeconds = parseFloat(parts[parts.length - 1]);
          }
          if (line.startsWith("db_query_duration_seconds_sum")) {
            const parts = line.trim().split(" ");
            dbQueryDurationSum = parseFloat(parts[parts.length - 1]);
          }
          if (line.startsWith("db_query_duration_seconds_count")) {
            const parts = line.trim().split(" ");
            dbQueryDurationCount = parseFloat(parts[parts.length - 1]);
          }
        }

        const avgDbQueryMs = dbQueryDurationCount && dbQueryDurationCount > 0
          ? ((dbQueryDurationSum / dbQueryDurationCount) * 1000).toFixed(2)
          : "N/A";

        resolve({
          circuitBreakerTripped,
          eventLoopLagMs: eventLoopLagSeconds !== null ? (eventLoopLagSeconds * 1000).toFixed(2) : "N/A",
          eventLoopLagMaxMs: eventLoopLagMaxSeconds !== null ? (eventLoopLagMaxSeconds * 1000).toFixed(2) : "N/A",
          avgDbQueryMs,
          rawMetricsSnippet: data.substring(0, 400),
        });
      });
    }).on("error", () => resolve({ circuitBreakerTripped: false, eventLoopLagMs: "N/A", eventLoopLagMaxMs: "N/A", avgDbQueryMs: "N/A" }));
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runLoadTest() {
  console.log("🚀 Starting Clean Staged Load Test Pass with Per-VU Scoped Buckets & Prometheus Telemetry...\n");

  await connectDB();

  // Spin up HTTP server on Port 6969
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`🌐 Server active on ${BASE_URL}\n`);

  // Seed sample records
  const ts = Date.now().toString();
  let customerRole = await Role.findOne({ name: "customer" });
  if (!customerRole) customerRole = await Role.create({ name: "customer", permissions: ["appointment:create", "appointment:read"] });

  let ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) ownerRole = await Role.create({ name: "owner", permissions: [] });

  const owner = await User.create({ name: `Clean Owner ${ts}`, email: `clean_owner_${ts}@example.com`, role: ownerRole._id, gender: "male", tokenVersion: 0 });
  const salon = await Salon.create({ name: `Clean Salon ${ts}`, owner: owner._id });
  const branch = await Branch.create({ name: `Clean Branch ${ts}`, salonId: salon._id, contactPhone: "9876543210", address: { street: "St 1", city: "City C", state: "State C", pincode: "751001" }, citySlug: "cityc" });
  const service = await Service.create({ name: `Clean Service ${ts}`, salonId: salon._id, branchId: branch._id, category: "hair", price: 25000, durationMinutes: 30 });

  // Pre-generate 200 distinct VU identity tokens & IP headers
  const vuUsers = [];
  for (let i = 0; i < 200; i++) {
    const vuUser = await User.create({ name: `VU ${i}_${ts}`, email: `vu_${i}_${ts}@example.com`, role: customerRole._id, gender: "female", tokenVersion: 0 });
    const vuToken = jwt.sign({ userId: vuUser._id.toString(), role: "customer", email: vuUser.email, tokenVersion: 0 }, secret, { expiresIn: "1h" });
    const vuIp = `192.168.${Math.floor(i / 250)}.${(i % 250) + 1}`;
    vuUsers.push({ id: vuUser._id, token: vuToken, ip: vuIp });
  }

  console.log(`✅ Pre-created 200 distinct VU auth tokens & IP headers to guarantee per-user rate limit isolation.\n`);

  const stages = [
    { name: "Stage 1: 50 Concurrent VUs (Normal)", vuTarget: 50, durationSec: 15 },
    { name: "Stage 2: 200 Concurrent VUs (Spike)", vuTarget: 200, durationSec: 15 },
    { name: "Stage 3: Ramp Down to 0 VUs", vuTarget: 10, durationSec: 5 },
  ];

  const overallResults = [];

  for (const stage of stages) {
    console.log(`======================================================`);
    console.log(`🔥 Executing ${stage.name} [Target VUs: ${stage.vuTarget}, Duration: ${stage.durationSec}s]`);
    console.log(`======================================================`);

    const stageLatencies = [];
    let successCount = 0;
    let errorCount = 0;
    let rateLimitedCount = 0;

    const startTime = Date.now();
    const endTime = startTime + stage.durationSec * 1000;

    // Worker loop simulating a single Virtual User (VU) with unique auth token & IP header
    async function runVUWorker(vuIndex) {
      const vu = vuUsers[vuIndex % vuUsers.length];

      while (Date.now() < endTime) {
        // Step 1: Public Browse Salons
        const startBrowse = Date.now();
        try {
          const resBrowse = await request(BASE_URL)
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

        await sleep(Math.floor(Math.random() * 200) + 100);
        if (Date.now() >= endTime) break;

        // Step 2: Public Browse Branch Details
        const startDetail = Date.now();
        try {
          const resDetail = await request(BASE_URL)
            .get(`/api/v1/browse/branches?city=cityc`)
            .set("X-Forwarded-For", vu.ip)
            .set("Authorization", `Bearer ${vu.token}`);

          const duration = Date.now() - startDetail;
          stageLatencies.push(duration);
          if (resDetail.statusCode === 200) successCount++;
          else if (resDetail.statusCode === 429) rateLimitedCount++;
          else errorCount++;
        } catch (e) {
          errorCount++;
        }

        await sleep(Math.floor(Math.random() * 200) + 100);
        if (Date.now() >= endTime) break;

        // Step 3: Health Check
        const startHealth = Date.now();
        try {
          const resHealth = await request(BASE_URL)
            .get("/health")
            .set("X-Forwarded-For", vu.ip);

          const duration = Date.now() - startHealth;
          stageLatencies.push(duration);
          if (resHealth.statusCode === 200) successCount++;
          else if (resHealth.statusCode === 429) rateLimitedCount++;
          else errorCount++;
        } catch (e) {
          errorCount++;
        }

        await sleep(Math.floor(Math.random() * 200) + 100);
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
    const promMetrics = await fetchPrometheusMetrics();

    const stageSummary = {
      stageName: stage.name,
      vuCount: stage.vuTarget,
      totalRequests,
      successCount,
      rateLimitedCount,
      errorCount,
      errorRatePct: `${errorRatePct}%`,
      p50Ms: percentiles.p50,
      p95Ms: percentiles.p95,
      p99Ms: percentiles.p99,
      circuitBreakerTripped: promMetrics.circuitBreakerTripped ? "YES ⚠️" : "NO ✅",
      eventLoopLagMs: promMetrics.eventLoopLagMs,
      eventLoopLagMaxMs: promMetrics.eventLoopLagMaxMs,
      avgDbQueryMs: promMetrics.avgDbQueryMs,
    };

    overallResults.push(stageSummary);

    console.log(`📊 ${stage.name} Performance Metrics:`);
    console.log(`   Total Requests: ${totalRequests} | Successful (200): ${successCount} | Rate-Limited (429): ${rateLimitedCount} | Errors: ${errorCount} (${errorRatePct}%)`);
    console.log(`   Latency: p50 = ${percentiles.p50} ms | p95 = ${percentiles.p95} ms | p99 = ${percentiles.p99} ms`);
    console.log(`   Prometheus Telemetry:`);
    console.log(`     - Circuit Breaker Tripped: ${promMetrics.circuitBreakerTripped ? "YES ⚠️" : "NO ✅"}`);
    console.log(`     - Event Loop Lag (Avg): ${promMetrics.eventLoopLagMs} ms | Max: ${promMetrics.eventLoopLagMaxMs} ms`);
    console.log(`     - Avg DB Query Duration: ${promMetrics.avgDbQueryMs} ms\n`);
  }

  // Cleanup
  await User.deleteMany({ _id: { $in: [owner._id, ...vuUsers.map((u) => u.id)] } });
  await Salon.deleteOne({ _id: salon._id });
  await Branch.deleteOne({ _id: branch._id });
  await Service.deleteOne({ _id: service._id });
  await new Promise((resolve) => server.close(resolve));

  console.log("==========================================================================");
  console.log("🏁 CLEAN LOAD TEST STAGE SUMMARY REPORT WITH PROMETHEUS TELEMETRY");
  console.log("==========================================================================");
  console.table(overallResults);

  process.exit(0);
}

runLoadTest().catch((err) => {
  console.error("Load test execution error:", err);
  process.exit(1);
});
