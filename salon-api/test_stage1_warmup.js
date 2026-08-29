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
const { app } = require("./src/app");

const secret = process.env.JWT_ACCESS_SECRET || "f11adad6587c4468f0feb8761cc25cedf1b2fc07e28ce96ee984301b06cf22c5";
const LB_PORT = 8080;
const LB_URL = `http://localhost:${LB_PORT}`;

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  return { p50: Math.round(p50), p95: Math.round(p95), p99: Math.round(p99) };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runStage1Diagnostic() {
  console.log("🔍 Investigating Stage 1 p99 Latency Anomaly (Warm-Up Buffer vs Code Path Bug)...\n");

  await connectDB();

  // Spin up 2 instances and load balancer proxy
  const serverA = http.createServer(app);
  await new Promise((r) => serverA.listen(7001, r));
  const serverB = http.createServer(app);
  await new Promise((r) => serverB.listen(7002, r));

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
    clientReq.pipe(proxyReq, { end: true });
  });

  await new Promise((r) => proxyServer.listen(LB_PORT, r));
  console.log(`🌐 Cluster & Load Balancer active on ${LB_URL}\n`);

  // Seed sample records
  const ts = Date.now().toString();
  let ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) ownerRole = await Role.create({ name: "owner", permissions: [] });

  const owner = await User.create({ name: `Stage1 Owner ${ts}`, email: `stage1_owner_${ts}@example.com`, role: ownerRole._id, gender: "male", tokenVersion: 0 });
  const salon = await Salon.create({ name: `Stage1 Salon ${ts}`, owner: owner._id, isActive: true });
  const branch = await Branch.create({ name: `Stage1 Branch ${ts}`, salonId: salon._id, contactPhone: "9876543210", address: { street: "St 1", city: "City E", state: "State E", pincode: "751001" }, citySlug: "citye", isActive: true });

  const vuUsers = [];
  for (let i = 0; i < 50; i++) {
    const vuUser = await User.create({ name: `Stage1 VU ${i}_${ts}`, email: `stage1_vu_${i}_${ts}@example.com`, role: ownerRole._id, gender: "female", tokenVersion: 0 });
    const vuToken = jwt.sign({ userId: vuUser._id.toString(), role: "customer", email: vuUser.email, tokenVersion: 0 }, secret, { expiresIn: "1h" });
    const vuIp = `10.10.${Math.floor(i / 250)}.${(i % 250) + 1}`;
    vuUsers.push({ id: vuUser._id, token: vuToken, ip: vuIp });
  }

  // --- Run Test A: NO Warm-up (Simulating Cold-Start) ---
  console.log("------------------------------------------------------------------");
  console.log("🧪 RUN A: Stage 1 WITHOUT Warm-Up (Cold-Start Initial Burst)");
  console.log("------------------------------------------------------------------");

  const coldOutliers = [];
  const coldLatencies = [];
  const coldStartTime = Date.now();
  const coldEndTime = coldStartTime + 10000; // 10 seconds

  async function runColdWorker(i) {
    const vu = vuUsers[i % vuUsers.length];
    while (Date.now() < coldEndTime) {
      const t0 = Date.now();
      try {
        const res = await request(LB_URL)
          .get("/api/v1/browse/salons")
          .set("X-Forwarded-For", vu.ip)
          .set("Authorization", `Bearer ${vu.token}`);

        const dur = Date.now() - t0;
        coldLatencies.push(dur);
        if (dur > 300) {
          coldOutliers.push({
            requestIndex: coldLatencies.length,
            durationMs: dur,
            elapsedFromStartMs: Date.now() - coldStartTime,
            handledBy: res.headers["x-handled-by-instance"],
            url: "/api/v1/browse/salons",
          });
        }
      } catch (e) {}
      await sleep(100);
    }
  }

  const coldWorkers = [];
  for (let i = 0; i < 50; i++) coldWorkers.push(runColdWorker(i));
  await Promise.all(coldWorkers);

  const coldPercentiles = calculatePercentiles(coldLatencies);
  console.log(`📊 Run A Results (NO Warm-Up):`);
  console.log(`   Total Requests: ${coldLatencies.length}`);
  console.log(`   p50: ${coldPercentiles.p50} ms | p95: ${coldPercentiles.p95} ms | p99: ${coldPercentiles.p99} ms`);
  console.log(`   Outliers (>300ms count): ${coldOutliers.length}`);
  if (coldOutliers.length > 0) {
    console.log("   First 5 Outliers Details:", coldOutliers.slice(0, 5));
  }

  // --- Run Warm-Up Buffer Phase ---
  console.log("\n------------------------------------------------------------------");
  console.log("♨️ WARM-UP PHASE: Sending 3 seconds of light warm-up traffic...");
  console.log("------------------------------------------------------------------");
  const warmupEndTime = Date.now() + 3000;
  for (let i = 0; i < 5; i++) {
    await request(LB_URL).get("/api/v1/browse/salons");
    await sleep(100);
  }
  console.log("✅ Warm-Up Complete! DB & Redis connections, cache warmer & JIT compilation ready.\n");

  // --- Run Test B: WITH 3s Warm-up Buffer ---
  console.log("------------------------------------------------------------------");
  console.log("🧪 RUN B: Stage 1 WITH 3-Second Warm-Up Buffer (Pre-Warmed Cluster)");
  console.log("------------------------------------------------------------------");

  const warmOutliers = [];
  const warmLatencies = [];
  const warmStartTime = Date.now();
  const warmEndTime = warmStartTime + 10000; // 10 seconds

  async function runWarmWorker(i) {
    const vu = vuUsers[i % vuUsers.length];
    while (Date.now() < warmEndTime) {
      const t0 = Date.now();
      try {
        const res = await request(LB_URL)
          .get("/api/v1/browse/salons")
          .set("X-Forwarded-For", vu.ip)
          .set("Authorization", `Bearer ${vu.token}`);

        const dur = Date.now() - t0;
        warmLatencies.push(dur);
        if (dur > 300) {
          warmOutliers.push({
            requestIndex: warmLatencies.length,
            durationMs: dur,
            elapsedFromStartMs: Date.now() - warmStartTime,
            handledBy: res.headers["x-handled-by-instance"],
            url: "/api/v1/browse/salons",
          });
        }
      } catch (e) {}
      await sleep(100);
    }
  }

  const warmWorkers = [];
  for (let i = 0; i < 50; i++) warmWorkers.push(runWarmWorker(i));
  await Promise.all(warmWorkers);

  const warmPercentiles = calculatePercentiles(warmLatencies);
  console.log(`📊 Run B Results (WITH Warm-Up):`);
  console.log(`   Total Requests: ${warmLatencies.length}`);
  console.log(`   p50: ${warmPercentiles.p50} ms | p95: ${warmPercentiles.p95} ms | p99: ${warmPercentiles.p99} ms`);
  console.log(`   Outliers (>300ms count): ${warmOutliers.length}`);

  // Cleanup
  await User.deleteMany({ _id: { $in: [owner._id, ...vuUsers.map((u) => u.id)] } });
  await Salon.deleteOne({ _id: salon._id });
  await Branch.deleteOne({ _id: branch._id });
  await new Promise((r) => serverA.close(r));
  await new Promise((r) => serverB.close(r));
  await new Promise((r) => proxyServer.close(r));

  process.exit(0);
}

runStage1Diagnostic().catch((err) => {
  console.error("Stage 1 Diagnostic error:", err);
  process.exit(1);
});
