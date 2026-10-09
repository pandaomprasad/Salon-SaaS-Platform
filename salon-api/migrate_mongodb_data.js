const mongoose = require("mongoose");

const OLD_URI = "mongodb://omprasadpanda1_db_user:Rh9ZoENgfquaUfls@salon-1.bwcr5gx.mongodb.net:27017,ac-ilwbqsd-shard-00-01.bwcr5gx.mongodb.net:27017,ac-ilwbqsd-shard-00-02.bwcr5gx.mongodb.net:27017/test?ssl=true&replicaSet=atlas-g0h64q-shard-0&authSource=admin&appName=salon-1";
const NEW_URI = "mongodb://hairxsalonservice_db_user:Nc2xUJtU8Q4PDFo9@ac-ubfpeki-shard-00-00.zx0leug.mongodb.net:27017,ac-ubfpeki-shard-00-01.zx0leug.mongodb.net:27017,ac-ubfpeki-shard-00-02.zx0leug.mongodb.net:27017/salon_saas?ssl=true&replicaSet=atlas-kws9j1-shard-0&authSource=admin&appName=Cluster0";

async function migrateData() {
  console.log("==================================================");
  console.log("🚀 STARTING COMPLETE MONGODB DATA MIGRATION");
  console.log("==================================================");

  // 1. Connect to Old MongoDB Connection (database: test)
  console.log("\n📦 1. Connecting to OLD MongoDB Cluster (db: test)...");
  const oldConn = await mongoose.createConnection(OLD_URI).asPromise();
  console.log("✅ Connected to OLD MongoDB Cluster!");

  const oldDb = oldConn.db;
  const collections = await oldDb.listCollections().toArray();
  console.log(`\n📋 Found ${collections.length} collections in OLD database:`, collections.map((c) => c.name));

  // 2. Connect to New MongoDB Connection (database: salon_saas)
  console.log("\n📦 2. Connecting to NEW MongoDB Cluster (db: salon_saas)...");
  const newConn = await mongoose.createConnection(NEW_URI).asPromise();
  console.log("✅ Connected to NEW MongoDB Cluster!");

  const newDb = newConn.db;

  let totalMigratedDocs = 0;

  // 3. Migrate Collection by Collection into "salon_saas"
  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith("system.")) continue;

    console.log(`\n🚚 Migrating collection: "${colName}"...`);
    const docs = await oldDb.collection(colName).find({}).toArray();

    if (docs.length === 0) {
      console.log(`   ℹ️ Collection "${colName}" is empty in old DB, skipping.`);
      continue;
    }

    console.log(`   📥 Read ${docs.length} documents from OLD DB.`);

    const targetCol = newDb.collection(colName);
    
    // Clear sample seeded data in target collection to avoid duplicate email/key conflicts
    try {
      await targetCol.deleteMany({});
      console.log(`   🧹 Cleared target collection "${colName}" in new DB.`);
    } catch (e) {}

    let count = 0;
    // Insert all documents in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      await targetCol.insertMany(chunk, { ordered: false });
      count += chunk.length;
      console.log(`   ⏳ Progress: ${count} / ${docs.length} documents inserted...`);
    }

    totalMigratedDocs += count;
    console.log(`   ✅ Successfully migrated all ${count} documents into NEW DB for collection "${colName}"!`);
  }

  // 4. Also mirror into "test" DB on new cluster for complete backwards compatibility
  console.log("\n📦 4. Mirroring collections into 'test' DB on new cluster...");
  const newConnTestDb = newConn.useDb("test").db;
  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith("system.")) continue;

    const docs = await oldDb.collection(colName).find({}).toArray();
    if (docs.length === 0) continue;

    const targetCol = newConnTestDb.collection(colName);
    try {
      await targetCol.deleteMany({});
    } catch (e) {}

    const chunkSize = 500;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      await targetCol.insertMany(chunk, { ordered: false });
    }
  }
  console.log("✅ Successfully mirrored all collections into 'test' DB on new cluster!");

  // 5. Ensure hairxsalonservice@gmail.com SuperAdmin user exists in the migrated database
  console.log("\n👤 5. Verifying SuperAdmin user (hairxsalonservice@gmail.com)...");
  const Role = require("./src/models/role.model");
  const User = require("./src/models/user.model");
  
  // Set up connection for Mongoose model queries
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(NEW_URI);
  }

  let superadminRole = await Role.findOne({ name: "superadmin" });
  if (!superadminRole) {
    superadminRole = await Role.create({
      name: "superadmin",
      description: "Super Administrator with full system control",
      scopes: ["*"],
    });
  }

  const clientEmail = "hairxsalonservice@gmail.com";
  const defaultPassword = "Admin@123";
  let adminUser = await User.findOne({ email: clientEmail });

  if (adminUser) {
    adminUser.role = superadminRole._id;
    adminUser.password = defaultPassword;
    adminUser.isActive = true;
    adminUser.isEmailVerified = true;
    await adminUser.save();
    console.log(`✅ Updated existing user ${clientEmail} to SuperAdmin role.`);
  } else {
    await User.create({
      name: "HairX Platform Admin",
      email: clientEmail,
      phone: "+91-9876543210",
      password: defaultPassword,
      gender: "male",
      role: superadminRole._id,
      isActive: true,
      isEmailVerified: true,
    });
    console.log(`✅ Created SuperAdmin user ${clientEmail}.`);
  }

  console.log("\n==================================================");
  console.log(`🎉 FULL MIGRATION COMPLETE SUCCESS!`);
  console.log(`   Total Documents Transferred: ${totalMigratedDocs}`);
  console.log(`   SuperAdmin Account       : ${clientEmail} (Password: ${defaultPassword})`);
  console.log("==================================================");

  await oldConn.close();
  await newConn.close();
  process.exit(0);
}

migrateData().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
