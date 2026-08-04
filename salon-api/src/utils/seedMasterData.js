// salon-api/src/utils/seedMasterData.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Permission = require("../models/permission.model");
const Role = require("../models/role.model");
const User = require("../models/user.model");
const Salon = require("../models/salon.model");
const Branch = require("../models/branch.model");
const Service = require("../models/service.model");
const Slot = require("../models/slot.model");
const Appointment = require("../models/appointment.model");

// ==========================================
// Step 1 — Permissions List
// ==========================================
const PERMISSIONS = [
  // Salon permissions
  { resource: "salon", action: "create", description: "Create a new salon org" },
  { resource: "salon", action: "read", description: "View salon details" },
  { resource: "salon", action: "update", description: "Update salon info" },
  { resource: "salon", action: "delete", description: "Delete a salon" },

  // Branch permissions
  { resource: "branch", action: "create", description: "Create a new branch" },
  { resource: "branch", action: "read", description: "View branch details" },
  { resource: "branch", action: "update", description: "Update branch info" },
  { resource: "branch", action: "delete", description: "Delete a branch" },

  // Staff permissions
  { resource: "staff", action: "create", description: "Add staff to branch" },
  { resource: "staff", action: "read", description: "View staff list" },
  { resource: "staff", action: "update", description: "Update staff info" },
  { resource: "staff", action: "delete", description: "Remove staff from branch" },

  // Manager permissions
  { resource: "manager", action: "create", description: "Assign a manager to branch" },
  { resource: "manager", action: "read", description: "View manager info" },
  { resource: "manager", action: "update", description: "Update manager info" },
  { resource: "manager", action: "delete", description: "Remove manager from branch" },

  // Service permissions
  { resource: "service", action: "create", description: "Add a service to branch" },
  { resource: "service", action: "read", description: "View services" },
  { resource: "service", action: "update", description: "Update service/price" },
  { resource: "service", action: "delete", description: "Remove a service" },

  // Slot permissions
  { resource: "slot", action: "create", description: "Generate slots" },
  { resource: "slot", action: "read", description: "View available slots" },
  { resource: "slot", action: "update", description: "Block/unblock a slot" },
  { resource: "slot", action: "delete", description: "Delete slots" },

  // Appointment permissions
  { resource: "appointment", action: "create", description: "Book an appointment" },
  { resource: "appointment", action: "read", description: "View appointments" },
  { resource: "appointment", action: "update", description: "Update appointment status" },
  { resource: "appointment", action: "delete", description: "Cancel an appointment" },

  // Report permissions
  { resource: "report", action: "read", description: "View analytics and reports" },
];

const ROLE_PERMISSIONS = {
  superadmin: [
    "salon:create", "salon:read", "salon:update", "salon:delete",
    "branch:create", "branch:read", "branch:update", "branch:delete",
    "manager:create", "manager:read", "manager:update", "manager:delete",
    "staff:create", "staff:read", "staff:update", "staff:delete",
    "service:read", "report:read"
  ],
  owner: [
    "salon:create", "salon:read", "salon:update", "salon:delete",
    "branch:create", "branch:read", "branch:update", "branch:delete",
    "manager:create", "manager:read", "manager:update", "manager:delete",
    "staff:create", "staff:read", "staff:update", "staff:delete",
    "service:create", "service:read", "service:update", "service:delete",
    "slot:create", "slot:read", "slot:update", "slot:delete",
    "appointment:create", "appointment:read", "appointment:update", "appointment:delete",
    "report:read"
  ],
  manager: [
    "branch:read",
    "staff:create", "staff:read", "staff:update", "staff:delete",
    "service:create", "service:read", "service:update", "service:delete",
    "slot:create", "slot:read", "slot:update", "slot:delete",
    "appointment:read", "appointment:update", "report:read"
  ],
  staff: [
    "service:read", "slot:read", "appointment:read", "appointment:update"
  ],
  customer: [
    "service:read", "slot:read", "appointment:create", "appointment:read", "appointment:update", "appointment:delete"
  ]
};

// Standard Slot Times
const SLOT_TIMES = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
  { start: "18:00", end: "19:00" },
  { start: "19:00", end: "20:00" }
];

async function seedMasterData() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");

    // 1. Clear existing collections
    console.log("🧹 Clearing old data...");
    await Promise.all([
      Permission.deleteMany({}),
      Role.deleteMany({}),
      User.deleteMany({}),
      Salon.deleteMany({}),
      Branch.deleteMany({}),
      Service.deleteMany({}),
      Slot.deleteMany({}),
      Appointment.deleteMany({}),
    ]);
    console.log("✨ All existing collections cleared.");

    // 2. Insert Permissions
    const insertedPermissions = await Permission.insertMany(PERMISSIONS);
    const permMap = {};
    insertedPermissions.forEach((p) => {
      permMap[`${p.resource}:${p.action}`] = p._id;
    });

    // 3. Insert Roles
    const roleDocs = Object.entries(ROLE_PERMISSIONS).map(([name, keys]) => ({
      name,
      permissions: keys.map((key) => permMap[key]),
      description: `${name} role with system privileges`,
    }));
    const insertedRoles = await Role.insertMany(roleDocs);
    const roleMap = {};
    insertedRoles.forEach((r) => {
      roleMap[r.name] = r._id;
    });
    console.log("✅ Permissions & Roles created.");

    // 4. Create SuperAdmin
    const superadmin = await User.create({
      name: "Platform SuperAdmin",
      email: "admin@salonhq.com",
      phone: "+91-9999900000",
      password: "Admin@123",
      role: roleMap["superadmin"],
      isActive: true,
    });
    console.log(`👤 SuperAdmin created: ${superadmin.email}`);

    // 5. Create Test Customers
    const customer1 = await User.create({
      name: "Priya Sharma",
      email: "customer@salon.com",
      phone: "+91-9876543001",
      password: "Password@123",
      role: roleMap["customer"],
      isActive: true,
    });
    const customer2 = await User.create({
      name: "Rahul Verma",
      email: "rahul@gmail.com",
      phone: "+91-9876543002",
      password: "Password@123",
      role: roleMap["customer"],
      isActive: true,
    });
    console.log(`👥 Customers created: ${customer1.email}, ${customer2.email}`);

    // ========================================================
    // SALON 1: Glamour Studios & Spa
    // ========================================================
    const owner1 = await User.create({
      name: "Rajesh Malhotra",
      email: "owner@salon.com",
      phone: "+91-9820011111",
      password: "Password@123",
      role: roleMap["owner"],
      isActive: true,
    });

    const salon1 = await Salon.create({
      name: "Glamour Studios & Spa",
      owner: owner1._id,
      description: "Premier luxury hair styling, facial glow treatments and spa therapy.",
      contactEmail: "contact@glamourstudios.com",
      contactPhone: "+91-9820011111",
      isActive: true,
    });
    await User.findByIdAndUpdate(owner1._id, { salonId: salon1._id });
    console.log(`🏰 Salon 1 created: ${salon1.name} (Owner: ${owner1.email})`);

    // --- Salon 1, Branch 1: Bandra West ---
    const manager1_1 = await User.create({
      name: "Vikram Mehta",
      email: "manager@salon.com",
      phone: "+91-9820022221",
      password: "Password@123",
      role: roleMap["manager"],
      salonId: salon1._id,
      isActive: true,
    });

    const branch1_1 = await Branch.create({
      salonId: salon1._id,
      name: "Bandra West Studio",
      address: {
        street: "14 Linking Road, Bandra West",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400050",
        country: "India",
        coordinates: { lat: 19.060, lng: 72.836 },
      },
      contactPhone: "+91-9820022221",
      contactEmail: "bandra@glamourstudios.com",
      managerId: manager1_1._id,
      slotDurationMinutes: 60,
    });
    await User.findByIdAndUpdate(manager1_1._id, { branchId: branch1_1._id });

    // --- Salon 1, Branch 3: Bhubaneswar Saheed Nagar ---
    const branch1_3 = await Branch.create({
      salonId: salon1._id,
      name: "Bhubaneswar Saheed Nagar Studio",
      address: {
        street: "Janpath Road, Saheed Nagar",
        city: "Bhubaneswar",
        state: "Odisha",
        pincode: "751007",
        country: "India",
        coordinates: { lat: 20.296, lng: 85.824 },
      },
      contactPhone: "+91-9820022299",
      contactEmail: "bhubaneswar@glamourstudios.com",
      managerId: manager1_1._id,
      slotDurationMinutes: 60,
    });

    // Staff for Branch 1_1
    const staff1_1_a = await User.create({
      name: "Aarav Sharma",
      email: "staff@salon.com",
      phone: "+91-9820033331",
      password: "Password@123",
      role: roleMap["staff"],
      salonId: salon1._id,
      branchId: branch1_1._id,
      isActive: true,
    });
    const staff1_1_b = await User.create({
      name: "Priya Patel",
      email: "priya.staff@glamour.com",
      phone: "+91-9820033332",
      password: "Password@123",
      role: roleMap["staff"],
      salonId: salon1._id,
      branchId: branch1_1._id,
      isActive: true,
    });

    // Services for Branch 1_1
    const services1_1 = await Service.insertMany([
      {
        branchId: branch1_1._id,
        salonId: salon1._id,
        name: "Premium Haircut & Wash",
        description: "Precision styling cut with scalp massage and blow dry.",
        category: "hair",
        price: 80000, // ₹800
        durationMinutes: 45,
        eligibleStaff: [staff1_1_a._id],
      },
      {
        branchId: branch1_1._id,
        salonId: salon1._id,
        name: "Keratin Smooth Therapy",
        description: "Intense frizz control and hair restructuring treatment.",
        category: "hair",
        price: 350000, // ₹3500
        durationMinutes: 120,
        eligibleStaff: [staff1_1_a._id],
      },
      {
        branchId: branch1_1._id,
        salonId: salon1._id,
        name: "HydraGlow Facial",
        description: "Deep cleansing facial with hyaluronic hydration.",
        category: "skin",
        price: 220000, // ₹2200
        durationMinutes: 60,
        eligibleStaff: [staff1_1_b._id],
      },
      {
        branchId: branch1_1._id,
        salonId: salon1._id,
        name: "Gel Nail Art & Polish",
        description: "Custom long-lasting gel manicures with designer nail art.",
        category: "nails",
        price: 150000, // ₹1500
        durationMinutes: 60,
        eligibleStaff: [staff1_1_b._id],
      },
    ]);
    console.log(`  📍 Branch 1: ${branch1_1.name} (4 services, 2 staff)`);

    // --- Salon 1, Branch 2: Indiranagar ---
    const manager1_2 = await User.create({
      name: "Rohan Nair",
      email: "rohan.mgr@glamour.com",
      phone: "+91-9820022222",
      password: "Password@123",
      role: roleMap["manager"],
      salonId: salon1._id,
      isActive: true,
    });

    const branch1_2 = await Branch.create({
      salonId: salon1._id,
      name: "Indiranagar Flagship",
      address: {
        street: "100 Feet Road, Indiranagar",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560038",
        country: "India",
        coordinates: { lat: 12.978, lng: 77.640 },
      },
      contactPhone: "+91-9820022222",
      contactEmail: "indiranagar@glamourstudios.com",
      managerId: manager1_2._id,
      slotDurationMinutes: 60,
    });
    await User.findByIdAndUpdate(manager1_2._id, { branchId: branch1_2._id });

    const staff1_2_a = await User.create({
      name: "Kavya Menon",
      email: "kavya.staff@glamour.com",
      phone: "+91-9820033333",
      password: "Password@123",
      role: roleMap["staff"],
      salonId: salon1._id,
      branchId: branch1_2._id,
      isActive: true,
    });

    await Service.insertMany([
      {
        branchId: branch1_2._id,
        salonId: salon1._id,
        name: "Signature Balayage Color",
        description: "Hand-painted dimensional hair highlights.",
        category: "hair",
        price: 400000, // ₹4000
        durationMinutes: 120,
        eligibleStaff: [staff1_2_a._id],
      },
      {
        branchId: branch1_2._id,
        salonId: salon1._id,
        name: "Deep Tissue Body Spa",
        description: "Therapeutic full body aromatherapy relaxation massage.",
        category: "spa",
        price: 280000, // ₹2800
        durationMinutes: 90,
        eligibleStaff: [staff1_2_a._id],
      },
    ]);
    console.log(`  📍 Branch 2: ${branch1_2.name} (2 services, 1 staff)`);

    // ========================================================
    // SALON 2: Enrich Hair & Skin Sanctuary
    // ========================================================
    const owner2 = await User.create({
      name: "Sunita Kapoor",
      email: "sunita.owner@enrich.com",
      phone: "+91-9810011111",
      password: "Password@123",
      role: roleMap["owner"],
      isActive: true,
    });

    const salon2 = await Salon.create({
      name: "Enrich Hair & Skin Sanctuary",
      owner: owner2._id,
      description: "State-of-the-art hair restoration, grooming & organic facial spa.",
      contactEmail: "contact@enrichsanctuary.com",
      contactPhone: "+91-9810011111",
      isActive: true,
    });
    await User.findByIdAndUpdate(owner2._id, { salonId: salon2._id });
    console.log(`🏰 Salon 2 created: ${salon2.name} (Owner: ${owner2.email})`);

    // --- Salon 2, Branch 1: Powai Lakefront ---
    const manager2_1 = await User.create({
      name: "Neha Gupta",
      email: "neha.mgr@enrich.com",
      phone: "+91-9810022221",
      password: "Password@123",
      role: roleMap["manager"],
      salonId: salon2._id,
      isActive: true,
    });

    const branch2_1 = await Branch.create({
      salonId: salon2._id,
      name: "Powai Lakefront Lounge",
      address: {
        street: "Hiranandani Gardens, Powai",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400076",
        country: "India",
        coordinates: { lat: 19.119, lng: 72.905 },
      },
      contactPhone: "+91-9810022221",
      contactEmail: "powai@enrichsanctuary.com",
      managerId: manager2_1._id,
      slotDurationMinutes: 60,
    });
    await User.findByIdAndUpdate(manager2_1._id, { branchId: branch2_1._id });

    const staff2_1_a = await User.create({
      name: "Sameer Joshi",
      email: "sameer.staff@enrich.com",
      phone: "+91-9810033331",
      password: "Password@123",
      role: roleMap["staff"],
      salonId: salon2._id,
      branchId: branch2_1._id,
      isActive: true,
    });

    await Service.insertMany([
      {
        branchId: branch2_1._id,
        salonId: salon2._id,
        name: "Executive Haircut & Beard Spa",
        description: "Royal haircut with hot oil beard shape and steam treatment.",
        category: "hair",
        price: 120000, // ₹1200
        durationMinutes: 60,
        eligibleStaff: [staff2_1_a._id],
      },
      {
        branchId: branch2_1._id,
        salonId: salon2._id,
        name: "Charcoal Detox Facial",
        description: "Purifying charcoal facial for deep pore refinement.",
        category: "skin",
        price: 180000, // ₹1800
        durationMinutes: 60,
        eligibleStaff: [staff2_1_a._id],
      },
    ]);
    console.log(`  📍 Branch 1: ${branch2_1.name} (2 services, 1 staff)`);

    // ========================================================
    // Step 6 — Pre-generate Slots for All Staff for Next 7 Days
    // ========================================================
    console.log("⏳ Generating bookable time slots for all staff...");
    const allStaff = [staff1_1_a, staff1_1_b, staff1_2_a, staff2_1_a];
    const today = new Date();
    const slotDocs = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split("T")[0];

      allStaff.forEach((stf) => {
        SLOT_TIMES.forEach((time) => {
          slotDocs.push({
            branchId: stf.branchId,
            salonId: stf.salonId,
            staffId: stf._id,
            date: dateStr,
            startTime: time.start,
            endTime: time.end,
            status: "AVAILABLE",
          });
        });
      });
    }

    await Slot.insertMany(slotDocs);
    console.log(`📅 Inserted ${slotDocs.length} bookable time slots across all staff!`);

    // ========================================================
    // Step 7 — Summary
    // ========================================================
    console.log("\n=======================================================");
    console.log("🎉 MASTER DATA SEEDING COMPLETE!");
    console.log("=======================================================");
    console.log("🔑 Default Login Credentials (Password: Password@123):");
    console.log("  🛡️ SuperAdmin: admin@salonhq.com (Password: Admin@123)");
    console.log("  👑 Salon 1 Owner: owner@salon.com");
    console.log("  🏢 Salon 1 Manager (Bandra): manager@salon.com");
    console.log("  ✂️ Salon 1 Staff (Bandra): staff@salon.com");
    console.log("  👤 Customer: customer@salon.com");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Master Seeding Failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

seedMasterData();
