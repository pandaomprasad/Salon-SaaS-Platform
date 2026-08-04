// salon-api/src/utils/wipeAllDataExceptSuperadmin.js
require("dotenv").config();
const mongoose = require("mongoose");

const Permission = require("../models/permission.model");
const Role = require("../models/role.model");
const User = require("../models/user.model");
const Salon = require("../models/salon.model");
const Branch = require("../models/branch.model");
const Service = require("../models/service.model");
const Slot = require("../models/slot.model");
const Appointment = require("../models/appointment.model");

async function wipeAllDataExceptSuperadmin() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");

    // Find Superadmin role
    let superAdminRole = await Role.findOne({ name: "superadmin" });
    
    // Find Superadmin user or keep existing superadmin
    let superAdminUser = await User.findOne({ email: "admin@salonhq.com" });

    console.log("🧹 Wiping out all Salons, Branches, Services, Slots, Appointments, and Non-SuperAdmin Users...");

    await Promise.all([
      Salon.deleteMany({}),
      Branch.deleteMany({}),
      Service.deleteMany({}),
      Slot.deleteMany({}),
      Appointment.deleteMany({}),
      User.deleteMany({ email: { $ne: "admin@salonhq.com" } }),
    ]);

    // Ensure SuperAdmin user exists
    if (!superAdminUser && superAdminRole) {
      superAdminUser = await User.create({
        name: "Platform SuperAdmin",
        email: "admin@salonhq.com",
        phone: "+91-9999900000",
        password: "Admin@123",
        role: superAdminRole._id,
        isActive: true,
      });
      console.log("👤 Created fresh SuperAdmin user: admin@salonhq.com");
    } else {
      console.log(`👤 Preserved SuperAdmin user: ${superAdminUser.email}`);
    }

    console.log("\n=======================================================");
    console.log("✨ DATABASE WIPE COMPLETE!");
    console.log("=======================================================");
    console.log("🛡️ All salons, branches, services, slots & customer data removed.");
    console.log("🔑 Only SuperAdmin preserved:");
    console.log("   Email: admin@salonhq.com");
    console.log("   Password: Admin@123");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Wipe failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

wipeAllDataExceptSuperadmin();
