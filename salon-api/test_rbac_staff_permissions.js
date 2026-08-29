process.env.NODE_ENV = "test";
const request = require("supertest");
const jwt = require("jsonwebtoken");
const connectDB = require("./src/config/database");
const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");
const { app } = require("./src/app");

async function testRbacStaffPermissions() {
  console.log("🧪 Testing RBAC protection on PATCH /api/v1/branches/branch123/staff/staff123/permissions...");

  await connectDB();

  let customerRole = await Role.findOne({ name: "customer" });
  if (!customerRole) customerRole = await Role.create({ name: "customer", permissions: ["appointment:read"] });

  const testSuffix = Date.now().toString();
  const customerUser = await User.create({
    name: "RBAC Test Customer",
    email: `rbac_customer_${testSuffix}@example.com`,
    password: "password123",
    role: customerRole._id,
    gender: "female",
    tokenVersion: 0,
  });

  const secret = process.env.JWT_ACCESS_SECRET || "f11adad6587c4468f0feb8761cc25cedf1b2fc07e28ce96ee984301b06cf22c5";
  const customerToken = jwt.sign(
    {
      userId: customerUser._id.toString(),
      role: "customer",
      email: customerUser.email,
      tokenVersion: customerUser.tokenVersion || 0,
    },
    secret,
    { expiresIn: "1h" }
  );

  const res = await request(app)
    .patch("/api/v1/branches/660000000000000000000002/staff/660000000000000000000003/permissions")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ permissions: ["staff:delete"] });

  console.log(`HTTP Response Status Code: ${res.statusCode}`);
  console.log(`Response Body:`, res.body);

  // Cleanup
  await User.deleteOne({ _id: customerUser._id });

  if (res.statusCode === 403) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! Customer-role JWT receives 403 Forbidden when calling staff permissions route!");
    process.exit(0);
  } else {
    console.error(`❌ FAILED! Expected status 403 but got ${res.statusCode}`);
    process.exit(1);
  }
}

testRbacStaffPermissions().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
