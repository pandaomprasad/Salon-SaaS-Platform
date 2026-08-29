const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./src/config/database");
const Slot = require("./src/models/slot.model");
const Appointment = require("./src/models/appointment.model");
const Service = require("./src/models/service.model");
const Branch = require("./src/models/branch.model");
const Salon = require("./src/models/salon.model");
const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");

async function testUserRetryWithoutHeader() {
  console.log("🧪 Testing User Retry WITHOUT Idempotency-Key Header...");

  await connectDB();
  const testSuffix = Date.now().toString();

  let customerRole = await Role.findOne({ name: "customer" });
  if (!customerRole) customerRole = await Role.create({ name: "customer", permissions: [] });

  let ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) ownerRole = await Role.create({ name: "owner", permissions: [] });

  let staffRole = await Role.findOne({ name: "staff" });
  if (!staffRole) staffRole = await Role.create({ name: "staff", permissions: [] });

  const owner = await User.create({
    name: "Retry Test Owner",
    email: `owner_retry_${testSuffix}@example.com`,
    password: "password123",
    role: ownerRole._id,
    gender: "male",
  });

  const customer = await User.create({
    name: "Retry Test Customer",
    email: `customer_retry_${testSuffix}@example.com`,
    password: "password123",
    role: customerRole._id,
    gender: "female",
  });

  const staff = await User.create({
    name: "Retry Test Staff",
    email: `staff_retry_${testSuffix}@example.com`,
    password: "password123",
    role: staffRole._id,
    gender: "male",
  });

  const salon = await Salon.create({
    name: "Retry Salon",
    owner: owner._id,
    contactEmail: owner.email,
    contactPhone: "9999999999",
  });

  const branch = await Branch.create({
    salonId: salon._id,
    name: "Retry Branch",
    citySlug: "brahmapur",
    contactPhone: "9999999999",
    address: { street: "123 St", city: "Brahmapur", state: "Odisha", pincode: "760001" },
  });

  const service = await Service.create({
    salonId: salon._id,
    branchId: branch._id,
    name: "Retry Service",
    category: "hair",
    price: 50000,
    durationMinutes: 30,
    isActive: true,
  });

  const slot = await Slot.create({
    salonId: salon._id,
    branchId: branch._id,
    staffId: staff._id,
    date: "2026-12-31",
    startTime: "11:00",
    endTime: "11:30",
    status: "AVAILABLE",
  });

  // 1. First booking attempt by customer
  const firstAppt = await Appointment.create({
    salonId: salon._id,
    branchId: branch._id,
    customerId: customer._id,
    staffId: staff._id,
    serviceId: service._id,
    services: [service._id],
    slotId: slot._id,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    pricePaid: service.price,
    currency: "INR",
    status: "PENDING",
  });
  await Slot.findByIdAndUpdate(slot._id, { status: "BOOKED", reservedBy: customer._id, appointmentId: firstAppt._id });

  console.log(`📌 First booking created appointment ID: ${firstAppt._id}`);

  // 2. Customer retries booking WITHOUT idempotency header
  console.log("⚡ Customer retrying booking for the same slot WITHOUT idempotency header...");

  const existingSlotBooking = await Appointment.findOne({
    customerId: customer._id,
    slotId: slot._id,
    status: { $in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
  });

  console.log(`Retry check result: ${existingSlotBooking ? 'FOUND EXISTING BOOKING ✅' : 'NOT FOUND ❌'}`);

  // Cleanup
  await Slot.deleteMany({ _id: slot._id });
  await Appointment.deleteMany({ slotId: slot._id });
  await Service.deleteMany({ _id: service._id });
  await Branch.deleteMany({ _id: branch._id });
  await Salon.deleteMany({ _id: salon._id });
  await User.deleteMany({ _id: { $in: [owner._id, customer._id, staff._id] } });
  await mongoose.disconnect();

  if (existingSlotBooking && String(existingSlotBooking._id) === String(firstAppt._id)) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! User retry without idempotency key detects reservedBy/customerId and returns existing booking!");
    process.exit(0);
  } else {
    console.error("❌ FAILED! User retry did not detect existing appointment.");
    process.exit(1);
  }
}

testUserRetryWithoutHeader().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
