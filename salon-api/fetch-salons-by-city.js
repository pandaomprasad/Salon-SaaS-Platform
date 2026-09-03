// salon-api/fetch-salons-by-city.js
require("dotenv").config();
const mongoose = require("mongoose");
const Branch = require("./src/models/branch.model");
const Salon = require("./src/models/salon.model");

async function fetchSalonsByCity() {
  const cityInput = process.argv[2] || "Brahmapur";
  console.log(`🔍 Searching database for salons in city: "${cityInput}"...\n`);

  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI missing in .env file.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const cleanCity = cityInput.trim().toLowerCase();
    const cityRegex = new RegExp(cleanCity.replace(/berhampur|brahmapur/gi, "(berhampur|brahmapur)"), "i");

    const branches = await Branch.find({
      $or: [
        { citySlug: cleanCity },
        { citySlug: cityRegex },
        { "address.city": cityRegex },
      ],
      isActive: true,
    })
      .populate("salonId", "name description contactEmail contactPhone coverImage")
      .lean();

    if (!branches || branches.length === 0) {
      console.log(`⚠️ No salons found in "${cityInput}".`);
    } else {
      console.log(`✅ Found ${branches.length} branch(es) in "${cityInput}":\n`);
      branches.forEach((b, index) => {
        console.log(`----------------------------------------`);
        console.log(`Branch #${index + 1}: ${b.name}`);
        console.log(`Salon Name : ${b.salonId?.name || "N/A"}`);
        console.log(`Street     : ${b.address?.street || "N/A"}`);
        console.log(`City       : ${b.address?.city || "N/A"}`);
        console.log(`Phone      : ${b.contactPhone || "N/A"}`);
      });
      console.log(`----------------------------------------\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error querying database:", err.message);
    process.exit(1);
  }
}

fetchSalonsByCity();
