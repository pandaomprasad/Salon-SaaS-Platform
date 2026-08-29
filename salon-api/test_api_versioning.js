process.env.NODE_ENV = "test";
const request = require("supertest");
const { app } = require("./src/app");

async function testApiVersioning() {
  console.log("🧪 Testing API Versioning (/api/v1/* route coverage)...");

  const v1BrowseRes = await request(app).get("/api/v1/browse/salons?page=1&limit=1");
  const v1BannersRes = await request(app).get("/api/v1/banners");

  console.log(`GET /api/v1/browse/salons HTTP Code: ${v1BrowseRes.statusCode}`);
  console.log(`GET /api/v1/banners HTTP Code: ${v1BannersRes.statusCode}`);

  if (v1BrowseRes.statusCode === 200 && v1BannersRes.statusCode === 200) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! All API endpoints are standardized under /api/v1/ versioned namespace!");
    process.exit(0);
  } else {
    console.error("❌ ACCEPTANCE CRITERIA FAILED! Versioned /api/v1 routes failed.");
    process.exit(1);
  }
}

testApiVersioning().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
