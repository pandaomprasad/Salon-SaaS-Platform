const dayjs = require('dayjs')

// ================================
// generateSlots
// ================================
// given a branch and a date, generates all possible time slots
// based on working hours and slot duration
//
// example:
//   branch opens 09:00, closes 21:00, slotDuration 60min
//   generates: 09:00-10:00, 10:00-11:00 ... 20:00-21:00
//
// returns array of { startTime, endTime } objects

const generateDaySlots = (branch, date) => {
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

    slots.push({
      startTime: current.format('HH:mm'),
      endTime: next.format('HH:mm')
    })

    current = next
  }

  return slots
}

module.exports = { generateDaySlots }