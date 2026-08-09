const dayjs = require('dayjs')

// ================================
// staffLeaveHelper
// ================================
// Pure helpers that turn StaffLeave documents into
// "is this staff available at this time?" answers.
// Used by:
//   - slot generators (skip creating slots staff can't work)
//   - booking/reschedule (hard block if leave overlaps)
//   - leave controller (collision detection)

const DATE_FMT = 'YYYY-MM-DD'

// --------------------------------
// toDateRange — normalize a leave doc into { start, end } date range
// SINGLE → start = end = date
// RANGE / RECURRING → startDate .. endDate
// --------------------------------
const toDateRange = (leave) => {
  if (leave.type === 'SINGLE') {
    return { start: leave.date, end: leave.date }
  }
  return { start: leave.startDate, end: leave.endDate }
}

// --------------------------------
// coversDate — does this leave cover the given date at all?
// (recurring leaves only cover matching weekdays)
// --------------------------------
const coversDate = (leave, date) => {
  const { start, end } = toDateRange(leave)

  // date must be within the leave's range (strings compare lexically in YYYY-MM-DD)
  if (date < start || date > end) return false

  // recurring leaves only fire on their configured weekdays
  if (leave.type === 'RECURRING') {
    const weekday = dayjs(date).day()
    if (!leave.weekdays || !leave.weekdays.includes(weekday)) return false
  }

  return true
}

// --------------------------------
// getBlockedWindows — the time windows on a given date
// where this staff member cannot take appointments.
// Returns [{ start: "HH:MM"|null, end: "HH:MM"|null }]
// null start/end means the ENTIRE day is blocked.
// --------------------------------
const getBlockedWindows = (leave, date) => {
  if (!coversDate(leave, date)) return []

  // allDay leave — whole day is off
  if (leave.allDay || (!leave.startTime && !leave.endTime)) {
    return [{ start: null, end: null }]
  }

  // time-window leave — only the window is blocked
  return [
    {
      start: leave.startTime || '00:00',
      end: leave.endTime || '23:59',
    },
  ]
}

// --------------------------------
// slotOverlapsLeave — does a slot [slotStart, slotEnd]
// overlap any blocked window for the staff on that date?
// slotStart/slotEnd are "HH:MM" strings.
// --------------------------------
const slotOverlapsLeave = (slotStart, slotEnd, leaves, date) => {
  for (const leave of leaves) {
    const windows = getBlockedWindows(leave, date)
    for (const win of windows) {
      // whole-day block — any slot overlaps
      if (win.start === null && win.end === null) return true

      // window block — overlap if slot starts before window ends
      // AND window starts before slot ends (standard interval overlap).
      // Touching edges (slot ends exactly when leave starts) do NOT overlap.
      const wStart = win.start
      const wEnd = win.end

      if (slotStart < wEnd && wStart < slotEnd) return true
    }
  }
  return false
}

// --------------------------------
// isStaffAvailableOnDate — is the staff entirely off on this date?
// (no slot at all can be created)
// --------------------------------
const isStaffFullyUnavailable = (leaves, date) => {
  for (const leave of leaves) {
    const windows = getBlockedWindows(leave, date)
    if (windows.some((w) => w.start === null && w.end === null)) return true
  }
  return false
}

// --------------------------------
// getEffectiveTimeWindow — for time-window leaves, clamp a staff's
// working window. Returns { openTime, closeTime } with the narrowest
// constraints, or null if fully unavailable.
// Used by the slot generator to trim the day's slot list.
// --------------------------------
const getEffectiveTimeWindow = (leaves, date, branchOpen, branchClose) => {
  if (isStaffFullyUnavailable(leaves, date)) return null

  // Collect every blocked window, then merge the remaining usable windows.
  // A time-window leave removes [wStart, wEnd] from the day; we want to
  // find the largest contiguous workable window that is left.
  const blocked = []
  for (const leave of leaves) {
    const windows = getBlockedWindows(leave, date)
    for (const win of windows) {
      if (win.start === null && win.end === null) return null // full day off
      blocked.push({ start: strToMin(win.start), end: strToMin(win.end) })
    }
  }

  if (blocked.length === 0) return { openTime: branchOpen, closeTime: branchClose }

  // Sort blocked windows, merge overlaps, then find gaps from branch hours
  blocked.sort((a, b) => a.start - b.start)
  const merged = []
  for (const w of blocked) {
    const last = merged[merged.length - 1]
    if (last && w.start <= last.end) {
      last.end = Math.max(last.end, w.end)
    } else {
      merged.push({ ...w })
    }
  }

  const openMin = strToMin(branchOpen)
  const closeMin = strToMin(branchClose)

  // candidate usable gaps between blocked windows (in branch hours)
  const usable = []
  let cursor = openMin
  for (const w of merged) {
    if (w.start > cursor) usable.push({ start: cursor, end: Math.min(w.start, closeMin) })
    cursor = Math.max(cursor, w.end)
  }
  if (cursor < closeMin) usable.push({ start: cursor, end: closeMin })

  // clip to branch hours and pick the largest gap
  const clipped = usable
    .filter((g) => g.start < g.end && g.start < closeMin && g.end > openMin)
    .map((g) => ({ start: Math.max(g.start, openMin), end: Math.min(g.end, closeMin) }))
    .filter((g) => g.start < g.end)

  if (clipped.length === 0) return null
  clipped.sort((a, b) => b.end - b.start - (a.end - a.start))
  const best = clipped[0]

  return {
    openTime: minToStr(best.start),
    closeTime: minToStr(best.end),
  }
}

// --------------------------------
// findOverlappingLeaves — collision detection for the controller.
// returns the ids of existing active leaves that really overlap a new leave,
// day-by-day so recurring leaves only collide on their actual weekdays.
// --------------------------------
const findOverlappingLeaves = (existingLeaves, newLeave) => {
  const newRange = toDateRange(newLeave)
  if (!newRange.start || !newRange.end) return []

  const coversLeaveDate = (existing, date) => {
    const ex = toDateRange(existing)
    if (!ex.start || !ex.end) return false
    if (date < ex.start || date > ex.end) return false
    // recurring existing leaves fire only on their weekdays
    if (existing.type === "RECURRING") {
      return !!existing.weekdays?.includes(dayjs(date).day())
    }
    return true
  }

  const newCoversDate = (date) => {
    if (date < newRange.start || date > newRange.end) return false
    if (newLeave.type === "RECURRING") {
      return !!newLeave.weekdays?.includes(dayjs(date).day())
    }
    return true
  }

  return existingLeaves.filter((existing) => {
    if (!existing.isActive) return false

    // enumerate the overlapping window of the two ranges and check weekday
    // coverage day-by-day so recurring leaves only collide on real days
    let cursor = dayjs(newRange.start)
    const endD = dayjs(newRange.end)

    // early exit if existing leaves span a range outside the new one
    const ex = toDateRange(existing)
    if (!ex.start || !ex.end) return false
    const walkStart = ex.start > newRange.start ? ex.start : newRange.start
    const walkEnd = ex.end < newRange.end ? ex.end : newRange.end

    cursor = dayjs(walkStart)
    const loopEnd = dayjs(walkEnd)

    while (cursor.isBefore(loopEnd.add(1, "day"))) {
      const date = cursor.format("YYYY-MM-DD")
      if (newCoversDate(date) && coversLeaveDate(existing, date)) return true
      cursor = cursor.add(1, "day")
    }
    return false
  })
}

// --------------------------------
// strToMin — "HH:MM" → minutes since midnight
// minToStr — minutes since midnight → "HH:MM"
// --------------------------------
const strToMin = (t) => {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const minToStr = (min) => {
  const m = Math.max(0, Math.floor(min))
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

module.exports = {
  toDateRange,
  coversDate,
  getBlockedWindows,
  slotOverlapsLeave,
  isStaffFullyUnavailable,
  getEffectiveTimeWindow,
  findOverlappingLeaves,
  strToMin,
  minToStr,
}