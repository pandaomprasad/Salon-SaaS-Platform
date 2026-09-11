process.env.NODE_ENV = "test";
require("dotenv").config();
const request = require("supertest");
const { app } = require("./src/app");
const StorageService = require("./src/services/storage.service");
const { isConfigured, bucketName } = require("./src/config/r2.config");

async function runR2StorageTests() {
  console.log("\n==================================================");
  console.log("🧪 RUNNING CLOUDFLARE R2 INTEGRATION VERIFICATION");
  console.log("==================================================\n");

  console.log(`📌 R2 Client Configuration Status: ${isConfigured ? "CONNECTED" : "DEVELOPMENT FALLBACK MODE"}`);
  console.log(`📌 Target Bucket Name: ${bucketName}\n`);

  // Test 1: Verify StorageService uploadBuffer
  console.log("TEST 1: Testing StorageService.uploadBuffer...");
  const dummyBuffer = Buffer.from("sample image content bytes", "utf-8");
  const uploadResult = await StorageService.uploadBuffer({
    buffer: dummyBuffer,
    originalName: "test-salon-logo.png",
    mimeType: "image/png",
    folder: "test-salons",
  });

  console.log("  Upload Output:", uploadResult);
  if (!uploadResult.url || !uploadResult.key) {
    throw new Error("❌ StorageService.uploadBuffer test failed: missing url or key");
  }
  console.log("  ✅ StorageService.uploadBuffer passed.\n");

  // Test 2: Verify StorageService deleteFile
  console.log("TEST 2: Testing StorageService.deleteFile...");
  const deleteResult = await StorageService.deleteFile(uploadResult.url);
  console.log("  Delete Output:", deleteResult);
  if (!deleteResult.success) {
    throw new Error("❌ StorageService.deleteFile test failed");
  }
  console.log("  ✅ StorageService.deleteFile passed.\n");

  // Test 3: Verify StorageService generatePresignedUploadUrl
  console.log("TEST 3: Testing StorageService.generatePresignedUploadUrl...");
  const presignedResult = await StorageService.generatePresignedUploadUrl({
    fileName: "service-banner.jpg",
    fileType: "image/jpeg",
    folder: "banners",
  });
  console.log("  Presigned Output:", presignedResult);
  if (!presignedResult.uploadUrl || !presignedResult.publicUrl) {
    throw new Error("❌ StorageService.generatePresignedUploadUrl test failed");
  }
  console.log("  ✅ StorageService.generatePresignedUploadUrl passed.\n");

  // Test 4: Health Check Endpoint Diagnostics
  console.log("TEST 4: Testing GET /health endpoint diagnostics for r2Diagnostics...");
  const res = await request(app).get("/health");
  console.log("  Health Status Code:", res.statusCode);
  console.log("  R2 Diagnostics in Response:", res.body.r2Diagnostics);
  if (!res.body.r2Diagnostics || typeof res.body.r2Diagnostics.configured !== "boolean") {
    throw new Error("❌ Health endpoint missing r2Diagnostics!");
  }
  console.log("  ✅ Health endpoint r2Diagnostics passed.\n");

  console.log("==================================================");
  console.log("🎉 ALL CLOUDFLARE R2 VERIFICATION TESTS PASSED!");
  console.log("==================================================\n");
}

runR2StorageTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("🚨 Test Failed:", err);
    process.exit(1);
  });
