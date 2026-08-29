process.env.NODE_ENV = "test";
const request = require("supertest");
const jwt = require("jsonwebtoken");
const connectDB = require("./src/config/database");
const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");
const Salon = require("./src/models/salon.model");
const { app } = require("./src/app");

const secret = process.env.JWT_ACCESS_SECRET || "f11adad6587c4468f0feb8761cc25cedf1b2fc07e28ce96ee984301b06cf22c5";

async function runPaginationTest() {
  console.log("🧪 Testing Pagination Bounds Sanitization across live endpoints...\n");
  await connectDB();

  const ts = Date.now().toString();
  let ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) ownerRole = await Role.create({ name: "owner", permissions: [] });

  const owner = await User.create({ name: `Pag Owner ${ts}`, email: `pag_owner_${ts}@example.com`, role: ownerRole._id, gender: "male", tokenVersion: 0 });
  const salon = await Salon.create({ name: `Pag Salon ${ts}`, owner: owner._id });
  owner.salonId = salon._id;
  await owner.save();

  const ownerToken = jwt.sign({ userId: owner._id.toString(), role: "owner", salonId: salon._id.toString(), tokenVersion: 0 }, secret);

  // --- Endpoint 1: Public GET /api/v1/browse/salons ---
  console.log("1️⃣ Testing Public Endpoint: GET /api/v1/browse/salons");

  // Query A: page=-5 & limit=500 -> expected normalized page=1, limit=100
  const res1a = await request(app).get("/api/v1/browse/salons?page=-5&limit=500");
  console.log(`   Query: ?page=-5&limit=500 | Status: ${res1a.statusCode}`);
  console.log(`   Pagination Response:`, res1a.body.data?.pagination);
  if (res1a.statusCode !== 200 || res1a.body.data.pagination.page !== 1 || res1a.body.data.pagination.limit !== 100) {
    throw new Error("Test 1a Failed: Page should normalize to 1 and limit to 100");
  }

  // Query B: page=abc & limit=-1 -> expected normalized page=1, limit=10 (default)
  const res1b = await request(app).get("/api/v1/browse/salons?page=abc&limit=-1");
  console.log(`   Query: ?page=abc&limit=-1 | Status: ${res1b.statusCode}`);
  console.log(`   Pagination Response:`, res1b.body.data?.pagination);
  if (res1b.statusCode !== 200 || res1b.body.data.pagination.page !== 1 || res1b.body.data.pagination.limit !== 10) {
    throw new Error("Test 1b Failed: Invalid string page should normalize to 1 and negative limit to default 10");
  }

  // Query C: page=0 & limit=1000000 -> expected normalized page=1, limit=100
  const res1c = await request(app).get("/api/v1/browse/salons?page=0&limit=1000000");
  console.log(`   Query: ?page=0&limit=1000000 | Status: ${res1c.statusCode}`);
  console.log(`   Pagination Response:`, res1c.body.data?.pagination);
  if (res1c.statusCode !== 200 || res1c.body.data.pagination.page !== 1 || res1c.body.data.pagination.limit !== 100) {
    throw new Error("Test 1c Failed: Page 0 should normalize to 1 and 1000000 limit to 100");
  }

  // --- Endpoint 2: Authenticated GET /api/v1/salons ---
  console.log("\n2️⃣ Testing Authenticated Endpoint: GET /api/v1/salons");

  // Query A: page=-10 & limit=99999 -> expected normalized page=1, limit=100
  const res2a = await request(app)
    .get("/api/v1/salons?page=-10&limit=99999")
    .set("Authorization", `Bearer ${ownerToken}`);

  console.log(`   Query: ?page=-10&limit=99999 | Status: ${res2a.statusCode}`);
  console.log(`   Pagination Response:`, res2a.body.data?.pagination);
  if (res2a.statusCode !== 200 || res2a.body.data.pagination.page !== 1 || res2a.body.data.pagination.limit !== 100) {
    throw new Error("Test 2a Failed: Page -10 should normalize to 1 and limit 99999 to 100");
  }

  console.log("\n🎉 ALL PAGINATION SANITIZATION TEST CASES PASSED SUCCESSFULLY!");

  // Cleanup
  await User.deleteOne({ _id: owner._id });
  await Salon.deleteOne({ _id: salon._id });

  process.exit(0);
}

runPaginationTest().catch((err) => {
  console.error("Pagination Test error:", err);
  process.exit(1);
});
