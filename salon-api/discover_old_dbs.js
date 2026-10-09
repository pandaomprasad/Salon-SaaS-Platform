const mongoose = require("mongoose");

const OLD_URI = "mongodb://omprasadpanda1_db_user:Rh9ZoENgfquaUfls@salon-1.bwcr5gx.mongodb.net:27017,ac-ilwbqsd-shard-00-01.bwcr5gx.mongodb.net:27017,ac-ilwbqsd-shard-00-02.bwcr5gx.mongodb.net:27017/?ssl=true&replicaSet=atlas-g0h64q-shard-0&authSource=admin&appName=salon-1";

async function discover() {
  console.log("🔍 Scanning old MongoDB cluster for all databases...");
  const conn = await mongoose.createConnection(OLD_URI).asPromise();
  const adminDb = conn.db.admin();
  const dbs = await adminDb.listDatabases();
  console.log("📂 Available databases in OLD cluster:", dbs.databases);

  for (const dbInfo of dbs.databases) {
    if (["admin", "local", "config"].includes(dbInfo.name)) continue;
    const dbConn = conn.useDb(dbInfo.name);
    const cols = await dbConn.db.listCollections().toArray();
    console.log(`\n📌 Database "${dbInfo.name}" (${dbInfo.sizeOnDisk} bytes) has collections:`, cols.map(c => c.name));
    for (const c of cols) {
      const count = await dbConn.db.collection(c.name).countDocuments();
      console.log(`   - ${c.name}: ${count} docs`);
    }
  }

  await conn.close();
  process.exit(0);
}

discover().catch(console.error);
