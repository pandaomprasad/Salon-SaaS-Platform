// salon-api/seed_royal_cut_combos.js
require("dotenv").config();
const mongoose = require("mongoose");
const Salon = require("./src/models/salon.model");
const Branch = require("./src/models/branch.model");
const Service = require("./src/models/service.model");
const User = require("./src/models/user.model");
const { delCachePattern } = require("./src/services/cache.service");

const COMBO_PACKAGES = [
  {
    name: "Bridal Beauty Makeup",
    description:
      "Women want to feel attractive. We offer timeless beauty package to accentuate their natural beauty so they can feel beautiful in every day.",
    category: "combo",
    packageOfferTag: "Completed Package Offer till sep 18, 2026",
    includedServices: [
      "Hairstyling",
      "Nail",
      "Hair color",
      "Body Glowing",
      "Facial",
      "Spa",
      "Eyebrows",
      "Make up",
      "Retouch",
      "Corner Lashes",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
    price: 499900, // ₹4999 in paise
    durationMinutes: 180,
  },
  {
    name: "Royal Groom Wedding Deluxe",
    description:
      "Complete executive grooming ritual including signature haircut, beard sculpting, de-tan glow facial, and head massage.",
    category: "combo",
    packageOfferTag: "Special Festive Combo • 25% Off",
    includedServices: [
      "Signature Haircut",
      "Beard Sculpting",
      "De-Tan Glow Facial",
      "Deep Head Massage",
      "Charcoal Face Mask",
      "Hair Spa Detox",
      "Manicure & Pedicure",
      "Hot Towel Finish",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop",
    price: 299900, // ₹2999 in paise
    durationMinutes: 120,
  },
  {
    name: "Ultimate Glow & Spa Retreat",
    description:
      "An all-in-one head-to-toe relaxation experience with full body massage, organic facial, hair restructuring spa, and nail therapy.",
    category: "combo",
    packageOfferTag: "Weekend Wellness Special",
    includedServices: [
      "Full Body Aromatherapy",
      "HydraGlow Facial",
      "Keratin Hair Spa",
      "Herbal Steam Bath",
      "Foot Reflexology",
      "Gel Nail Polish",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
    price: 349900, // ₹3499 in paise
    durationMinutes: 150,
  },
  {
    name: "Party Glam Makeover Package",
    description:
      "High-definition festive party makeup, custom hair styling curls or updo, draping, and designer nail art.",
    category: "combo",
    packageOfferTag: "Festive & Party Edition",
    includedServices: [
      "HD Party Makeup",
      "Hair Curls & Styling",
      "Designer Nail Art",
      "Saree / Outfit Draping",
      "Eye Lashes & Shimmer",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop",
    price: 249900, // ₹2499 in paise
    durationMinutes: 90,
  },
];

async function run() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected!");

    const salon = await Salon.findOne({
      name: { $regex: /Royal Cut/i },
    });

    if (!salon) {
      console.error("❌ 'Royal Cut Luxury Salon & Spa' not found in database.");
      process.exit(1);
    }

    console.log(`🏰 Found Salon: "${salon.name}" (${salon._id})`);

    const branches = await Branch.find({ salonId: salon._id });
    if (!branches.length) {
      console.error("❌ No branches found for Royal Cut.");
      process.exit(1);
    }

    for (const branch of branches) {
      console.log(`📍 Processing Branch: "${branch.name}" (${branch._id})`);

      const staffMembers = await User.find({ branchId: branch._id });
      const staffIds = staffMembers.map((s) => s._id);

      for (const pack of COMBO_PACKAGES) {
        const existing = await Service.findOne({
          branchId: branch._id,
          name: pack.name,
        });

        if (existing) {
          existing.category = pack.category;
          existing.description = pack.description;
          existing.packageOfferTag = pack.packageOfferTag;
          existing.includedServices = pack.includedServices;
          existing.imageUrl = pack.imageUrl;
          existing.image = pack.imageUrl;
          existing.price = pack.price;
          existing.durationMinutes = pack.durationMinutes;
          existing.eligibleStaff = staffIds;
          existing.isActive = true;
          await existing.save();
          console.log(`  🔄 Updated combo service: "${pack.name}"`);
        } else {
          await Service.create({
            ...pack,
            image: pack.imageUrl,
            salonId: salon._id,
            branchId: branch._id,
            eligibleStaff: staffIds,
            isActive: true,
          });
          console.log(`  ✨ Created combo service: "${pack.name}"`);
        }
      }

      await delCachePattern(`branch:services:${branch._id}:*`);
      await delCachePattern(`branch:detail:${branch._id}*`);
    }

    await delCachePattern("initial_load:*");
    await delCachePattern("browse:*");

    console.log("\n🎉 Successfully seeded all combo packs to Royal Cut Luxury Salon & Spa!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding combo packs:", err);
    process.exit(1);
  }
}

run();
