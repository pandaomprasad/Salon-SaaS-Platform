const dayjs = require('dayjs')
// NOTE: this runs as a cron job — no tenant context
// mongoose plugin auto-skips injection when no context is set
// so queries here return ALL branches as expected
const Branch = require('../models/branch.model')
const {
  isStaffFullyUnavailable,
  getEffectiveTimeWindow,
  slotOverlapsLeave,
} = require('./staffLeaveHelper')
// ================================
// generateDaySlots
// ================================
// given a branch and a date, generates all possible time slots
// based on working hours and slot duration
//
// example:
//   branch opens 09:00, closes 21:00, slotDuration 60min
//   generates: 09:00-10:00, 10:00-11:00 ... 20:00-21:00
//
// OPTIONAL staffLeaves: array of active StaffLeave docs for this staff.
// When provided, slots that fall inside a leave are NOT generated:
//   - allDay leave  → no slots at all that day
//   - time-window leave → slots overlapping the window are skipped,
//     and the surrounding usable window is clamped
//
// returns array of { startTime, endTime } objects

const generateDaySlots = (branch, date, staffLeaves = []) => {
  // get day of week for the given date (0=Sunday, 6=Saturday)
  const dayOfWeek = dayjs(date).day()

  // find working hours for this day
  const workingDay = branch.workingHours.find((w) => w.day === dayOfWeek)

  // branch is closed on this day
  if (!workingDay || !workingDay.isOpen) {
    return []
  }

  const { openTime, closeTime } = workingDay
  const duration = branch.slotDurationMinutes || 60

  // ================================
  // Staff leave handling
  // ================================
  // skip slot generation entirely if staff is off all day
  if (staffLeaves.length > 0) {
    if (isStaffFullyUnavailable(staffLeaves, date)) {
      return []
    }

    // clamp the working window around time-window leaves
    const effWindow = getEffectiveTimeWindow(
      staffLeaves,
      date,
      openTime,
      closeTime,
    )
    if (!effWindow) return []

    const slots = generateRange(
      date,
      effWindow.openTime,
      effWindow.closeTime,
      duration,
      staffLeaves,
    )
    return slots
  }

  return generateRange(date, openTime, closeTime, duration, staffLeaves)
}

// ================================
// generateRange — generate slots between openTime and closeTime
// ================================
const generateRange = (date, openTime, closeTime, duration, staffLeaves) => {
  const slots = []

  // parse open and close times
  // dayjs needs a full date+time string to work with time
  let current = dayjs(`${date} ${openTime}`)
  const closing = dayjs(`${date} ${closeTime}`)

  // keep generating slots until we reach closing time
  while (current.isBefore(closing)) {
    const next = current.add(duration, 'minute')

    // don't create a slot that goes past closing time
    if (next.isAfter(closing)) break

    const startTime = current.format('HH:mm')
    const endTime = next.format('HH:mm')

    // safety net — never generate a slot that overlaps a leave window
    if (staffLeaves.length > 0) {
      if (slotOverlapsLeave(startTime, endTime, staffLeaves, date)) {
        current = next
        continue
      }
    }

    slots.push({ startTime, endTime })

    current = next
  }

  return slots
}

module.exports = { generateDaySlots }