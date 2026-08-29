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

async function testBookingConcurrency() {
  console.log("🧪 Starting Booking Concurrency & Double-Booking Load Test (10 parallel requests)...");

  // 1. Connect to DB
  await connectDB();
  console.log("✅ Connected to MongoDB database");

  const testSuffix = Date.now().toString();

  // Find or create roles
  let customerRole = await Role.findOne({ name: "customer" });
  if (!customerRole) {
    customerRole = await Role.create({ name: "customer", permissions: [] });
  }

  let ownerRole = await Role.findOne({ name: "owner" });
  if (!ownerRole) {
    ownerRole = await Role.create({ name: "owner", permissions: [] });
  }

  let staffRole = await Role.findOne({ name: "staff" });
  if (!staffRole) {
    staffRole = await Role.create({ name: "staff", permissions: [] });
  }

  // Create dummy owner & salon & branch & service & slot
  const owner = await User.create({
    name: "Test Owner",
    email: `owner_${testSuffix}@example.com`,
    password: "password123",
    role: ownerRole._id,
    gender: "male",
  });

  const customer = await User.create({
    name: "Test Customer",
    email: `customer_${testSuffix}@example.com`,
    password: "password123",
    role: customerRole._id,
    gender: "female",
  });

  const staff = await User.create({
    name: "Test Specialist",
    email: `staff_${testSuffix}@example.com`,
    password: "password123",
    role: staffRole._id,
    gender: "male",
  });

  const salon = await Salon.create({
    name: "Test Concurrency Salon",
    owner: owner._id,
    contactEmail: owner.email,
    contactPhone: "9999999999",
  });

  const branch = await Branch.create({
    salonId: salon._id,
    name: "Main Branch",
    citySlug: "brahmapur",
    contactPhone: "9999999999",
    address: {
      street: "123 Test St",
      city: "Brahmapur",
      state: "Odisha",
      pincode: "760001",
    },
  });

  const service = await Service.create({
    salonId: salon._id,
    branchId: branch._id,
    name: "Haircut Test",
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
    startTime: "10:00",
    endTime: "10:30",
    status: "AVAILABLE",
  });

  console.log(`📌 Created test slot ID: ${slot._id} for date 2026-12-31 10:00`);

  // 2. Launch 10 simultaneous concurrent atomic slot reservation attempts
  console.log("🚀 Launching 10 parallel atomic booking attempts for the SAME slot...");

  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

  const results = await Promise.all(
    Array.from({ length: 10 }).map(async (_, idx) => {
      try {
        const slotToBook = await Slot.findOneAndUpdate(
          {
            _id: slot._id,
            $or: [
              { status: "AVAILABLE" },
              { status: "RESERVED", reservedAt: { $lt: tenMinsAgo }, appointmentId: null },
            ],
          },
          { status: "BOOKED", reservedBy: customer._id, reservedAt: new Date() },
          { new: true },
        );

        if (!slotToBook) {
          return { reqIndex: idx, status: 409, message: "Slot was just booked by another customer" };
        }

        const appointment = await Appointment.create({
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

        await Slot.findByIdAndUpdate(slot._id, { appointmentId: appointment._id });
        return { reqIndex: idx, status: 201, appointmentId: appointment._id };
      } catch (err) {
        return { reqIndex: idx, status: err.status || 500, error: err.message };
      }
    }),
  );

  const successes = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);

  console.log(`📊 Concurrency Load Test Results:`);
  console.log(`   - Successful bookings (201 Created): ${successes.length}`);
  console.log(`   - Rejected conflicts (409 Conflict): ${conflicts.length}`);

  const appointmentCount = await Appointment.countDocuments({ slotId: slot._id });
  const finalSlot = await Slot.findById(slot._id);

  console.log(`   - Total DB Appointments for Slot: ${appointmentCount}`);
  console.log(`   - Final DB Slot Status: ${finalSlot.status}`);

  // Cleanup test documents
  await Slot.deleteMany({ _id: slot._id });
  await Appointment.deleteMany({ slotId: slot._id });
  await Service.deleteMany({ _id: service._id });
  await Branch.deleteMany({ _id: branch._id });
  await Salon.deleteMany({ _id: salon._id });
  await User.deleteMany({ _id: { $in: [owner._id, customer._id, staff._id] } });

  await mongoose.disconnect();

  if (successes.length === 1 && conflicts.length === 9 && appointmentCount === 1) {
    console.log("✅ ACCEPTANCE CRITERIA PASSED! Exactly 1 booking succeeded and 9 received 409 Conflict!");
    process.exit(0);
  } else {
    console.error("❌ ACCEPTANCE CRITERIA FAILED! Race condition detected.");
    process.exit(1);
  }
}

testBookingConcurrency().catch((err) => {
  console.error("Fatal test error:", err.message);
  process.exit(1);
});
