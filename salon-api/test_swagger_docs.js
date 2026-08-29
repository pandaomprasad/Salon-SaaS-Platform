process.env.NODE_ENV = "development";
const request = require("supertest");
const { app } = require("./src/app");

async function testSwaggerDocs() {
  console.log("🧪 Testing OpenAPI / Swagger UI (/api-docs)...");

  const res = await request(app).get("/api-docs/");

  console.log(`GET /api-docs/ HTTP Status Code: ${res.statusCode}`);
  const isHtml = (res.headers["content-type"] || "").includes("text/html");
  const hasSwaggerTitle = res.text.includes("Swagger UI") || res.text.includes("swagger-ui");

  console.log(`   - Returns HTML Page: ${isHtml ? '✅' : '❌'}`);
  console.log(`   - Contains Swagger UI UI assets: ${hasSwaggerTitle ? '✅' : '❌'}`);

  if (res.statusCode === 200 && isHtml && hasSwaggerTitle) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! Interactive OpenAPI / Swagger UI documentation is live and accessible at /api-docs!");
    process.exit(0);
  } else {
    console.error("❌ ACCEPTANCE CRITERIA FAILED! /api-docs failed.");
    process.exit(1);
  }
}

testSwaggerDocs().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
