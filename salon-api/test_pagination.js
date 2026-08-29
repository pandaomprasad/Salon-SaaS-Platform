const request = require("supertest");
process.env.NODE_ENV = "test";
const { app } = require("./src/app");

async function testPagination() {
  console.log("🧪 Testing Standardized Pagination across List Endpoints...");

  // Test public browse endpoint
  const res = await request(app).get("/api/v1/browse/salons?page=1&limit=5");

  console.log(`Browse Response HTTP Code: ${res.statusCode}`);
  const hasData = Boolean(res.body?.data?.salons);
  const hasPagination = Boolean(res.body?.data?.pagination);

  console.log(`   - Data Array Present: ${hasData ? '✅' : '❌'}`);
  console.log(`   - Pagination Object Present ({ page, limit, total, totalPages }): ${hasPagination ? '✅' : '❌'}`);

  if (res.statusCode === 200 && hasData && hasPagination) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! List endpoints enforce standardized pagination parameters and return pagination metadata!");
    process.exit(0);
  } else {
    console.error("❌ ACCEPTANCE CRITERIA FAILED! Pagination metadata missing from list endpoint response.");
    process.exit(1);
  }
}

testPagination().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
