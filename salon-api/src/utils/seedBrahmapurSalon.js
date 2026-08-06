// salon-api/src/utils/seedBrahmapurSalon.js
require("dotenv").config();
const mongoose = require("mongoose");

const Role = require("../models/role.model");
const User = require("../models/user.model");
const Salon = require("../models/salon.model");
const Branch = require("../models/branch.model");
const Service = require("../models/service.model");
const Slot = require("../models/slot.model");

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
  { start: "19:00", end: "20:00" },
];

async function seedBrahmapurSalon() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");

    // Fetch Roles
    const ownerRole = await Role.findOne({ name: "owner" });
    const managerRole = await Role.findOne({ name: "manager" });
    const staffRole = await Role.findOne({ name: "staff" });

    if (!ownerRole || !managerRole || !staffRole) {
      throw new Error("Roles not initialized in database. Run seedMasterData first.");
    }

    // 1. Create Owner with Indian Name
    let owner = await User.findOne({ email: "sahu.owner@salon.com" });
    if (!owner) {
      owner = await User.create({
        name: "Amitabh Sahu",
        email: "sahu.owner@salon.com",
        phone: "+91-9861011111",
        password: "Password@123", // Preserved default password
        role: ownerRole._id,
        isActive: true,
      });
      console.log(`👑 Owner created: ${owner.name} (${owner.email})`);
    } else {
      console.log(`👑 Owner exists: ${owner.name} (${owner.email})`);
    }

    // 2. Create Salon in Brahmapur
    let salon = await Salon.findOne({ name: "Sahu Salon & Spa" });
    if (!salon) {
      salon = await Salon.create({
        name: "Sahu Salon & Spa",
        owner: owner._id,
        description: "Premier luxury hair styling, facial glow treatments and spa therapy in Brahmapur.",
        contactEmail: "contact@sahusalon.com",
        contactPhone: "+91-9861011111",
        coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop",
        rating: 4.9,
        isActive: true,
      });
      await User.findByIdAndUpdate(owner._id, { salonId: salon._id });
      console.log(`🏰 Salon created: ${salon.name}`);
    } else {
      console.log(`🏰 Salon exists: ${salon.name}`);
    }

    // 3. Create Manager with Indian Name
    let manager = await User.findOne({ email: "manager.gopalpur@salon.com" });
    if (!manager) {
      manager = await User.create({
        name: "Subhashree Panda",
        email: "manager.gopalpur@salon.com",
        phone: "+91-9861022222",
        password: "Password@123",
        role: managerRole._id,
        salonId: salon._id,
        isActive: true,
      });
      console.log(`👔 Manager created: ${manager.name} (${manager.email})`);
    } else {
      console.log(`👔 Manager exists: ${manager.name} (${manager.email})`);
    }

    // 4. Create Gopalpur Branch
    let branch = await Branch.findOne({ name: "Gopalpur Branch", salonId: salon._id });
    if (!branch) {
      branch = await Branch.create({
        salonId: salon._id,
        name: "Gopalpur Branch",
        address: {
          street: "Beach Road, Gopalpur-on-Sea",
          city: "Brahmapur",
          state: "Odisha",
          pincode: "760002",
          country: "India",
          coordinates: { lat: 19.261, lng: 84.908 },
        },
        contactPhone: "+91-9861022222",
        contactEmail: "gopalpur@sahusalon.com",
        managerId: manager._id,
        slotDurationMinutes: 60,
      });
      await User.findByIdAndUpdate(manager._id, { branchId: branch._id });
      console.log(`📍 Branch created: ${branch.name} (${branch.address.city})`);
    } else {
      console.log(`📍 Branch exists: ${branch.name} (${branch.address.city})`);
    }

    // 5. Create Staff with Indian Names
    const staffData = [
      { name: "Manas Ranjan Sahoo", email: "manas.staff@sahusalon.com", phone: "+91-9861033331" },
      { name: "Pooja Nayak", email: "pooja.staff@sahusalon.com", phone: "+91-9861033332" },
      { name: "Rajesh Kumar Behera", email: "rajesh.staff@sahusalon.com", phone: "+91-9861033333" },
    ];

    const staffDocs = [];
    for (const stf of staffData) {
      let existingStaff = await User.findOne({ email: stf.email });
      if (!existingStaff) {
        existingStaff = await User.create({
          name: stf.name,
          email: stf.email,
          phone: stf.phone,
          password: "Password@123",
          role: staffRole._id,
          salonId: salon._id,
          branchId: branch._id,
          isActive: true,
        });
        console.log(`✂️ Staff created: ${existingStaff.name} (${existingStaff.email})`);
      }
      staffDocs.push(existingStaff);
    }

    // 6. Create Services for Gopalpur Branch
    const serviceList = [
      {
        branchId: branch._id,
        salonId: salon._id,
        name: "Royal Haircut & Beard Grooming",
        description: "Precision haircut, hot towel massage, and beard styling.",
        category: "hair",
        price: 60000, // ₹600 in paise
        durationMinutes: 45,
        eligibleStaff: [staffDocs[0]._id, staffDocs[2]._id],
      },
      {
        branchId: branch._id,
        salonId: salon._id,
        name: "Gold Radiance Facial",
        description: "Deep cleansing skin glow facial with herbal extracts.",
        category: "skin",
        price: 150000, // ₹1500 in paise
        durationMinutes: 60,
        eligibleStaff: [staffDocs[1]._id],
      },
      {
        branchId: branch._id,
        salonId: salon._id,
        name: "Keratin Smooth Therapy",
        description: "Frizz-control hair restructuring & conditioning treatment.",
        category: "hair",
        price: 300000, // ₹3000 in paise
        durationMinutes: 120,
        eligibleStaff: [staffDocs[0]._id],
      },
      {
        branchId: branch._id,
        salonId: salon._id,
        name: "Herbal Head & Body Spa",
        description: "Aromatherapy therapeutic relaxation and head massage.",
        category: "spa",
        price: 120000, // ₹1200 in paise
        durationMinutes: 60,
        eligibleStaff: [staffDocs[1]._id, staffDocs[2]._id],
      },
      {
        branchId: branch._id,
        salonId: salon._id,
        name: "Bridal & Event Makeup",
        description: "HD bridal & festive party makeup package.",
        category: "makeup",
        price: 400000, // ₹4000 in paise
        durationMinutes: 120,
        eligibleStaff: [staffDocs[1]._id],
      },
    ];

    await Service.deleteMany({ branchId: branch._id });
    const insertedServices = await Service.insertMany(serviceList);
    console.log(`💅 Created ${insertedServices.length} services for Gopalpur Branch.`);

    // 7. Pre-generate Slots for All Staff for Next 7 Days
    console.log("⏳ Generating bookable time slots...");
    await Slot.deleteMany({ branchId: branch._id });

    const today = new Date();
    const slotDocs = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split("T")[0];

      staffDocs.forEach((stf) => {
        SLOT_TIMES.forEach((time) => {
          slotDocs.push({
            branchId: branch._id,
            salonId: salon._id,
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
    console.log(`📅 Generated ${slotDocs.length} time slots for Gopalpur Branch staff!`);

    console.log("\n=======================================================");
    console.log("🎉 BRAHMAPUR SALON (GOPALPUR BRANCH) SEEDED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log(`  🏰 Salon: ${salon.name}`);
    console.log(`  📍 City: Brahmapur | Branch: Gopalpur Branch`);
    console.log(`  👑 Owner: ${owner.name} (${owner.email})`);
    console.log(`  👔 Manager: ${manager.name} (${manager.email})`);
    console.log(`  ✂️ Staff:`);
    staffDocs.forEach((s) => console.log(`      - ${s.name} (${s.email})`));
    console.log(`  🔑 Password for all accounts: Password@123`);
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

seedBrahmapurSalon();
