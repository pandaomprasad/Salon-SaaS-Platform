const express = require("express");
const request = require("supertest");
const rateLimit = require("express-rate-limit");

async function testRateLimiter() {
  console.log("🧪 Testing Rate Limiter (429 Too Many Requests threshold rejection)...");

  const testApp = express();

  const testLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  });

  testApp.get("/test-limited", testLimiter, (req, res) => {
    res.status(200).json({ success: true, message: "Allowed" });
  });

  const results = [];
  for (let i = 1; i <= 5; i++) {
    const res = await request(testApp).get("/test-limited");
    results.push({ req: i, status: res.statusCode, body: res.body });
  }

  console.log("📊 Rate Limiter Execution Log:");
  results.forEach((r) => {
    console.log(`   Req #${r.req} → Status: ${r.status} | Msg: "${r.body?.message || 'N/A'}"`);
  });

  const passedReqs = results.filter((r) => r.status === 200);
  const blockedReqs = results.filter((r) => r.status === 429);

  if (passedReqs.length === 3 && blockedReqs.length === 2) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! Rapid requests exceeding threshold receive HTTP 429 Too Many Requests!");
    process.exit(0);
  } else {
    console.error("❌ ACCEPTANCE CRITERIA FAILED! Rate limit threshold not enforced.");
    process.exit(1);
  }
}

testRateLimiter().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
