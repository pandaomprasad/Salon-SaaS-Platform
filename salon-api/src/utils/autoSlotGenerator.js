const Branch = require("../models/branch.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const Slot = require("../models/slot.model");
const { generateDaySlots } = require("./slotGenerator");
const { getActiveStaffLeaves } = require("./staffLeaveQueries");
const logger = require("./logger");
const dayjs = require("dayjs");

// ================================
// generateSlotsForAllBranches
// ================================
// generates slots for the next 30 days
// for ALL active staff in ALL active branches
// runs automatically every night at midnight
//
// flow:
//   1. find all active branches
//   2. for each branch → find all active staff
//   3. for each staff → generate slots for next 30 days
//   4. insert only new slots (skip duplicates)

const generateSlotsForAllBranches = async () => {
  logger.info("Auto slot generation started...");

  try {
    // get all active branches
    const branches = await Branch.find({ isActive: true }).lean();
    logger.info(`Found ${branches.length} active branches`);

    // get staff role id
    const staffRole = await Role.findOne({ name: "staff" }).lean();
    if (!staffRole) {
      logger.error("Staff role not found — skipping slot generation");
      return;
    }

    let totalInserted = 0;
    let totalSkipped = 0;

    // chunk branches so we don't open unbounded connections —
    // process CONCURRENCY branches (and all their staff) in parallel
    const CONCURRENCY = 5;
    for (let i = 0; i < branches.length; i += CONCURRENCY) {
      const chunk = branches.slice(i, i + CONCURRENCY);

      const results = await Promise.all(
        chunk.map(async (branch) => {
          const inserted = await generateForBranch(branch, staffRole);
          totalInserted += inserted.inserted;
          totalSkipped += inserted.skipped;
        }),
      );
    }

    logger.info(
      `Auto slot generation complete — inserted: ${totalInserted}, skipped: ${totalSkipped}`,
    );
  } catch (error) {
    logger.error(`Auto slot generation failed: ${error.message}`);
  }
};

// ================================
// generateForBranch
// ================================
// generates slots for the next 30 days for EVERY active staff
// member of a single branch. Returns { inserted, skipped }.
const generateForBranch = async (branch, staffRole) => {
  let inserted = 0;
  let skipped = 0;

  // find all active staff in this branch
  const staffMembers = await User.find({
    branchId: branch._id,
    role: staffRole._id,
    isActive: true,
  }).lean();

  if (staffMembers.length === 0) {
    logger.info(`Branch ${branch.name} has no active staff — skipping`);
    return { inserted, skipped };
  }

  // generate for next 30 days starting tomorrow
  const startDate = dayjs().add(1, "day");
  const endDate = dayjs().add(30, "day");

  // loop through each staff member
  for (const staff of staffMembers) {
    const slotsToInsert = [];
    let current = startDate;

    // fetch all active leaves overlapping the next 30 days ONCE
    // so we don't hit the DB per-day
    const staffLeaves = await getActiveStaffLeaves({
      staffId: staff._id,
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
    });

    while (current.isBefore(endDate.add(1, "day"))) {
      const date = current.format("YYYY-MM-DD");
      const daySlots = generateDaySlots(branch, date, staffLeaves);

      daySlots.forEach((slot) => {
        slotsToInsert.push({
          branchId: branch._id,
          salonId: branch.salonId,
          staffId: staff._id,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "AVAILABLE",
        });
      });

      current = current.add(1, "day");
    }

    if (slotsToInsert.length === 0) continue;

    // insert — skip duplicates silently
    try {
      const result = await Slot.insertMany(slotsToInsert, { ordered: false });
      inserted += result.length;
    } catch (err) {
      // some slots already exist — that's fine
      inserted += err.insertedDocs?.length || 0;
      skipped += err.writeErrors?.length || 0;
    }
  }

  return { inserted, skipped };
};

module.exports = { generateSlotsForAllBranches };
