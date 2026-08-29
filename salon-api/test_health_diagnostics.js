process.env.NODE_ENV = "test";
const request = require("supertest");
const mongoose = require("mongoose");
const connectDB = require("./src/config/database");
const { app } = require("./src/app");

async function runHealthTest() {
  console.log("🧪 Testing Health Check Diagnostics endpoint (GET /health)...\n");

  await connectDB();

  // Test 1: DB UP
  console.log("1️⃣ Test 1: GET /health when MongoDB is connected...");
  const res1 = await request(app).get("/health");

  console.log(`   HTTP Status Code: ${res1.statusCode}`);
  console.log(`   Response Payload:`, JSON.stringify(res1.body, null, 2));

  if (res1.statusCode !== 200 || !res1.body.success) {
    throw new Error(`Test 1 Failed: Expected status 200 OK, got ${res1.statusCode}`);
  }
  if (res1.body.databaseDiagnostics.status !== "CONNECTED") {
    throw new Error(`Test 1 Failed: Expected DB status CONNECTED, got ${res1.body.databaseDiagnostics.status}`);
  }
  if (typeof res1.body.databaseDiagnostics.latencyMs !== "number") {
    throw new Error("Test 1 Failed: Expected latencyMs to be a number");
  }
  if (res1.body.redisDiagnostics.sampleKeysStored) {
    throw new Error("Test 1 Failed: sampleKeysStored was not removed from response!");
  }
  console.log("   Test 1 PASSED ✅ - 200 OK returned with live MongoDB latency reported and no key exposure.\n");

  // Test 2: DB DOWN (Simulated)
  console.log("2️⃣ Test 2: GET /health when MongoDB is disconnected...");
  await mongoose.connection.close(); // Simulate database outage

  const res2 = await request(app).get("/health");

  console.log(`   HTTP Status Code: ${res2.statusCode}`);
  console.log(`   Response Payload:`, JSON.stringify(res2.body, null, 2));

  if (res2.statusCode !== 503 || res2.body.success !== false) {
    throw new Error(`Test 2 Failed: Expected status 503 Service Unavailable, got ${res2.statusCode}`);
  }
  if (res2.body.databaseDiagnostics.status !== "DISCONNECTED") {
    throw new Error(`Test 2 Failed: Expected DB status DISCONNECTED, got ${res2.body.databaseDiagnostics.status}`);
  }
  console.log("   Test 2 PASSED ✅ - 503 Service Unavailable correctly returned on DB outage.\n");

  console.log("🎉 ALL HEALTH DIAGNOSTICS TEST CASES PASSED SUCCESSFULLY!");
  process.exit(0);
}

runHealthTest().catch((err) => {
  console.error("Health Test execution failed:", err);
  process.exit(1);
});
