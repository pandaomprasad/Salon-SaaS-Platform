const validateEnvSecrets = require("./src/config/validateEnv");

console.log("🧪 Testing Startup Secrets Validation...");

// Test Case 1: Environment has secrets set -> should pass without throwing or exiting
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret_val_123";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_val_456";

try {
  validateEnvSecrets();
  console.log("1️⃣ Test 1 (Valid Secrets): PASSED ✅ - validateEnvSecrets() executed successfully.");
} catch (err) {
  console.error("1️⃣ Test 1 FAILED:", err.message);
  process.exit(1);
}

// Test Case 2: EMAIL_VERIFICATION_SECRET falls back to JWT_ACCESS_SECRET
if (process.env.EMAIL_VERIFICATION_SECRET === process.env.JWT_ACCESS_SECRET) {
  console.log("2️⃣ Test 2 (EMAIL_VERIFICATION_SECRET Fallback): PASSED ✅ - EMAIL_VERIFICATION_SECRET correctly defaulted to JWT_ACCESS_SECRET.");
} else {
  console.error("2️⃣ Test 2 FAILED: EMAIL_VERIFICATION_SECRET did not match JWT_ACCESS_SECRET!");
  process.exit(1);
}

console.log("\n🎉 ALL SECRETS VALIDATION TEST CASES PASSED SUCCESSFULLY!");
process.exit(0);
