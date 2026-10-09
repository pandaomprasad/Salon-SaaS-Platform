require("dotenv").config();
const mongoose = require("mongoose");

async function cleanDb() {
  console.log("==================================================");
  console.log("🧹 CLEANING DATABASE — KEEPING ONLY SUPERADMIN");
  console.log("==================================================");

  const mongoUri = process.env.MONGO_URI;
  console.log("🔄 Connecting to MongoDB:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB.");

  const db = mongoose.connection.db;

  // 1. Identify Superadmin Role and Superadmin Users
  const Role = require("./src/models/role.model");
  const User = require("./src/models/user.model");

  let superadminRole = await Role.findOne({ name: "superadmin" });
  if (!superadminRole) {
    superadminRole = await Role.create({
      name: "superadmin",
      description: "Super Administrator with full system control",
      scopes: ["*"],
    });
  }

  const clientEmail = "hairxsalonservice@gmail.com";

  // Ensure hairxsalonservice@gmail.com is set up as Superadmin
  let superAdminUser = await User.findOne({ email: clientEmail });
  if (!superAdminUser) {
    superAdminUser = await User.create({
      name: "HairX Platform Admin",
      email: clientEmail,
      phone: "+91-9876543210",
      password: "Admin@123",
      gender: "male",
      role: superadminRole._id,
      isActive: true,
      isEmailVerified: true,
    });
    console.log(`✅ SuperAdmin account created: ${clientEmail}`);
  } else {
    superAdminUser.role = superadminRole._id;
    superAdminUser.password = "Admin@123";
    superAdminUser.isActive = true;
    superAdminUser.isEmailVerified = true;
    await superAdminUser.save();
    console.log(`✅ SuperAdmin account preserved & verified: ${clientEmail}`);
  }

  // 2. Wipe Collections (except roles, permissions, and SuperAdmin users)
  const collectionsToWipe = [
    "salons",
    "branches",
    "services",
    "banners",
    "slots",
    "appointments",
    "notifications",
    "uploadedfiles",
    "staffs",
    "staffleaves",
    "ownerregistrationrequests",
    "role",
  ];

  console.log("\n🗑️ Removing all specified collections and data...");
  for (const colName of collectionsToWipe) {
    try {
      const res = await db.collection(colName).deleteMany({});
      console.log(`   - Deleted ${res.deletedCount} items from "${colName}"`);
    } catch (e) {
      console.warn(`   - Warning clearing "${colName}": ${e.message}`);
    }
  }

  // 3. Remove all users EXCEPT superadmins (by role ID or email)
  const userWipeRes = await User.deleteMany({
    $and: [
      { email: { $ne: clientEmail } },
      { email: { $ne: "admin@salonhq.com" } },
      { role: { $ne: superadminRole._id } },
    ],
  });
  console.log(`   - Deleted ${userWipeRes.deletedCount} non-superadmin user(s) from "users"`);

  // 4. Repeat for mirror "test" database if present on cluster
  try {
    const testDb = mongoose.connection.useDb("test").db;
    for (const colName of collectionsToWipe) {
      await testDb.collection(colName).deleteMany({});
    }
    await testDb.collection("users").deleteMany({
      $and: [
        { email: { $ne: clientEmail } },
        { email: { $ne: "admin@salonhq.com" } },
        { role: { $ne: superadminRole._id } },
      ],
    });
    console.log("   - Cleaned mirror database 'test' on cluster.");
  } catch (e) {}

  console.log("\n==================================================");
  console.log("🎉 DATABASE CLEANUP COMPLETE!");
  console.log("==================================================");
  console.log("🛡️ Preserved Roles & Permissions.");
  console.log("🛡️ Preserved SuperAdmin Accounts:");
  console.log(`   Email: ${clientEmail} (Password: Admin@123)`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

cleanDb().catch((err) => {
  console.error("❌ Cleanup error:", err);
  process.exit(1);
});
