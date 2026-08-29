process.env.NODE_ENV = "test";
const request = require("supertest");
const jwt = require("jsonwebtoken");
const connectDB = require("./src/config/database");
const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");
const Salon = require("./src/models/salon.model");
const Branch = require("./src/models/branch.model");
const Service = require("./src/models/service.model");
const Slot = require("./src/models/slot.model");
const Appointment = require("./src/models/appointment.model");
const { app } = require("./src/app");

const secret = process.env.JWT_ACCESS_SECRET || "f11adad6587c4468f0feb8761cc25cedf1b2fc07e28ce96ee984301b06cf22c5";

async function runTest() {
  console.log("🧪 Running RBAC & Multi-Tenant Scope Verification Tests...\n");
  await connectDB();

  const ts = Date.now().toString();

  // Create Roles if missing
  let ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) ownerRole = await Role.create({ name: "owner", permissions: ["branch:create", "branch:read", "branch:update", "service:create", "service:read", "service:update", "appointment:read", "appointment:update"] });

  let managerRole = await Role.findOne({ name: "manager" });
  if (!managerRole) managerRole = await Role.create({ name: "manager", permissions: ["branch:read", "branch:update", "service:create", "service:read", "service:update", "appointment:read", "appointment:update"] });

  let customerRole = await Role.findOne({ name: "customer" });
  if (!customerRole) customerRole = await Role.create({ name: "customer", permissions: ["appointment:create", "appointment:read"] });

  // Create Owners & Salons
  const ownerA = await User.create({ name: `Owner A ${ts}`, email: `ownera_${ts}@example.com`, role: ownerRole._id, gender: "male", tokenVersion: 0 });
  const salonA = await Salon.create({ name: `Salon A ${ts}`, owner: ownerA._id });
  ownerA.salonId = salonA._id;
  await ownerA.save();

  const ownerB = await User.create({ name: `Owner B ${ts}`, email: `ownerb_${ts}@example.com`, role: ownerRole._id, gender: "male", tokenVersion: 0 });
  const salonB = await Salon.create({ name: `Salon B ${ts}`, owner: ownerB._id });
  ownerB.salonId = salonB._id;
  await ownerB.save();

  // Create Branches
  const branchA = await Branch.create({ name: `Branch A ${ts}`, salonId: salonA._id, contactPhone: "9876543210", address: { street: "St 1", city: "City A", state: "State A", pincode: "751001" }, citySlug: "citya" });
  const branchB = await Branch.create({ name: `Branch B ${ts}`, salonId: salonB._id, contactPhone: "9876543211", address: { street: "St 2", city: "City B", state: "State B", pincode: "751002" }, citySlug: "cityb" });

  // Create Managers
  const managerA = await User.create({ name: `Manager A ${ts}`, email: `managera_${ts}@example.com`, role: managerRole._id, salonId: salonA._id, branchId: branchA._id, gender: "female", tokenVersion: 0 });
  const managerB = await User.create({ name: `Manager B ${ts}`, email: `managerb_${ts}@example.com`, role: managerRole._id, salonId: salonB._id, branchId: branchB._id, gender: "female", tokenVersion: 0 });

  // Create Services
  const serviceB = await Service.create({ name: `Service B ${ts}`, salonId: salonB._id, branchId: branchB._id, category: "hair", price: 50000, durationMinutes: 30 });
  const serviceA = await Service.create({ name: `Service A ${ts}`, salonId: salonA._id, branchId: branchA._id, category: "hair", price: 40000, durationMinutes: 30 });

  // Create Slot & Appointment in Branch B
  const slotB = await Slot.create({ salonId: salonB._id, branchId: branchB._id, staffId: managerB._id, date: "2026-08-30", startTime: "10:00", endTime: "10:30", status: "BOOKED" });
  const apptB = await Appointment.create({
    bookingNumber: `APPT-B-${ts}`,
    customerId: ownerA._id,
    salonId: salonB._id,
    branchId: branchB._id,
    staffId: managerB._id,
    serviceId: serviceB._id,
    slotId: slotB._id,
    services: [serviceB._id],
    date: "2026-08-30",
    startTime: "10:00",
    endTime: "10:30",
    totalAmount: 50000,
    pricePaid: 50000,
    status: "CONFIRMED",
  });

  // JWT Tokens
  const tokenOwnerA = jwt.sign({ userId: ownerA._id.toString(), role: "owner", salonId: salonA._id.toString(), tokenVersion: 0 }, secret);
  const tokenManagerA = jwt.sign({ userId: managerA._id.toString(), role: "manager", salonId: salonA._id.toString(), branchId: branchA._id.toString(), tokenVersion: 0 }, secret);

  // --- Test Case 1: Owner of Salon A attempting POST /salons/:salonIdOfSalonB/branches ---
  console.log("1️⃣ Test 1: Owner of Salon A creating branch under Salon B...");
  const res1 = await request(app)
    .post(`/api/v1/salons/${salonB._id}/branches`)
    .set("Authorization", `Bearer ${tokenOwnerA}`)
    .send({ name: "Cross Branch", contactPhone: "9876543219", citySlug: "cityb", address: { street: "X", city: "C", state: "S", pincode: "751001" } });

  console.log(`   Status: ${res1.statusCode} | Body:`, res1.body);
  if (res1.statusCode !== 403) throw new Error(`Test 1 Failed: Expected 403, got ${res1.statusCode}`);

  // --- Test Case 2: Manager of Branch A attempting to update a service on Branch B ---
  console.log("\n2️⃣ Test 2: Manager of Branch A updating service on Branch B...");
  const res2 = await request(app)
    .patch(`/api/v1/branches/${branchB._id}/services/${serviceB._id}`)
    .set("Authorization", `Bearer ${tokenManagerA}`)
    .send({ price: 99900 });

  console.log(`   Status: ${res2.statusCode} | Body:`, res2.body);
  if (res2.statusCode !== 403) throw new Error(`Test 2 Failed: Expected 403, got ${res2.statusCode}`);

  // --- Test Case 3: Manager of Branch A attempting to view/update appointment of Branch B ---
  console.log("\n3️⃣ Test 3: Manager of Branch A viewing appointment of Branch B...");
  const res3 = await request(app)
    .get(`/api/v1/appointments/${apptB._id}`)
    .set("Authorization", `Bearer ${tokenManagerA}`);

  console.log(`   Status: ${res3.statusCode} | Body:`, res3.body);
  if (res3.statusCode !== 403) throw new Error(`Test 3 Failed: Expected 403, got ${res3.statusCode}`);

  // --- Test Case 4: Legitimate owner/manager operating on their own resources ---
  console.log("\n4️⃣ Test 4: Legitimate Owner A creating branch under Salon A & Manager A updating Service A...");
  const res4a = await request(app)
    .post(`/api/v1/salons/${salonA._id}/branches`)
    .set("Authorization", `Bearer ${tokenOwnerA}`)
    .send({ name: `Legit Branch ${ts}`, contactPhone: "9876543299", citySlug: "citya", address: { street: "Street A", city: "City A", state: "State A", pincode: "751001" } });

  console.log(`   4a Owner Create Branch Status: ${res4a.statusCode}`);
  if (res4a.statusCode !== 201) throw new Error(`Test 4a Failed: Expected 201, got ${res4a.statusCode}`);

  const res4b = await request(app)
    .patch(`/api/v1/branches/${branchA._id}/services/${serviceA._id}`)
    .set("Authorization", `Bearer ${tokenManagerA}`)
    .send({ price: 45000 });

  console.log(`   4b Manager Update Service Status: ${res4b.statusCode}`);
  if (res4b.statusCode !== 200) throw new Error(`Test 4b Failed: Expected 200, got ${res4b.statusCode}`);

  console.log("\n🎉 ALL 4 RBAC SCOPE ISOLATION TEST CASES PASSED SUCCESSFULLY!");

  // Cleanup
  await User.deleteMany({ _id: { $in: [ownerA._id, ownerB._id, managerA._id, managerB._id] } });
  await Salon.deleteMany({ _id: { $in: [salonA._id, salonB._id] } });
  await Branch.deleteMany({ _id: { $in: [branchA._id, branchB._id] } });
  await Service.deleteMany({ _id: { $in: [serviceA._id, serviceB._id] } });
  await Slot.deleteOne({ _id: slotB._id });
  await Appointment.deleteOne({ _id: apptB._id });

  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
