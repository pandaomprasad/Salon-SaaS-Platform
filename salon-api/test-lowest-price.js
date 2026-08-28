// test-lowest-price.js
// Run with: node test-lowest-price.js [optional_salon_id_or_branch_id]

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/database");
const Salon = require("./src/models/salon.model");
const Branch = require("./src/models/branch.model");
const Service = require("./src/models/service.model");

async function testGetLowestServicePrice() {
  try {
    console.log("🔌 Connecting to Database...");
    await connectDB();

    const inputId = process.argv[2];
    let salon = null;
    let branchFilter = {};

    if (inputId && mongoose.Types.ObjectId.isValid(inputId)) {
      // 1. Try to find by Salon ID
      salon = await Salon.findById(inputId).lean();

      if (!salon) {
        // 2. Try to find by Branch ID
        const branch = await Branch.findById(inputId).lean();
        if (branch) {
          salon = await Salon.findById(branch.salonId).lean();
          branchFilter = { _id: branch._id };
          console.log(`ℹ️ Recognized input ID (${inputId}) as Branch ID: "${branch.name}"`);
        }
      } else {
        branchFilter = { salonId: salon._id };
      }
    }

    if (!salon) {
      salon = await Salon.findOne({ isActive: true }).lean();
      branchFilter = { salonId: salon._id };
    }

    if (!salon) {
      console.log("❌ No active salon found in the database.");
      process.exit(1);
    }

    console.log(`\n🏢 Salon Selected: "${salon.name}" (ID: ${salon._id})`);

    // Fetch active branches
    const branches = await Branch.find({
      ...branchFilter,
      isActive: true,
      deactivatedByAdmin: { $ne: true },
    })
      .select("_id name address")
      .lean();

    console.log(`📍 Active Branches Found: ${branches.length}`);
    branches.forEach((b, i) => console.log(`   ${i + 1}. ${b.name} (${b.address?.city || 'N/A'})`));

    if (branches.length === 0) {
      console.log("⚠️ No active branches found for this query.");
      process.exit(0);
    }

    const branchIds = branches.map((b) => b._id);

    // Fetch active services sorted by price ascending
    const services = await Service.find({
      branchId: { $in: branchIds },
      isActive: true,
    })
      .select("name category price durationMinutes branchId")
      .sort({ price: 1 })
      .lean();

    console.log(`\n✂️ Active Services Found: ${services.length}`);

    if (services.length === 0) {
      console.log("⚠️ No active services found.");
      process.exit(0);
    }

    // Lowest price
    const lowestService = services[0];
    const minPricePaise = lowestService.price;
    const minPriceRupees = Math.round(minPricePaise / 100);

    console.log("\n=======================================================");
    console.log(`🏆 LOWEST SERVICE PRICE FOR "${salon.name}":`);
    console.log(`   • Service Name: "${lowestService.name}"`);
    console.log(`   • Category:     ${lowestService.category}`);
    console.log(`   • Price (Paise): ${minPricePaise} paise`);
    console.log(`   • Price (INR):   ₹${minPriceRupees}`);
    console.log("=======================================================\n");

  } catch (error) {
    console.error("❌ Error executing test script:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testGetLowestServicePrice();
