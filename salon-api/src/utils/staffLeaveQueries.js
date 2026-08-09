const StaffLeave = require("../models/staffLeave.model")

// ================================
// getActiveStaffLeaves
// ================================
// fetch all leaves that ACTUALLY make the staff unavailable:
// ACTIVE + APPROVED. PENDING requests and REJECTED leaves must not
// skip slot generation, block slots, or hard-block bookings.
// Used by:
//   - auto slot generator (nightly cron)
//   - manual slot generator (slot.controller)
//   - booking/reschedule controllers (hard leave validation)
//
// NOTE: runs inside the cron (no tenant context) AND inside requests —
// the tenant plugin auto-injects salonId when called in a request,
// which is the correct behavior (a manager only sees their own salon).

const getActiveStaffLeaves = async ({ staffId, startDate, endDate }) => {
  // build an OR filter that matches any leave overlapping the requested span
  const rangeFilter = { isActive: true, status: "APPROVED", staffId }

  // date-oriented overlap: leave.date / leave.startDate / leave.endDate
  const or = []

  // SINGLE leaves: date between startDate and endDate
  if (startDate && endDate) {
    or.push({ type: "SINGLE", date: { $gte: startDate, $lte: endDate } })
  } else if (startDate) {
    or.push({ type: "SINGLE", date: { $gte: startDate } })
  } else if (endDate) {
    or.push({ type: "SINGLE", date: { $lte: endDate } })
  }

  // RANGE / RECURRING leaves: range overlaps the query span
  if (startDate && endDate) {
    or.push({
      type: { $in: ["RANGE", "RECURRING"] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        { startDate: { $lte: endDate }, endDate: null },
        { startDate: null, endDate: { $gte: startDate } },
      ],
    })
  } else if (startDate) {
    or.push({
      type: { $in: ["RANGE", "RECURRING"] },
      $or: [
        { endDate: { $gte: startDate } },
        { endDate: null },
      ],
    })
  } else if (endDate) {
    or.push({
      type: { $in: ["RANGE", "RECURRING"] },
      $or: [
        { startDate: { $lte: endDate } },
        { startDate: null },
      ],
    })
  }

  const query = { ...rangeFilter, $or: or }

  return StaffLeave.find(query).lean()
}

module.exports = { getActiveStaffLeaves }