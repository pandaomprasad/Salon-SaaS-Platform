// seed-bhubaneswar.js
require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");
const Salon = require("./src/models/salon.model");
const Branch = require("./src/models/branch.model");
const Service = require("./src/models/service.model");
const Slot = require("./src/models/slot.model");
const { delCachePattern } = require("./src/services/cache.service");

async function seedBhubaneswar() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Ensure roles exist
    const roleNames = ["superadmin", "owner", "manager", "staff", "customer"];
    const roles = {};
    for (const rName of roleNames) {
      let roleDoc = await Role.findOne({ name: rName });
      if (!roleDoc) {
        roleDoc = await Role.create({
          name: rName,
          description: `${rName} role`,
          permissions: [],
        });
      }
      roles[rName] = roleDoc;
    }

    console.log("Seeding Premium Salons with Owners, Managers, Staff & Services for Bhubaneswar...");

    const bhubaneswarSalonsData = [
      {
        name: "Luxe Studio Bhubaneswar",
        description: "Premier luxury hair styling, facial spa & grooming sanctuary in Patia, Bhubaneswar.",
        ownerName: "Amitabh Rout",
        ownerEmail: "luxe.bhubaneswar@stcut.com",
        ownerPhone: "9778011111",
        ownerGender: "male",
        managerName: "Rakesh Sahoo",
        managerEmail: "manager.luxe.bbsr@stcut.com",
        managerPhone: "9778011113",
        branchName: "Luxe Studio - Patia Branch",
        contactPhone: "9778011112",
        city: "Bhubaneswar",
        citySlug: "bhubaneswar",
        street: "Plot No. 1204, KIIT Square, Patia",
        pincode: "751024",
        coordinates: [85.8166, 20.3544], // [lng, lat]
        rating: 4.9,
        reviewsCount: 128,
        logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80",
        services: [
          { name: "Executive Haircut & Beard Styling", category: "hair", price: 499, durationMinutes: 45, description: "Precision haircut, scalp massage & beard line-up." },
          { name: "Organic Charcoal Facial", category: "skin", price: 1299, durationMinutes: 60, description: "Deep detoxifying facial with organic charcoal & steam." },
          { name: "Keratin Smooth Treatment", category: "hair", price: 2999, durationMinutes: 120, description: "Intensive keratin smoothing treatment for silky frizz-free hair." },
          { name: "Royal Pedicure & Spa", category: "spa", price: 899, durationMinutes: 45, description: "Exfoliating foot scrub, massage & nail care." },
        ],
      },
      {
        name: "Urban Cut Premium Unisex Salon",
        description: "Modern trendsetting unisex hair & beauty lounge in the heart of Saheed Nagar.",
        ownerName: "Priyanka Mishra",
        ownerEmail: "urbancut.bbsr@stcut.com",
        ownerPhone: "9778022222",
        ownerGender: "female",
        managerName: "Ankit Tripathy",
        managerEmail: "manager.urbancut.bbsr@stcut.com",
        managerPhone: "9778022224",
        branchName: "Urban Cut - Saheed Nagar",
        contactPhone: "9778022223",
        city: "Bhubaneswar",
        citySlug: "bhubaneswar",
        street: "B-24, Janpath Rd, Saheed Nagar",
        pincode: "751007",
        coordinates: [85.8422, 20.2889],
        rating: 4.8,
        reviewsCount: 94,
        logo: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500&auto=format&fit=crop&q=80",
        services: [
          { name: "Urban Signature Cut", category: "hair", price: 399, durationMinutes: 40, description: "Modern fade or classic haircut styled with premium pomade." },
          { name: "Gold Radiance Glow Facial", category: "skin", price: 1499, durationMinutes: 60, description: "24k gold foil facial treatment for instant skin glow." },
          { name: "Deep Conditioning Hair Spa", category: "hair", price: 799, durationMinutes: 50, description: "Nourishing Moroccan oil hair spa with steam treatment." },
        ],
      },
      {
        name: "Elegance Spa & Beauty Sanctuary",
        description: "Relaxing wellness, aromatic massage & bridal pampering suite near Jaydev Vihar.",
        ownerName: "Soumya Ranjan Das",
        ownerEmail: "elegance.bbsr@stcut.com",
        ownerPhone: "9778033333",
        ownerGender: "male",
        managerName: "Smruti Samantaray",
        managerEmail: "manager.elegance.bbsr@stcut.com",
        managerPhone: "9778033335",
        branchName: "Elegance Spa - Jaydev Vihar",
        contactPhone: "9778033334",
        city: "Bhubaneswar",
        citySlug: "bhubaneswar",
        street: "Opp. Mayfair Lagoon, Jaydev Vihar",
        pincode: "751013",
        coordinates: [85.8236, 20.3012],
        rating: 4.95,
        reviewsCount: 210,
        logo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80",
        services: [
          { name: "Aromatherapy Full Body Massage", category: "spa", price: 1999, durationMinutes: 75, description: "Stress-relieving massage with essential lavender oils." },
          { name: "Hydra-Facial Therapy", category: "skin", price: 2499, durationMinutes: 60, description: "Advanced medical-grade hydra dermabrasion for pore detox." },
          { name: "Luxury Manicure & Gel Polish", category: "nails", price: 699, durationMinutes: 45, description: "Nail shaping, cuticle care & long-lasting gel coating." },
        ],
      },
      {
        name: "Golden Scissors Styling Studio",
        description: "Affordable premium grooming for men & women near Khandagiri Square.",
        ownerName: "Deepak Mohanty",
        ownerEmail: "goldenscissors.bbsr@stcut.com",
        ownerPhone: "9778044444",
        ownerGender: "male",
        managerName: "Chandan Swain",
        managerEmail: "manager.goldenscissors.bbsr@stcut.com",
        managerPhone: "9778044446",
        branchName: "Golden Scissors - Khandagiri",
        contactPhone: "9778044445",
        city: "Bhubaneswar",
        citySlug: "bhubaneswar",
        street: "NH-16 Service Rd, Khandagiri Sq",
        pincode: "751030",
        coordinates: [85.7865, 20.2588],
        rating: 4.7,
        reviewsCount: 76,
        logo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80",
        services: [
          { name: "Classic Men Cut & Beard Shave", category: "hair", price: 299, durationMinutes: 35, description: "Clean cut with hot towel beard shave." },
          { name: "O3+ Whitening Facial", category: "skin", price: 999, durationMinutes: 50, description: "Professional skin brightening treatment." },
        ],
      },
    ];

    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    let idx = 1;
    for (const item of bhubaneswarSalonsData) {
      // 1. Owner User
      let ownerUser = await User.findOne({ email: item.ownerEmail });
      if (!ownerUser) {
        ownerUser = await User.create({
          name: item.ownerName,
          email: item.ownerEmail,
          password: "OwnerPassword123!",
          role: roles.owner._id,
          phone: item.ownerPhone,
          gender: item.ownerGender || "male",
          isEmailVerified: true,
          isActive: true,
        });
      }

      // 2. Salon
      let salon = await Salon.findOne({ name: item.name });
      if (!salon) {
        salon = await Salon.create({
          name: item.name,
          owner: ownerUser._id,
          description: item.description,
          contactEmail: item.ownerEmail,
          contactPhone: item.ownerPhone,
          logo: item.logo,
          isActive: true,
        });
        ownerUser.salonId = salon._id;
        await ownerUser.save();
      } else {
        salon.isActive = true;
        salon.logo = item.logo;
        await salon.save();
      }

      // 3. Branch
      let branch = await Branch.findOne({ salonId: salon._id, citySlug: item.citySlug });
      if (!branch) {
        branch = await Branch.create({
          salonId: salon._id,
          name: item.branchName,
          contactPhone: item.contactPhone,
          address: {
            street: item.street,
            city: item.city,
            state: "Odisha",
            pincode: item.pincode,
          },
          citySlug: item.citySlug,
          location: {
            type: "Point",
            coordinates: item.coordinates,
          },
          rating: item.rating,
          reviewsCount: item.reviewsCount,
          isActive: true,
        });
      } else {
        branch.rating = item.rating;
        branch.reviewsCount = item.reviewsCount;
        branch.isActive = true;
        await branch.save();
      }

      // 4. Branch Manager User
      let managerUser = await User.findOne({ email: item.managerEmail });
      if (!managerUser) {
        managerUser = await User.create({
          name: item.managerName,
          email: item.managerEmail,
          password: "ManagerPassword123!",
          role: roles.manager._id,
          phone: item.managerPhone,
          gender: "male",
          salonId: salon._id,
          branchId: branch._id,
          isEmailVerified: true,
          isActive: true,
        });
      }

      // 5. Staff Member User
      const staffEmail = `staff.bbsr.${idx}@stcut.com`;
      let staffUser = await User.findOne({ email: staffEmail });
      if (!staffUser) {
        staffUser = await User.create({
          name: `Master Stylist ${idx}`,
          email: staffEmail,
          password: "StaffPassword123!",
          role: roles.staff._id,
          phone: `977899000${idx}`,
          gender: "male",
          salonId: salon._id,
          branchId: branch._id,
          isEmailVerified: true,
          isActive: true,
        });
      }

      // 6. Services
      const seededServices = [];
      for (const s of item.services) {
        let service = await Service.findOne({ branchId: branch._id, name: s.name });
        if (!service) {
          service = await Service.create({
            salonId: salon._id,
            branchId: branch._id,
            name: s.name,
            category: s.category,
            price: s.price,
            durationMinutes: s.durationMinutes,
            description: s.description,
            isAvailable: true,
          });
        }
        seededServices.push(service);
      }

      // 7. Slots (Today & Tomorrow)
      const timeslots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30", "20:00"];
      for (const dateStr of [todayStr, tomorrowStr]) {
        for (const time of timeslots) {
          const existingSlot = await Slot.findOne({ branchId: branch._id, date: dateStr, startTime: time });
          if (!existingSlot) {
            const [h, m] = time.split(":").map(Number);
            const endMin = h * 60 + m + 45;
            const endH = String(Math.floor(endMin / 60)).padStart(2, "0");
            const endM = String(endMin % 60).padStart(2, "0");

            await Slot.create({
              salonId: salon._id,
              branchId: branch._id,
              serviceId: seededServices[0]._id,
              staffId: staffUser._id,
              date: dateStr,
              startTime: time,
              endTime: `${endH}:${endM}`,
              status: "AVAILABLE",
              price: seededServices[0].price,
            });
          }
        }
      }

      console.log(`  ✅ Seeded: ${item.name}`);
      console.log(`     ├── Owner: ${ownerUser.email}`);
      console.log(`     ├── Manager: ${managerUser.email}`);
      console.log(`     ├── Staff: ${staffUser.email}`);
      console.log(`     └── Services: ${seededServices.length} services seeded`);
      idx++;
    }

    // Clear Redis Cache so new salons show up immediately
    await delCachePattern("salons:*");
    await delCachePattern("browse:*");
    await delCachePattern("initial_load:*");
    console.log("\n⚡ Cleared Redis caches (salons:*, browse:*, initial_load:*)");

    console.log("\n🎉 Successfully seeded Bhubaneswar Salons, Owners, Managers, Staff, Services & Slots!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Bhubaneswar failed:", err);
    process.exit(1);
  }
}

seedBhubaneswar();
