process.env.NODE_ENV = "test";
const request = require("supertest");
const { app } = require("./src/app");
const { register } = require("./src/services/metrics.service");

async function testMetricsEndpoint() {
  console.log("🧪 Testing Prometheus GET /metrics Endpoint scraping...");

  const res = await request(app).get("/metrics");

  console.log(`HTTP Status Code: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers["content-type"]}`);

  const bodyText = res.text || (await register.metrics());

  const hasHttpRequestDuration = bodyText.includes("http_request_duration_seconds");
  const hasHttpRequestsTotal = bodyText.includes("http_requests_total");
  const hasCacheHitsTotal = bodyText.includes("cache_hits_total");
  const hasCacheMissesTotal = bodyText.includes("cache_misses_total");

  console.log(`   - Includes http_request_duration_seconds: ${hasHttpRequestDuration ? '✅' : '❌'}`);
  console.log(`   - Includes http_requests_total: ${hasHttpRequestsTotal ? '✅' : '❌'}`);
  console.log(`   - Includes cache_hits_total: ${hasCacheHitsTotal ? '✅' : '❌'}`);
  console.log(`   - Includes cache_misses_total: ${hasCacheMissesTotal ? '✅' : '❌'}`);

  if (
    res.statusCode === 200 &&
    hasHttpRequestDuration &&
    hasHttpRequestsTotal &&
    hasCacheHitsTotal &&
    hasCacheMissesTotal
  ) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! GET /metrics endpoint exists and is ready for Prometheus scraping!");
    process.exit(0);
  } else {
    console.error("❌ ACCEPTANCE CRITERIA FAILED! /metrics response missing metrics.");
    process.exit(1);
  }
}

testMetricsEndpoint().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
