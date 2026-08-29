const { createCircuitBreaker } = require("./src/services/circuitBreaker.service");

async function testCircuitBreakerResilience() {
  console.log("🧪 Testing Downstream DB Circuit Breaker Resilience...");

  // Mock a database call that fails / hangs when MongoDB is down
  let isDbAlive = false;
  const mockDbQuery = async () => {
    if (!isDbAlive) {
      throw new Error("MongoNetworkError: failed to connect to server [127.0.0.1:27017] on first connect");
    }
    return [{ name: "Salon Luxe" }];
  };

  const breaker = createCircuitBreaker(mockDbQuery, {
    name: "test-db-breaker",
    timeout: 1000,
    errorThresholdPercentage: 50,
    volumeThreshold: 3,
    resetTimeout: 2000,
  });

  const results = [];

  // Launch 6 consecutive requests against dead DB
  for (let i = 1; i <= 6; i++) {
    const startTime = Date.now();
    try {
      await breaker.fire();
      results.push({ req: i, status: 200, duration: Date.now() - startTime });
    } catch (err) {
      results.push({
        req: i,
        status: err.statusCode || err.status || 500,
        message: err.message,
        retryAfter: err.retryAfter,
        duration: Date.now() - startTime,
      });
    }
  }

  console.log("📊 Circuit Breaker Execution Log:");
  results.forEach((r) => {
    console.log(`   Req #${r.req} → Status: ${r.status} (${r.duration}ms) | Msg: "${r.message}" | Retry-After: ${r.retryAfter || 'N/A'}`);
  });

  const trippedRequests = results.filter((r) => r.status === 503 && r.retryAfter === 10);
  const fastFails = results.filter((r) => r.status === 503 && r.duration < 10);

  if (trippedRequests.length > 0 && fastFails.length > 0) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! DB failures trip circuit breaker, producing instant 503 responses with Retry-After: 10 instead of hanging!");
    process.exit(0);
  } else {
    console.error("❌ ACCEPTANCE CRITERIA FAILED! Circuit breaker did not trip fast 503.");
    process.exit(1);
  }
}

testCircuitBreakerResilience().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
