require('dotenv').config()
const mongoose = require('mongoose')

const User = require('../models/user.model')
const Salon = require('../models/salon.model')
const Branch = require('../models/branch.model')
const Service = require('../models/service.model')
const Slot = require('../models/slot.model')
const Appointment = require('../models/appointment.model')
const Role = require('../models/role.model')

// ================================
// Sample data seeder
// Run AFTER the main seeder
// Adds: services, customers, slots, appointments with history
// ================================

const SAMPLE_SERVICES = [
  { name: 'Premium Haircut', description: 'Precision cut with hot towel finish', category: 'hair', price: 800, durationMinutes: 45 },
  { name: 'Hair Color', description: 'Full head color with premium products', category: 'hair', price: 2500, durationMinutes: 120 },
  { name: 'Keratin Treatment', description: 'Smoothing treatment for frizz-free hair', category: 'hair', price: 3500, durationMinutes: 180 },
  { name: 'Beard Grooming', description: 'Trim, shape, and oil treatment', category: 'hair', price: 500, durationMinutes: 30 },
  { name: 'Classic Facial', description: 'Deep cleansing facial with massage', category: 'skin', price: 1500, durationMinutes: 60 },
  { name: 'Gold Facial', description: 'Anti-aging gold facial treatment', category: 'skin', price: 2500, durationMinutes: 90 },
  { name: 'De-Tan Treatment', description: 'Remove tan and brighten skin', category: 'skin', price: 1200, durationMinutes: 45 },
  { name: 'Manicure & Pedicure', description: 'Nail care with polish', category: 'nails', price: 1200, durationMinutes: 75 },
  { name: 'Gel Nails', description: 'Long-lasting gel nail art', category: 'nails', price: 1800, durationMinutes: 60 },
  { name: 'Bridal Makeup', description: 'Complete bridal makeup package', category: 'makeup', price: 5000, durationMinutes: 150 },
  { name: 'Party Makeup', description: 'Glamorous party look', category: 'makeup', price: 2000, durationMinutes: 60 },
  { name: 'Full Body Spa', description: 'Relaxing full body massage with aromatherapy', category: 'spa', price: 3000, durationMinutes: 120 },
  { name: 'Head Massage', description: 'Stress-relief head and shoulder massage', category: 'spa', price: 800, durationMinutes: 30 },
  { name: 'Aroma Therapy', description: 'Essential oil therapy for relaxation', category: 'spa', price: 2000, durationMinutes: 90 },
]

const SAMPLE_CUSTOMERS = [
  { name: 'Priya Sharma', email: 'priya@gmail.com', phone: '+91-9876543001' },
  { name: 'Anita Desai', email: 'anita.desai@gmail.com', phone: '+91-9876543002' },
  { name: 'Rahul Verma', email: 'rahul.v@gmail.com', phone: '+91-9876543003' },
  { name: 'Sneha Patel', email: 'sneha.p@gmail.com', phone: '+91-9876543004' },
  { name: 'Vikram Singh', email: 'vikram.s@gmail.com', phone: '+91-9876543005' },
  { name: 'Meera Nair', email: 'meera.n@gmail.com', phone: '+91-9876543006' },
  { name: 'Arjun Reddy', email: 'arjun.r@gmail.com', phone: '+91-9876543007' },
  { name: 'Kavita Joshi', email: 'kavita.j@gmail.com', phone: '+91-9876543008' },
  { name: 'Deepak Kumar', email: 'deepak.k@gmail.com', phone: '+91-9876543009' },
  { name: 'Riya Chopra', email: 'riya.c@gmail.com', phone: '+91-9876543010' },
  { name: 'Amit Bhatt', email: 'amit.b@gmail.com', phone: '+91-9876543011' },
  { name: 'Neha Gupta', email: 'neha.g@gmail.com', phone: '+91-9876543012' },
  { name: 'Sanjay Malhotra', email: 'sanjay.m@gmail.com', phone: '+91-9876543013' },
  { name: 'Pooja Rao', email: 'pooja.r@gmail.com', phone: '+91-9876543014' },
  { name: 'Kiran Bedi', email: 'kiran.b@gmail.com', phone: '+91-9876543015' },
]

// Generate dates for the past 30 days + next 7 days
function getDates() {
  const dates = []
  const now = new Date()
  for (let i = -30; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    // Skip Sundays
    if (d.getDay() === 0) continue
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // ── Get existing data ──
    const customerRole = await Role.findOne({ name: 'customer' })
    const staffRole = await Role.findOne({ name: 'staff' })
    if (!customerRole || !staffRole) {
      console.log('❌ Roles not found. Run main seeder first: npm run seed')
      process.exit(1)
    }

    const salon = await Salon.findOne({ isActive: true })
    if (!salon) { console.log('❌ No salon found.'); process.exit(1) }

    const branch = await Branch.findOne({ salonId: salon._id, isActive: true })
    if (!branch) { console.log('❌ No branch found.'); process.exit(1) }

    const staffMembers = await User.find({
      branchId: branch._id,
      role: { $in: [staffRole._id] },
      isActive: true
    })

    // Also include managers as staff for appointments
    const managerRole = await Role.findOne({ name: 'manager' })
    const managers = await User.find({
      branchId: branch._id,
      role: managerRole._id,
      isActive: true
    })

    const allStaff = [...staffMembers, ...managers]
    if (allStaff.length === 0) { console.log('❌ No staff found.'); process.exit(1) }

    console.log(`\n📍 Salon: ${salon.name}`)
    console.log(`📍 Branch: ${branch.name}`)
    console.log(`📍 Staff: ${allStaff.map(s => s.name).join(', ')}`)

    // ================================
    // Step 1 — Create Services
    // ================================
    console.log('\n🔧 Creating services...')
    const createdServices = []

    for (const svc of SAMPLE_SERVICES) {
      const exists = await Service.findOne({ name: svc.name, branchId: branch._id })
      if (exists) {
        createdServices.push(exists)
        continue
      }
      const created = await Service.create({
        ...svc,
        branchId: branch._id,
        salonId: salon._id,
        eligibleStaff: allStaff.map(s => s._id),
      })
      createdServices.push(created)
    }
    console.log(`✅ ${createdServices.length} services ready`)

    // ================================
    // Step 2 — Create Customers
    // ================================
    console.log('\n👥 Creating customers...')
    const createdCustomers = []

    for (const cust of SAMPLE_CUSTOMERS) {
      const exists = await User.findOne({ email: cust.email })
      if (exists) {
        createdCustomers.push(exists)
        continue
      }
      const created = await User.create({
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
        password: 'Password@123',
        role: customerRole._id,
        isActive: true,
      })
      createdCustomers.push(created)
    }
    console.log(`✅ ${createdCustomers.length} customers ready`)

    // ================================
    // Step 3 — Generate Slots
    // ================================
    console.log('\n📅 Generating slots...')
    const dates = getDates()
    let slotsCreated = 0

    for (const date of dates) {
      for (const staff of allStaff) {
        for (const time of TIME_SLOTS) {
          const endHour = parseInt(time.split(':')[0]) + 1
          const endTime = `${String(endHour).padStart(2, '0')}:00`

          const exists = await Slot.findOne({
            branchId: branch._id,
            staffId: staff._id,
            date,
            startTime: time,
          })
          if (exists) continue

          await Slot.create({
            branchId: branch._id,
            salonId: salon._id,
            staffId: staff._id,
            date,
            startTime: time,
            endTime,
            status: 'AVAILABLE',
          })
          slotsCreated++
        }
      }
    }
    console.log(`✅ ${slotsCreated} new slots created`)

    // ================================
    // Step 4 — Create Appointments with Status History
    // ================================
    console.log('\n📋 Creating appointments...')

    // Clear existing appointments for clean data
    await Appointment.deleteMany({ branchId: branch._id })

    const pastDates = dates.filter(d => d < new Date().toISOString().split('T')[0])
    const futureDates = dates.filter(d => d >= new Date().toISOString().split('T')[0])
    let appointmentsCreated = 0

    // ── Past appointments (completed, cancelled, no-show) ──
    for (const date of pastDates) {
      const numAppointments = randomInt(3, 8)

      for (let i = 0; i < numAppointments; i++) {
        const customer = randomItem(createdCustomers)
        const staff = randomItem(allStaff)
        const service = randomItem(createdServices)
        const time = randomItem(TIME_SLOTS)
        const endHour = parseInt(time.split(':')[0]) + 1
        const endTime = `${String(endHour).padStart(2, '0')}:00`

        // Find or create slot
        let slot = await Slot.findOne({
          branchId: branch._id,
          staffId: staff._id,
          date,
          startTime: time,
        })

        if (!slot) {
          slot = await Slot.create({
            branchId: branch._id,
            salonId: salon._id,
            staffId: staff._id,
            date,
            startTime: time,
            endTime,
            status: 'BOOKED',
          })
        } else if (slot.status !== 'AVAILABLE') {
          continue // Skip if slot already booked
        } else {
          slot.status = 'BOOKED'
          await slot.save()
        }

        // Decide final status with realistic distribution
        const rand = Math.random()
        let finalStatus, statusHistory

        const baseTime = new Date(`${date}T${time}:00.000Z`)

        if (rand < 0.65) {
          // 65% completed
          finalStatus = 'COMPLETED'
          statusHistory = [
            { status: 'PENDING', changedAt: new Date(baseTime.getTime() - 86400000), note: 'Appointment booked by customer' },
            { status: 'CONFIRMED', changedAt: new Date(baseTime.getTime() - 43200000), note: 'Confirmed by manager' },
            { status: 'IN_PROGRESS', changedAt: baseTime, note: 'Service started' },
            { status: 'COMPLETED', changedAt: new Date(baseTime.getTime() + service.durationMinutes * 60000), note: 'Service completed' },
          ]
          slot.status = 'COMPLETED'
        } else if (rand < 0.85) {
          // 20% cancelled
          finalStatus = 'CANCELLED'
          statusHistory = [
            { status: 'PENDING', changedAt: new Date(baseTime.getTime() - 86400000), note: 'Appointment booked by customer' },
            { status: 'CONFIRMED', changedAt: new Date(baseTime.getTime() - 43200000), note: 'Confirmed by manager' },
            { status: 'CANCELLED', changedAt: new Date(baseTime.getTime() - 3600000), note: 'Cancelled by customer' },
          ]
          slot.status = 'AVAILABLE'
        } else {
          // 15% no-show
          finalStatus = 'NO_SHOW'
          statusHistory = [
            { status: 'PENDING', changedAt: new Date(baseTime.getTime() - 86400000), note: 'Appointment booked by customer' },
            { status: 'CONFIRMED', changedAt: new Date(baseTime.getTime() - 43200000), note: 'Confirmed by manager' },
            { status: 'NO_SHOW', changedAt: new Date(baseTime.getTime() + 1800000), note: 'Customer did not show up' },
          ]
          slot.status = 'COMPLETED'
        }

        await slot.save()

        // Rating for completed appointments (70% leave rating)
        const rating = finalStatus === 'COMPLETED' && Math.random() < 0.7
          ? { score: randomInt(3, 5), review: randomItem(['Great service!', 'Very professional', 'Loved the result', 'Will come again', 'Amazing experience', null, null]), ratedAt: new Date(baseTime.getTime() + 7200000) }
          : { score: null, review: null, ratedAt: null }

        await Appointment.create({
          customerId: customer._id,
          branchId: branch._id,
          salonId: salon._id,
          staffId: staff._id,
          serviceId: service._id,
          slotId: slot._id,
          date,
          startTime: time,
          endTime,
          status: finalStatus,
          pricePaid: service.price,
          currency: 'INR',
          customerNotes: Math.random() < 0.3 ? randomItem(['Please use organic products', 'Running 10 min late', 'First time visiting', 'Allergic to certain chemicals', 'Want same style as last time']) : null,
          rating,
          statusHistory,
          cancellation: finalStatus === 'CANCELLED'
            ? { cancelledBy: Math.random() < 0.5 ? customer._id : staff._id, reason: randomItem(['Schedule conflict', 'Not feeling well', 'Emergency', 'Changed my mind']), cancelledAt: statusHistory[statusHistory.length - 1].changedAt }
            : { cancelledBy: null, reason: null, cancelledAt: null },
        })

        appointmentsCreated++
      }
    }

    // ── Future appointments (pending, confirmed) ──
    for (const date of futureDates.slice(0, 5)) {
      const numAppointments = randomInt(2, 5)

      for (let i = 0; i < numAppointments; i++) {
        const customer = randomItem(createdCustomers)
        const staff = randomItem(allStaff)
        const service = randomItem(createdServices)
        const time = randomItem(TIME_SLOTS.slice(0, 8)) // Only daytime slots

        let slot = await Slot.findOne({
          branchId: branch._id,
          staffId: staff._id,
          date,
          startTime: time,
          status: 'AVAILABLE',
        })

        if (!slot) continue

        slot.status = 'BOOKED'
        await slot.save()

        const endHour = parseInt(time.split(':')[0]) + 1
        const endTime = `${String(endHour).padStart(2, '0')}:00`

        const isPending = Math.random() < 0.4
        const finalStatus = isPending ? 'PENDING' : 'CONFIRMED'
        const now = new Date()

        const statusHistory = isPending
          ? [{ status: 'PENDING', changedAt: new Date(now.getTime() - randomInt(1, 24) * 3600000), note: 'Appointment booked by customer' }]
          : [
              { status: 'PENDING', changedAt: new Date(now.getTime() - randomInt(12, 48) * 3600000), note: 'Appointment booked by customer' },
              { status: 'CONFIRMED', changedAt: new Date(now.getTime() - randomInt(1, 12) * 3600000), note: 'Confirmed by manager' },
            ]

        await Appointment.create({
          customerId: customer._id,
          branchId: branch._id,
          salonId: salon._id,
          staffId: staff._id,
          serviceId: service._id,
          slotId: slot._id,
          date,
          startTime: time,
          endTime,
          status: finalStatus,
          pricePaid: service.price,
          currency: 'INR',
          customerNotes: Math.random() < 0.3 ? randomItem(['Please be gentle', 'Want a new look', 'First visit', 'Referred by friend']) : null,
          rating: { score: null, review: null, ratedAt: null },
          statusHistory,
          cancellation: { cancelledBy: null, reason: null, cancelledAt: null },
        })

        appointmentsCreated++
      }
    }

    console.log(`✅ ${appointmentsCreated} appointments created`)

    // ── Block some random slots ──
    console.log('\n🔒 Blocking some random slots...')
    const availableSlots = await Slot.find({
      branchId: branch._id,
      status: 'AVAILABLE',
      date: { $gte: new Date().toISOString().split('T')[0] }
    }).limit(10)

    for (const slot of availableSlots.slice(0, 5)) {
      slot.status = 'BLOCKED'
      slot.blockReason = randomItem(['Staff leave', 'Branch maintenance', 'Personal emergency', 'Training session'])
      await slot.save()
    }
    console.log(`✅ ${Math.min(5, availableSlots.length)} slots blocked`)

    // ================================
    // Summary
    // ================================
    const totalAppointments = await Appointment.countDocuments({ branchId: branch._id })
    const completedCount = await Appointment.countDocuments({ branchId: branch._id, status: 'COMPLETED' })
    const pendingCount = await Appointment.countDocuments({ branchId: branch._id, status: 'PENDING' })
    const confirmedCount = await Appointment.countDocuments({ branchId: branch._id, status: 'CONFIRMED' })
    const cancelledCount = await Appointment.countDocuments({ branchId: branch._id, status: 'CANCELLED' })
    const noShowCount = await Appointment.countDocuments({ branchId: branch._id, status: 'NO_SHOW' })
    const totalServices = await Service.countDocuments({ branchId: branch._id })
    const totalCustomers = await User.countDocuments({ role: customerRole._id })
    const totalSlots = await Slot.countDocuments({ branchId: branch._id })

    console.log('\n========================================')
    console.log('🎉 Sample data seeded!')
    console.log('========================================')
    console.log(`  Services:     ${totalServices}`)
    console.log(`  Customers:    ${totalCustomers}`)
    console.log(`  Slots:        ${totalSlots}`)
    console.log(`  Appointments: ${totalAppointments}`)
    console.log(`    ├ Completed:  ${completedCount}`)
    console.log(`    ├ Pending:    ${pendingCount}`)
    console.log(`    ├ Confirmed:  ${confirmedCount}`)
    console.log(`    ├ Cancelled:  ${cancelledCount}`)
    console.log(`    └ No-Show:    ${noShowCount}`)
    console.log('========================================\n')

    process.exit(0)

  } catch (error) {
    console.error('❌ Sample data seeding failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

seed()