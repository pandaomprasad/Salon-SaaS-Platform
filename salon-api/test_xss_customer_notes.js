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

async function runXssTest() {
  console.log("🧪 Testing Stored XSS Prevention in customerNotes...\n");
  await connectDB();

  const ts = Date.now().toString();

  let customerRole = await Role.findOne({ name: "customer" });
  if (!customerRole) customerRole = await Role.create({ name: "customer", permissions: ["appointment:create", "appointment:read"] });

  let ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) ownerRole = await Role.create({ name: "owner", permissions: [] });

  const owner = await User.create({ name: `XSS Owner ${ts}`, email: `xss_owner_${ts}@example.com`, role: ownerRole._id, gender: "male", tokenVersion: 0 });
  const salon = await Salon.create({ name: `XSS Salon ${ts}`, owner: owner._id });
  const branch = await Branch.create({ name: `XSS Branch ${ts}`, salonId: salon._id, contactPhone: "9876543210", address: { street: "St 1", city: "City A", state: "State A", pincode: "751001" }, citySlug: "citya" });
  const staff = await User.create({ name: `XSS Staff ${ts}`, email: `xss_staff_${ts}@example.com`, role: ownerRole._id, gender: "female", tokenVersion: 0 });
  const service = await Service.create({ name: `XSS Service ${ts}`, salonId: salon._id, branchId: branch._id, category: "hair", price: 30000, durationMinutes: 30 });
  const slot = await Slot.create({ salonId: salon._id, branchId: branch._id, staffId: staff._id, date: "2026-08-31", startTime: "14:00", endTime: "14:30", status: "AVAILABLE" });

  const customer = await User.create({ name: `XSS Customer ${ts}`, email: `xss_customer_${ts}@example.com`, role: customerRole._id, gender: "female", tokenVersion: 0 });

  const customerToken = jwt.sign(
    { userId: customer._id.toString(), role: "customer", email: customer.email, tokenVersion: 0 },
    secret,
    { expiresIn: "1h" }
  );

  const xssPayload = "<script>alert(1)</script>";

  console.log(`1️⃣ Sending booking request with malicious customerNotes: "${xssPayload}"...`);
  const res = await request(app)
    .post("/api/v1/appointments")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      slotId: slot._id.toString(),
      serviceIds: [service._id.toString()],
      customerNotes: xssPayload,
    });

  console.log(`   HTTP Status Code: ${res.statusCode}`);
  console.log(`   Response Body:`, res.body);

  if (res.statusCode !== 201 && res.statusCode !== 200) {
    throw new Error(`Booking request failed with status ${res.statusCode}`);
  }

  const appointmentId = res.body.data.appointment._id;
  const persistedAppointment = await Appointment.findById(appointmentId).lean();

  console.log(`\n2️⃣ Querying MongoDB for persisted appointment document...`);
  console.log(`   Persisted customerNotes in DB: "${persistedAppointment.customerNotes}"`);

  // Cleanup
  await User.deleteMany({ _id: { $in: [owner._id, staff._id, customer._id] } });
  await Salon.deleteOne({ _id: salon._id });
  await Branch.deleteOne({ _id: branch._id });
  await Service.deleteOne({ _id: service._id });
  await Slot.deleteOne({ _id: slot._id });
  await Appointment.deleteOne({ _id: appointmentId });

  if (persistedAppointment.customerNotes.includes("<script>")) {
    console.error("❌ FAILED! Raw HTML script tag was persisted in DB! Stored XSS vulnerability exists.");
    process.exit(1);
  } else if (persistedAppointment.customerNotes === "&lt;script&gt;alert(1)&lt;&#x2F;script&gt;") {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! customerNotes was safely pre-escaped before storing in MongoDB!");
    process.exit(0);
  } else {
    console.log(`✅ SANITIZED! customerNotes stored as: "${persistedAppointment.customerNotes}"`);
    process.exit(0);
  }
}

runXssTest().catch((err) => {
  console.error("XSS Test error:", err);
  process.exit(1);
});
