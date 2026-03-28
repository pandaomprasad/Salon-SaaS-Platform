const cron = require("node-cron");
const { generateSlotsForAllBranches } = require("../utils/autoSlotGenerator");
const logger = require("../utils/logger");

// ================================
// initCronJobs
// ================================
// call this once at server startup
// registers all scheduled background jobs

const initCronJobs = () => {
  // --------------------------------
  // Slot generation — runs every night at midnight
  // cron format: second minute hour day month weekday
  // "0 0 * * *" = at 00:00 every day
  // --------------------------------
  cron.schedule("0 0 * * *", async () => {
    logger.info("Cron triggered: nightly slot generation");
    await generateSlotsForAllBranches();
  });

  // --------------------------------
  // Slot cleanup — runs every night at 1AM
  // marks past AVAILABLE slots as COMPLETED
  // keeps the DB clean
  // --------------------------------
  cron.schedule("0 1 * * *", async () => {
    logger.info("Cron triggered: past slot cleanup");
    await cleanupPastSlots();
  });

  logger.info("Cron jobs initialized");
};

// ================================
// cleanupPastSlots
// ================================
// marks slots from yesterday and before
// that are still AVAILABLE as COMPLETED
// prevents customers from seeing old slots

const cleanupPastSlots = async () => {
  try {
    const Slot = require("../models/slot.model");
    const dayjs = require("dayjs");

    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    const result = await Slot.updateMany(
      {
        date: { $lte: yesterday },
        status: "AVAILABLE",
      },
      { status: "COMPLETED" },
    );

    logger.info(
      `Slot cleanup complete — ${result.modifiedCount} slots marked as COMPLETED`,
    );
  } catch (error) {
    logger.error(`Slot cleanup failed: ${error.message}`);
  }
};

module.exports = { initCronJobs };
