// seed-brahmapur.js
require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./src/models/user.model");
const Role = require("./src/models/role.model");
const Salon = require("./src/models/salon.model");
const Branch = require("./src/models/branch.model");
const Service = require("./src/models/service.model");
const Slot = require("./src/models/slot.model");
const Appointment = require("./src/models/appointment.model");
const OwnerRegistrationRequest = require("./src/models/ownerRegistrationRequest.model");

async function seedBrahmapur() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    console.log("Clearing existing data (Users, Salons, Branches, Services, Slots, Appointments)...");
    await Promise.all([
      User.deleteMany({}),
      Salon.deleteMany({}),
      Branch.deleteMany({}),
      Service.deleteMany({}),
      Slot.deleteMany({}),
      Appointment.deleteMany({}),
      OwnerRegistrationRequest.deleteMany({}),
    ]);
    console.log("Database cleared successfully.");

    // ── Ensure Roles Exist ──────────────────────────────────────
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

    // ── 1. Seed Superadmin ──────────────────────────────────────
    const adminEmail = "admin@stcut.com";
    const adminPassword = "AdminPassword123!";
    const adminUser = await User.create({
      name: "ST CUT SuperAdmin",
      email: adminEmail,
      password: adminPassword,
      role: roles.superadmin._id,
      phone: "9900112233",
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`✅ Superadmin created: ${adminEmail}`);

    // ── 2. Seed Salon 1: Royal Cut Luxury Salon & Spa ───────────
    const owner1Email = "royal.owner@stcut.com";
    const owner1Password = "OwnerPassword123!";
    const owner1User = await User.create({
      name: "Rajesh Patnaik",
      email: owner1Email,
      password: owner1Password,
      role: roles.owner._id,
      phone: "9861011111",
      isEmailVerified: true,
      isActive: true,
    });

    const salon1 = await Salon.create({
      name: "Royal Cut Luxury Salon & Spa",
      owner: owner1User._id,
      description: "Premier luxury styling, hair treatment & wellness sanctuary in Brahmapur.",
      contactEmail: owner1Email,
      contactPhone: "9861011111",
      isActive: true,
    });

    owner1User.salonId = salon1._id;
    await owner1User.save();

    const manager1Email = "royal.manager@stcut.com";
    const manager1Password = "ManagerPassword123!";
    const manager1User = await User.create({
      name: "Sunil Behera",
      email: manager1Email,
      password: manager1Password,
      role: roles.manager._id,
      phone: "9861022222",
      salonId: salon1._id,
      isEmailVerified: true,
      isActive: true,
    });

    const branch1 = await Branch.create({
      salonId: salon1._id,
      name: "Royal Cut — Silk City Road, Brahmapur",
      contactPhone: "06802221111",
      contactEmail: "royal.branch@stcut.com",
      address: {
        street: "Silk City Road, Near Old Bus Stand",
        city: "Brahmapur",
        state: "Odisha",
        pincode: "760001",
        country: "India",
        coordinates: { lat: 19.3150, lng: 84.7941 },
      },
      managerId: manager1User._id,
      isActive: true,
    });

    manager1User.branchId = branch1._id;
    await manager1User.save();

    const staff1_1 = await User.create({
      name: "Amit Das",
      email: "royal.stylist1@stcut.com",
      password: "StaffPassword123!",
      role: roles.staff._id,
      phone: "9861033333",
      salonId: salon1._id,
      branchId: branch1._id,
      isEmailVerified: true,
      isActive: true,
    });

    const staff1_2 = await User.create({
      name: "Priya Mishra",
      email: "royal.stylist2@stcut.com",
      password: "StaffPassword123!",
      role: roles.staff._id,
      phone: "9861044444",
      salonId: salon1._id,
      branchId: branch1._id,
      isEmailVerified: true,
      isActive: true,
    });

    // Services for Salon 1
    const svc1_1 = await Service.create({
      branchId: branch1._id,
      salonId: salon1._id,
      name: "Signature Haircut & Styling",
      description: "Custom precision cut, hot towel finish, and premium hair styling.",
      category: "hair",
      price: 50000, // ₹500
      durationMinutes: 45,
      eligibleStaff: [staff1_1._id, staff1_2._id],
      isActive: true,
    });

    const svc1_2 = await Service.create({
      branchId: branch1._id,
      salonId: salon1._id,
      name: "Royal Keratin Glow Treatment",
      description: "Deep restorative keratin therapy for silky smooth hair.",
      category: "hair",
      price: 180000, // ₹1800
      durationMinutes: 90,
      eligibleStaff: [staff1_1._id],
      isActive: true,
    });

    await Service.create({
      branchId: branch1._id,
      salonId: salon1._id,
      name: "Luxury Herbal Facial & Spa",
      description: "Organic botanical facial massage for radiant glowing skin.",
      category: "skin",
      price: 120000, // ₹1200
      durationMinutes: 60,
      eligibleStaff: [staff1_2._id],
      isActive: true,
    });

    console.log(`✅ Salon 1 created: "${salon1.name}" with Branch in Brahmapur.`);

    // ── 3. Seed Salon 2: Urban Edge Unisex Salon ───────────────
    const owner2Email = "urban.owner@stcut.com";
    const owner2Password = "OwnerPassword123!";
    const owner2User = await User.create({
      name: "Debashish Sahu",
      email: owner2Email,
      password: owner2Password,
      role: roles.owner._id,
      phone: "9861055555",
      isEmailVerified: true,
      isActive: true,
    });

    const salon2 = await Salon.create({
      name: "Urban Edge Unisex Salon",
      owner: owner2User._id,
      description: "Modern trendsetting salon for precision haircuts, hair coloring & grooming.",
      contactEmail: owner2Email,
      contactPhone: "9861055555",
      isActive: true,
    });

    owner2User.salonId = salon2._id;
    await owner2User.save();

    const manager2Email = "urban.manager@stcut.com";
    const manager2Password = "ManagerPassword123!";
    const manager2User = await User.create({
      name: "Manish Tripathi",
      email: manager2Email,
      password: manager2Password,
      role: roles.manager._id,
      phone: "9861066666",
      salonId: salon2._id,
      isEmailVerified: true,
      isActive: true,
    });

    const branch2 = await Branch.create({
      salonId: salon2._id,
      name: "Urban Edge — Engineering School Square, Brahmapur",
      contactPhone: "06802222222",
      contactEmail: "urban.branch@stcut.com",
      address: {
        street: "Engineering School Square, College Road",
        city: "Brahmapur",
        state: "Odisha",
        pincode: "760007",
        country: "India",
        coordinates: { lat: 19.3200, lng: 84.8000 },
      },
      managerId: manager2User._id,
      isActive: true,
    });

    manager2User.branchId = branch2._id;
    await manager2User.save();

    const staff2_1 = await User.create({
      name: "Kiran Mohanty",
      email: "urban.stylist1@stcut.com",
      password: "StaffPassword123!",
      role: roles.staff._id,
      phone: "9861077777",
      salonId: salon2._id,
      branchId: branch2._id,
      isEmailVerified: true,
      isActive: true,
    });

    const staff2_2 = await User.create({
      name: "Sneha Nayak",
      email: "urban.stylist2@stcut.com",
      password: "StaffPassword123!",
      role: roles.staff._id,
      phone: "9861088888",
      salonId: salon2._id,
      branchId: branch2._id,
      isEmailVerified: true,
      isActive: true,
    });

    // Services for Salon 2
    const svc2_1 = await Service.create({
      branchId: branch2._id,
      salonId: salon2._id,
      name: "Executive Haircut & Beard Grooming",
      description: "Sharp haircut, beard shaping, and refreshing scalp wash.",
      category: "hair",
      price: 40000, // ₹400
      durationMinutes: 30,
      eligibleStaff: [staff2_1._id, staff2_2._id],
      isActive: true,
    });

    await Service.create({
      branchId: branch2._id,
      salonId: salon2._id,
      name: "Balayage & Trendy Hair Coloring",
      description: "Custom dimensional hair color, highlights, and toner finish.",
      category: "hair",
      price: 250000, // ₹2500
      durationMinutes: 120,
      eligibleStaff: [staff2_2._id],
      isActive: true,
    });

    await Service.create({
      branchId: branch2._id,
      salonId: salon2._id,
      name: "Hydra Dermabrasion Facial",
      description: "Advanced deep cleansing hydro-facial for glowing youthful skin.",
      category: "skin",
      price: 150000, // ₹1500
      durationMinutes: 60,
      eligibleStaff: [staff2_1._id],
      isActive: true,
    });

    console.log(`✅ Salon 2 created: "${salon2.name}" with Branch in Brahmapur.`);

    // ── 4. Seed Booking Slots for Next 7 Days ──────────────────
    const staffPairs = [
      { branch: branch1, staff: [staff1_1, staff1_2] },
      { branch: branch2, staff: [staff2_1, staff2_2] },
    ];

    const slotTimes = [
      { start: "09:00", end: "10:00" },
      { start: "10:00", end: "11:00" },
      { start: "11:00", end: "12:00" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
      { start: "16:00", end: "17:00" },
      { start: "17:00", end: "18:00" },
      { start: "18:00", end: "19:00" },
    ];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split("T")[0];

      for (const pair of staffPairs) {
        for (const stf of pair.staff) {
          for (const t of slotTimes) {
            await Slot.create({
              salonId: pair.branch.salonId,
              branchId: pair.branch._id,
              staffId: stf._id,
              date: dateStr,
              startTime: t.start,
              endTime: t.end,
              status: "AVAILABLE",
            });
          }
        }
      }
    }
    console.log("✅ Booking slots generated for next 7 days across Brahmapur branches.");

    // ── 5. Seed Completed Rated Appointments for Reviews ───────
    const custUser1 = await User.create({
      name: "Rahul Patnaik",
      email: "rahul.patnaik@example.com",
      phone: "9861099991",
      role: roles.customer._id,
      isEmailVerified: true,
    });
    const custUser2 = await User.create({
      name: "Pooja Das",
      email: "pooja.das@example.com",
      phone: "9861099992",
      role: roles.customer._id,
      isEmailVerified: true,
    });
    const custUser3 = await User.create({
      name: "Smruti Rout",
      email: "smruti.rout@example.com",
      phone: "9861099993",
      role: roles.customer._id,
      isEmailVerified: true,
    });

    const slot1 = await Slot.create({
      salonId: salon1._id,
      branchId: branch1._id,
      staffId: staff1_1._id,
      date: "2026-08-20",
      startTime: "10:00",
      endTime: "11:00",
      status: "COMPLETED",
    });

    const slot2 = await Slot.create({
      salonId: salon1._id,
      branchId: branch1._id,
      staffId: staff1_2._id,
      date: "2026-08-21",
      startTime: "14:00",
      endTime: "15:00",
      status: "COMPLETED",
    });

    const slot3 = await Slot.create({
      salonId: salon2._id,
      branchId: branch2._id,
      staffId: staff2_1._id,
      date: "2026-08-21",
      startTime: "16:00",
      endTime: "17:00",
      status: "COMPLETED",
    });

    await Appointment.create([
      {
        salonId: salon1._id,
        branchId: branch1._id,
        customerId: custUser1._id,
        serviceId: svc1_1._id,
        staffId: staff1_1._id,
        slotId: slot1._id,
        date: "2026-08-20",
        startTime: "10:00",
        endTime: "11:00",
        status: "COMPLETED",
        totalAmount: 50000,
        pricePaid: 50000,
        rating: {
          score: 5,
          review: "Top-notch haircut at Royal Cut! Stylist Amit was very attentive to detail. Highly recommend!",
          ratedAt: new Date("2026-08-20T11:30:00.000Z"),
        },
      },
      {
        salonId: salon1._id,
        branchId: branch1._id,
        customerId: custUser2._id,
        serviceId: svc1_2._id,
        staffId: staff1_2._id,
        slotId: slot2._id,
        date: "2026-08-21",
        startTime: "14:00",
        endTime: "15:00",
        status: "COMPLETED",
        totalAmount: 80000,
        pricePaid: 80000,
        rating: {
          score: 5,
          review: "Loved the hair spa & keratine treatment! Clean ambiance and polite staff.",
          ratedAt: new Date("2026-08-21T15:30:00.000Z"),
        },
      },
      {
        salonId: salon2._id,
        branchId: branch2._id,
        customerId: custUser3._id,
        serviceId: svc2_1._id,
        staffId: staff2_1._id,
        slotId: slot3._id,
        date: "2026-08-21",
        startTime: "16:00",
        endTime: "17:00",
        status: "COMPLETED",
        totalAmount: 40000,
        pricePaid: 40000,
        rating: {
          score: 4,
          review: "Great styling & fast service without any waiting time at Urban Edge.",
          ratedAt: new Date("2026-08-21T17:30:00.000Z"),
        },
      },
    ]);
    console.log("✅ Sample customer ratings & reviews seeded successfully.");

    console.log("\n=======================================================");
    console.log("  ST CUT SEED COMPLETE — BRAHMAPUR LOCATION");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Brahmapur database:", err);
    process.exit(1);
  }
}

seedBrahmapur();
