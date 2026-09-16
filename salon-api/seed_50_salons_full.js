// salon-api/seed_50_salons_full.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import Models
const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");
const Permission = require("./src/models/permission.model");
const Salon = require("./src/models/salon.model");
const Branch = require("./src/models/branch.model");
const Service = require("./src/models/service.model");
const Slot = require("./src/models/slot.model");
const Appointment = require("./src/models/appointment.model");
const Banner = require("./src/models/Banner");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

let phoneCounter = Math.floor(Math.random() * 1000);
function getUniquePhone() {
  phoneCounter++;
  const timeSuffix = String(Date.now()).slice(-6);
  const cntSuffix = String(phoneCounter).padStart(3, '0');
  return `9${timeSuffix}${cntSuffix}`.slice(0, 10);
}

const TIME_SLOTS = [
  { start: "09:00", end: "09:45" },
  { start: "10:00", end: "10:45" },
  { start: "11:00", end: "11:45" },
  { start: "12:00", end: "12:45" },
  { start: "14:00", end: "14:45" },
  { start: "15:00", end: "15:45" },
  { start: "16:00", end: "16:45" },
  { start: "17:00", end: "17:45" },
  { start: "18:00", end: "18:45" },
];

const SALON_DATA = [
  { name: "Royal Cut Luxury Salon & Spa", city: "Brahmapur", state: "Odisha", area: "Gajapati Nagar" },
  { name: "Urban Edge Unisex Salon", city: "Brahmapur", state: "Odisha", area: "Gopalpur Road" },
  { name: "Glamour & Shine Studio", city: "Bhubaneswar", state: "Odisha", area: "Saheed Nagar" },
  { name: "Velvet Touch Spa & Salon", city: "Bhubaneswar", state: "Odisha", area: "Patia" },
  { name: "Aura Hair & Beauty Lounge", city: "Cuttack", state: "Odisha", area: "CDA Sector 9" },
  { name: "Bliss Beauty Care", city: "Rourkela", state: "Odisha", area: "Civil Township" },
  { name: "Elegance Hair Lounge", city: "Sambalpur", state: "Odisha", area: "Farm Road" },
  { name: "Radiance Salon & Spa", city: "Puri", state: "Odisha", area: "VIP Road" },
  { name: "Mirror & Mane Unisex Salon", city: "Mumbai", state: "Maharashtra", area: "Bandra West" },
  { name: "Serenity Spa & Wellness", city: "Mumbai", state: "Maharashtra", area: "Juhu" },
  { name: "Scissors & Styles", city: "Delhi", state: "Delhi", area: "Connaught Place" },
  { name: "The Hair Craft Studio", city: "Delhi", state: "Delhi", area: "South Extension" },
  { name: "Luxe Glow Beauty Bar", city: "Bangalore", state: "Karnataka", area: "Indiranagar" },
  { name: "Crown & Comb Salon", city: "Bangalore", state: "Karnataka", area: "Koramangala" },
  { name: "Style Suite Studio", city: "Hyderabad", state: "Telangana", area: "Jubilee Hills" },
  { name: "Opulent Hair & Spa", city: "Hyderabad", state: "Telangana", area: "Gachibowli" },
  { name: "Prime Cut Lounge", city: "Pune", state: "Maharashtra", area: "Viman Nagar" },
  { name: "Velvet Vibe Salon", city: "Pune", state: "Maharashtra", area: "Kothrud" },
  { name: "Golden Touch Beauty Parlour", city: "Chennai", state: "Tamil Nadu", area: "T. Nagar" },
  { name: "Style Sanctuary", city: "Chennai", state: "Tamil Nadu", area: "Adyar" },
  { name: "Magic Mirror Salon", city: "Kolkata", state: "West Bengal", area: "Park Street" },
  { name: "Regal Roots Hair Studio", city: "Kolkata", state: "West Bengal", area: "Salt Lake" },
  { name: "Rose Beauty & Hair Lounge", city: "Jaipur", state: "Rajasthan", area: "Malviya Nagar" },
  { name: "Trendy Trims Salon", city: "Jaipur", state: "Rajasthan", area: "Vaishali Nagar" },
  { name: "Elite Edge Unisex Salon", city: "Ahmedabad", state: "Gujarat", area: "SG Highway" },
  { name: "Grace & Glam Studio", city: "Ahmedabad", state: "Gujarat", area: "Bodakdev" },
  { name: "Sparkle & Shine Spa", city: "Lucknow", state: "Uttar Pradesh", area: "Hazratganj" },
  { name: "Harmony Hair & Beauty", city: "Chandigarh", state: "Punjab", area: "Sector 17" },
  { name: "Blossom Beauty Lounge", city: "Indore", state: "Madhya Pradesh", area: "Vijay Nagar" },
  { name: "Silk & Scissors Salon", city: "Surat", state: "Gujarat", area: "Vesu" },
  { name: "Urban Trims Lounge", city: "Nagpur", state: "Maharashtra", area: "Dharampeth" },
  { name: "Touch of Class Spa", city: "Vadodara", state: "Gujarat", area: "Alkapuri" },
  { name: "Hair Nirvana Studio", city: "Coimbatore", state: "Tamil Nadu", area: "RS Puram" },
  { name: "Paradise Beauty Salon", city: "Visakhapatnam", state: "Andhra Pradesh", area: "MVP Colony" },
  { name: "Cutting Edge Salon", city: "Patna", state: "Bihar", area: "Boring Road" },
  { name: "Diamond Shine Spa", city: "Bhopal", state: "Madhya Pradesh", area: "MP Nagar" },
  { name: "Royal Polish Nails & Hair", city: "Ludhiana", state: "Punjab", area: "Model Town" },
  { name: "Velvet Hues Unisex Salon", city: "Agra", state: "Uttar Pradesh", area: "Fatehabad Road" },
  { name: "Studio 360 Hair & Beauty", city: "Varanasi", state: "Uttar Pradesh", area: "Cantt" },
  { name: "Natural Glow Wellness", city: "Dehradun", state: "Uttarakhand", area: "Rajpur Road" },
  { name: "Perfect Cut Unisex Salon", city: "Kochi", state: "Kerala", area: "MG Road" },
  { name: "Glamour Lounge", city: "Guwahati", state: "Assam", area: "GS Road" },
  { name: "Pure Bliss Spa & Salon", city: "Goa", state: "Goa", area: "Panaji" },
  { name: "Velvet Touch Unisex Salon", city: "Shimla", state: "Himachal Pradesh", area: "Mall Road" },
  { name: "Signature Styles", city: "Thrissur", state: "Kerala", area: "East Fort" },
  { name: "Urban Unisex Beauty", city: "Mysore", state: "Karnataka", area: "Jayalakshmipuram" },
  { name: "Prestige Hair & Spa", city: "Nashik", state: "Maharashtra", area: "College Road" },
  { name: "Supreme Cut Lounge", city: "Rajkot", state: "Gujarat", area: "Yagnik Road" },
  { name: "Elegance Studio & Spa", city: "Jodhpur", state: "Rajasthan", area: "Sardarpura" },
  { name: "Horizon Hair Care", city: "Madurai", state: "Tamil Nadu", area: "KK Nagar" },
];

const SERVICE_TEMPLATES = [
  { name: "Classic Men's Haircut & Styling", category: "hair", price: 350, durationMinutes: 30, description: "Precision haircut, wash, scalp massage, and styling" },
  { name: "Women's Signature Layer Haircut", category: "hair", price: 750, durationMinutes: 45, description: "Custom haircut with blow dry and setting" },
  { name: "Global Hair Coloring & Highlight", category: "hair", price: 2500, durationMinutes: 90, description: "Ammonia-free global hair color with gloss shine treatment" },
  { name: "Keratin Smoothing Therapy", category: "hair", price: 3800, durationMinutes: 120, description: "Intense frizz control, shine, and hair smoothing treatment" },
  { name: "Hydra-Glow Facial Therapy", category: "skin", price: 1800, durationMinutes: 60, description: "Deep cleansing, pore extraction, and hydration mask" },
  { name: "Gold Radiance Bridal Facial", category: "skin", price: 2800, durationMinutes: 75, description: "Premium 24k gold infused anti-aging facial for instant glow" },
  { name: "Deluxe Gel Manicure & Pedicure", category: "nails", price: 1200, durationMinutes: 60, description: "Nail shaping, cuticle care, scrub, massage & gel polish" },
  { name: "Aroma Therapy Full Body Massage", category: "spa", price: 2200, durationMinutes: 60, description: "Essential oil deep tissue body massage for stress relief" },
  { name: "HD Party Makeup Package", category: "makeup", price: 3500, durationMinutes: 90, description: "Long-lasting HD makeup, false lashes, and hair updo" },
  { name: "Ultimate Pamper Combo Package", category: "combo", price: 4500, durationMinutes: 150, description: "Haircut, Hair Spa, Facial, Manicure, Pedicure & Head Massage", packageOfferTag: "Best Value Offer — 30% OFF" },
];

const FIRST_NAMES = [
  "Aarav", "Ananya", "Rohan", "Priya", "Rahul", "Neha", "Vikram", "Sneha", "Amit", "Kavya",
  "Dev", "Pooja", "Siddharth", "Meera", "Karan", "Simran", "Rajesh", "Smruti", "Aditya", "Ritu",
  "Gaurav", "Divya", "Suresh", "Preeti", "Manish", "Shweta", "Tarun", "Nisha", "Alok", "Tanvi"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Rout", "Patnaik", "Singh", "Nair", "Reddy", "Joshi", "Das",
  "Rana", "Bansal", "Khan", "Gupta", "Deshmukh", "Chowdhury", "Rao", "Kulkarni", "Mohanty", "Mishra"
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedFullData() {
  console.log("🚀 Starting Full 50-Salon Database Seeding Process...");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // Track created slots to prevent compound unique index violations
    const createdSlotKeys = new Set();

    // 1. Ensure Roles exist
    let ownerRole = await Role.findOne({ name: "owner" });
    if (!ownerRole) ownerRole = await Role.create({ name: "owner", description: "Salon Owner" });

    let managerRole = await Role.findOne({ name: "manager" });
    if (!managerRole) managerRole = await Role.create({ name: "manager", description: "Branch Manager" });

    let staffRole = await Role.findOne({ name: "staff" });
    if (!staffRole) staffRole = await Role.create({ name: "staff", description: "Salon Staff Member" });

    let customerRole = await Role.findOne({ name: "customer" });
    if (!customerRole) customerRole = await Role.create({ name: "customer", description: "Customer Account" });

    console.log("✅ Roles Verified (Owner, Manager, Staff, Customer)");

    // 2. Create 35 Customers with isEmailVerified: true
    console.log("🌱 Seeding Customers with isEmailVerified = true...");
    const createdCustomers = [];
    for (let i = 1; i <= 35; i++) {
      const fn = getRandomItem(FIRST_NAMES);
      const ln = getRandomItem(LAST_NAMES);
      const email = `customer${i}@example.com`;

      let customerUser = await User.findOne({ email });
      if (!customerUser) {
        customerUser = await User.create({
          name: `${fn} ${ln}`,
          email,
          phone: getUniquePhone(),
          password: "Password@123",
          role: customerRole._id,
          isEmailVerified: true,
          gender: i % 2 === 0 ? "female" : "male",
        });
      } else {
        customerUser.isEmailVerified = true;
        await customerUser.save();
      }
      createdCustomers.push(customerUser);
    }
    console.log(`✅ ${createdCustomers.length} Customers ready (with email verified = true)`);

    // 3. Seed 50 Salons, Branches, Managers, Staffs, Services & Appointments
    console.log("🌱 Seeding 50 Salons, Branches, Managers, Staff, Services & Revenue Data...");

    let totalSalonsCreated = 0;
    let totalBranchesCreated = 0;
    let totalStaffCreated = 0;
    let totalServicesCreated = 0;
    let totalAppointmentsCreated = 0;

    const openingHoursDefault = [
      { day: "Mon", open: "09:00", close: "21:00", isOpen: true },
      { day: "Tue", open: "09:00", close: "21:00", isOpen: true },
      { day: "Wed", open: "09:00", close: "21:00", isOpen: true },
      { day: "Thu", open: "09:00", close: "21:00", isOpen: true },
      { day: "Fri", open: "09:00", close: "21:00", isOpen: true },
      { day: "Sat", open: "09:00", close: "21:00", isOpen: true },
      { day: "Sun", open: "10:00", close: "20:00", isOpen: true },
    ];

    for (let idx = 0; idx < SALON_DATA.length; idx++) {
      const sInfo = SALON_DATA[idx];
      const ownerIndex = idx + 1;
      const ownerEmail = `owner${ownerIndex}@salon.com`;

      // Create or find Owner User
      let ownerUser = await User.findOne({ email: ownerEmail });
      if (!ownerUser) {
        ownerUser = await User.create({
          name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
          email: ownerEmail,
          phone: getUniquePhone(),
          password: "Password@123",
          role: ownerRole._id,
          isEmailVerified: true,
        });
      } else {
        ownerUser.isEmailVerified = true;
        await ownerUser.save();
      }

      // Create Salon
      let salonDoc = await Salon.findOne({ owner: ownerUser._id });
      if (!salonDoc) {
        salonDoc = await Salon.create({
          name: sInfo.name,
          owner: ownerUser._id,
          description: `Premier salon offering luxury hair styling, spa, and beauty services in ${sInfo.city}.`,
          contactEmail: ownerEmail,
          contactPhone: ownerUser.phone,
          isActive: true,
        });
      }

      // Update owner's salonId
      ownerUser.salonId = salonDoc._id;
      await ownerUser.save();
      totalSalonsCreated++;

      // Create 1 or 2 Branches per salon
      const branchCount = idx % 3 === 0 ? 2 : 1;
      for (let bIdx = 1; bIdx <= branchCount; bIdx++) {
        const branchName = bIdx === 1 ? `${sInfo.name} — ${sInfo.area}` : `${sInfo.name} — Main Branch`;
        const branchEmail = `branch${ownerIndex}.${bIdx}@salon.com`;

        // Create Manager User for Branch
        const mgrEmail = `mgr.s${ownerIndex}.b${bIdx}@salon.com`;
        let managerUser = await User.findOne({ email: mgrEmail });
        if (!managerUser) {
          managerUser = await User.create({
            name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
            email: mgrEmail,
            phone: getUniquePhone(),
            password: "Password@123",
            role: managerRole._id,
            salonId: salonDoc._id,
            isEmailVerified: true,
          });
        }

        // Create Branch Document
        let branchDoc = await Branch.findOne({ salonId: salonDoc._id, name: branchName });
        if (!branchDoc) {
          branchDoc = await Branch.create({
            salonId: salonDoc._id,
            name: branchName,
            address: {
              street: `${getRandomNumber(10, 299)}, ${sInfo.area}`,
              city: sInfo.city,
              state: sInfo.state,
              pincode: `${getRandomNumber(751001, 751099)}`,
              country: "India",
              coordinates: { lat: 20.2961 + idx * 0.01, lng: 85.8245 + idx * 0.01 },
            },
            contactPhone: managerUser.phone,
            contactEmail: branchEmail,
            managerId: managerUser._id,
            openingHours: openingHoursDefault,
            isActive: true,
          });
        }

        // Set manager's branchId
        managerUser.branchId = branchDoc._id;
        await managerUser.save();
        totalBranchesCreated++;

        // Create 2 to 3 Staff Users for this Branch
        const staffMembers = [];
        const staffCount = getRandomNumber(2, 3);
        for (let stIdx = 1; stIdx <= staffCount; stIdx++) {
          const staffEmail = `staff.s${ownerIndex}.b${bIdx}.${stIdx}@salon.com`;
          let staffUser = await User.findOne({ email: staffEmail });
          if (!staffUser) {
            staffUser = await User.create({
              name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
              email: staffEmail,
              phone: getUniquePhone(),
              password: "Password@123",
              role: staffRole._id,
              salonId: salonDoc._id,
              branchId: branchDoc._id,
              isEmailVerified: true,
            });
          }
          staffMembers.push(staffUser);
          totalStaffCreated++;
        }

        // Create Services for this Branch
        const branchServices = [];
        for (const sTpl of SERVICE_TEMPLATES) {
          let serviceDoc = await Service.findOne({ branchId: branchDoc._id, name: sTpl.name });
          if (!serviceDoc) {
            serviceDoc = await Service.create({
              salonId: salonDoc._id,
              branchId: branchDoc._id,
              name: sTpl.name,
              description: sTpl.description,
              category: sTpl.category,
              price: sTpl.price,
              durationMinutes: sTpl.durationMinutes,
              packageOfferTag: sTpl.packageOfferTag || null,
              isActive: true,
            });
          }
          branchServices.push(serviceDoc);
          totalServicesCreated++;
        }

        // Create Appointments & Slots safely
        const dateList = [
          "2026-09-14",
          "2026-09-13",
          "2026-09-12",
          "2026-09-10",
          "2026-09-05",
          "2026-08-28",
          "2026-08-15",
          "2026-07-20",
          "2026-07-04",
        ];

        for (let aIdx = 0; aIdx < getRandomNumber(3, 5); aIdx++) {
          const selectedCust = getRandomItem(createdCustomers);
          const selectedStaff = getRandomItem(staffMembers);
          const selectedSvc = getRandomItem(branchServices);
          const dateStr = getRandomItem(dateList);

          // Find available time slot for this staff and date
          let timeObj = null;
          for (const tSlot of TIME_SLOTS) {
            const key = `${selectedStaff._id}_${dateStr}_${tSlot.start}`;
            if (!createdSlotKeys.has(key)) {
              createdSlotKeys.add(key);
              timeObj = tSlot;
              break;
            }
          }

          if (!timeObj) continue; // Skip if all times filled for this staff date

          // Create a Slot document
          let slotDoc = await Slot.create({
            salonId: salonDoc._id,
            branchId: branchDoc._id,
            staffId: selectedStaff._id,
            date: dateStr,
            startTime: timeObj.start,
            endTime: timeObj.end,
            status: "BOOKED",
            price: selectedSvc.price,
          });

          // Create Completed Appointment
          await Appointment.create({
            customerId: selectedCust._id,
            branchId: branchDoc._id,
            salonId: salonDoc._id,
            staffId: selectedStaff._id,
            serviceId: selectedSvc._id,
            services: [selectedSvc._id],
            slotId: slotDoc._id,
            date: dateStr,
            startTime: timeObj.start,
            endTime: timeObj.end,
            status: "COMPLETED",
            pricePaid: selectedSvc.price,
            rating: {
              score: 5,
              review: "Excellent service and courteous staff!",
              ratedAt: new Date(dateStr),
            },
          });
          totalAppointmentsCreated++;
        }
      }
    }

    console.log(`✅ Seeded ${totalSalonsCreated} Salons`);
    console.log(`✅ Seeded ${totalBranchesCreated} Branches`);
    console.log(`✅ Seeded ${totalStaffCreated} Staff Members`);
    console.log(`✅ Seeded ${totalServicesCreated} Services`);
    console.log(`✅ Seeded ${totalAppointmentsCreated} Completed Revenue Appointments`);

    // 4. Seed Banners
    console.log("🌱 Seeding Promotional Banners for Customer App...");
    const bannerItems = [
      {
        title: "Exclusive 50% OFF Hair & Spa Deals",
        subtitle: "Top rated luxury salons near you",
        details: "Get flat 50% discount on first hair spa & haircut booking at premium salons across your city.",
        tag: "LIMITED OFFER",
        ctaText: "Book Now",
        imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
        promoCode: "GLAM50",
        discountPercentage: 50,
        targetType: "EXPLORE",
        city: "Brahmapur",
        isActive: true,
        displayOrder: 1,
      },
      {
        title: "Monsoon Glow Skin & Facial Care",
        subtitle: "Hydra facial & organic glow treatments",
        details: "Rejuvenate your skin with expert hydra-facial & anti-tanning packages.",
        tag: "SKINCARE SPECIAL",
        ctaText: "Explore Packages",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
        promoCode: "GLOW30",
        discountPercentage: 30,
        targetType: "CATEGORY",
        category: "skin",
        city: "Bhubaneswar",
        isActive: true,
        displayOrder: 2,
      },
      {
        title: "Royal Cut Luxury Combo Pack",
        subtitle: "Haircut + Facial + Spa Combo",
        details: "Special all-in-one grooming combo at Royal Cut Luxury Salon & Spa.",
        tag: "HOT DEAL",
        ctaText: "Claim Discount",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
        promoCode: "ROYAL25",
        discountPercentage: 25,
        targetType: "DISCOUNT",
        isActive: true,
        displayOrder: 3,
      },
    ];

    for (const bData of bannerItems) {
      await Banner.findOneAndUpdate({ title: bData.title }, bData, { upsert: true, new: true });
    }
    console.log("✅ Promotional Banners Seeded");

    console.log("\n🎉 FULL 50-SALON DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
}

seedFullData();
