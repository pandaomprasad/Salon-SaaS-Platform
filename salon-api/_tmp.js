require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const M = mongoose.createConnection(
  process.env.MONGO_URI || process.env.MONGODB_URI
);
M.on("open", async () => {
  try {
    const db = M.db;
    const delLeaves = await db.collection("staffleaves").deleteMany({
      reason: { $in: ["Medical appointment", "Vacation", "Socket push test"] },
      isActive: true,
      createdBy: "6a7446aac825e7fbac23fcae",
    });
    const delNotifs = await db.collection("notifications").deleteMany({});
    console.log(
      "leaves cleaned:",
      delLeaves.deletedCount,
      "| notifications cleaned:",
      delNotifs.deletedCount
    );
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
});
