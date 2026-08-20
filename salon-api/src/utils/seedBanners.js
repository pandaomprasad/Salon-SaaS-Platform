// salon-api/src/utils/seedBanners.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const Banner = require("../models/Banner");

const DEMO_BANNERS = [
  {
    title: "Flat 20% Off Your First Luxury Session",
    subtitle: "Experience master hair styling & luxury spa treatments",
    details:
      "Valid for new customers on their first salon booking. Applicable on all haircut, coloring, and facial packages above ₹499. Cannot be combined with existing cashback or seasonal discounts.",
    tag: "WELCOME OFFER",
    ctaText: "Claim discount",
    imageUrl:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
    promoCode: "FIRST20",
    targetType: "EXPLORE",
    isActive: true,
    displayOrder: 1,
  },
  {
    title: "Curated Bridal & Pre-Wedding Makeover",
    subtitle: "Book top-rated master artists & premium organic skincare",
    details:
      "Get complimentary trial sessions on full bridal makeup packages booked 14 days in advance. Valid across top-rated verified studios.",
    tag: "BRIDAL EDITION",
    ctaText: "Explore packages",
    imageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
    promoCode: "BRIDALGLOW",
    targetType: "CATEGORY",
    category: "bridal",
    isActive: true,
    displayOrder: 2,
  },
  {
    title: "Weekend Hair Keratin & Spa Care at ₹999",
    subtitle: "Deep conditioning, head massage & precision haircut",
    details:
      "Special price valid for appointments scheduled on Friday, Saturday, and Sunday. Subject to slot availability.",
    tag: "SPECIAL OFFER",
    ctaText: "Book deal",
    imageUrl:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop",
    promoCode: "KERATIN500",
    targetType: "CATEGORY",
    category: "hair",
    isActive: true,
    displayOrder: 3,
  },
];

async function seedBanners() {
  try {
    console.log("📦 Connecting to MongoDB...");
    await connectDB();

    console.log("🧹 Clearing old promo banners...");
    await Banner.deleteMany({});

    console.log("🌱 Inserting demo banners...");
    const created = await Banner.insertMany(DEMO_BANNERS);

    console.log(`✅ Successfully seeded ${created.length} demo banners into database!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed banners:", error);
    process.exit(1);
  }
}

seedBanners();
