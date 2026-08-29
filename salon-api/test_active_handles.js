process.env.NODE_ENV = "test";
process.env.REDIS_ENABLED = "true";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";

const http = require("http");
const request = require("supertest");
const connectDB = require("./src/config/database");
const { app } = require("./src/app");

const PORT = 6969;
const BASE_URL = `http://localhost:${PORT}`;

function fetchProcessMetrics() {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}/metrics`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let activeHandles = "N/A";
        let activeRequests = "N/A";
        let heapUsedMb = "N/A";
        let rssMb = "N/A";

        const lines = data.split("\n");
        for (const line of lines) {
          if (line.startsWith("salon_api_nodejs_active_handles_total ") || line.startsWith("nodejs_active_handles_total ")) {
            activeHandles = line.trim().split(" ").pop();
          }
          if (line.startsWith("salon_api_nodejs_active_requests_total ") || line.startsWith("nodejs_active_requests_total ")) {
            activeRequests = line.trim().split(" ").pop();
          }
          if (line.startsWith("salon_api_nodejs_heap_size_used_bytes ") || line.startsWith("nodejs_heap_size_used_bytes ")) {
            heapUsedMb = (parseFloat(line.trim().split(" ").pop()) / 1024 / 1024).toFixed(2);
          }
          if (line.startsWith("salon_api_process_resident_memory_bytes ") || line.startsWith("process_resident_memory_bytes ")) {
            rssMb = (parseFloat(line.trim().split(" ").pop()) / 1024 / 1024).toFixed(2);
          }
        }
        resolve({ activeHandles, activeRequests, heapUsedMb, rssMb });
      });
    }).on("error", () => resolve({ activeHandles: "N/A", activeRequests: "N/A", heapUsedMb: "N/A", rssMb: "N/A" }));
  });
}

async function runProcessMetricsCheck() {
  console.log("🔍 Checking Node.js Process Handles & Memory Metrics...\n");

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));

  const metricsBefore = await fetchProcessMetrics();
  console.log("📊 Server Baseline (Idle):");
  console.log(`   Active Handles: ${metricsBefore.activeHandles}`);
  console.log(`   Active Requests: ${metricsBefore.activeRequests}`);
  console.log(`   Heap Used: ${metricsBefore.heapUsedMb} MB`);
  console.log(`   RSS Memory: ${metricsBefore.rssMb} MB\n`);

  // Fire 200 concurrent requests to observe active handles under peak concurrency
  console.log("🔥 Firing 200 concurrent HTTP requests to measure active handles under peak load...");
  const promises = [];
  for (let i = 0; i < 200; i++) {
    promises.push(request(BASE_URL).get("/api/v1/browse/salons"));
  }

  // Sample metrics mid-flight
  await new Promise((r) => setTimeout(r, 20));
  const metricsDuring = await fetchProcessMetrics();

  await Promise.all(promises);

  const metricsAfter = await fetchProcessMetrics();

  console.log("📊 Server Peak Load (During 200 Concurrent VUs):");
  console.log(`   Active Handles: ${metricsDuring.activeHandles}`);
  console.log(`   Active Requests: ${metricsDuring.activeRequests}`);
  console.log(`   Heap Used: ${metricsDuring.heapUsedMb} MB`);
  console.log(`   RSS Memory: ${metricsDuring.rssMb} MB\n`);

  console.log("📊 Server Post-Load (Idle Recovery):");
  console.log(`   Active Handles: ${metricsAfter.activeHandles}`);
  console.log(`   Active Requests: ${metricsAfter.activeRequests}`);
  console.log(`   Heap Used: ${metricsAfter.heapUsedMb} MB`);
  console.log(`   RSS Memory: ${metricsAfter.rssMb} MB\n`);

  await new Promise((resolve) => server.close(resolve));
  process.exit(0);
}

runProcessMetricsCheck().catch((err) => {
  console.error("Process metrics check failed:", err);
  process.exit(1);
});
