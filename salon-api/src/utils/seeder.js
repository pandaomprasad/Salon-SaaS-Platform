require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const Permission = require('../models/permission.model')
const Role = require('../models/role.model')
const User = require('../models/user.model')
const Salon = require('../models/salon.model')
const Branch = require('../models/branch.model')

// ================================
// Step 1 — Define all permissions
// ================================
// format: resource:action
// these get inserted into the Permission collection

const PERMISSIONS = [
  // salon
  { resource: 'salon', action: 'create', description: 'Create a new salon org' },
  { resource: 'salon', action: 'read',   description: 'View salon details' },
  { resource: 'salon', action: 'update', description: 'Update salon info' },
  { resource: 'salon', action: 'delete', description: 'Delete a salon' },

  // branch
  { resource: 'branch', action: 'create', description: 'Create a new branch' },
  { resource: 'branch', action: 'read',   description: 'View branch details' },
  { resource: 'branch', action: 'update', description: 'Update branch info' },
  { resource: 'branch', action: 'delete', description: 'Delete a branch' },

  // staff
  { resource: 'staff', action: 'create', description: 'Add staff to branch' },
  { resource: 'staff', action: 'read',   description: 'View staff list' },
  { resource: 'staff', action: 'update', description: 'Update staff info' },
  { resource: 'staff', action: 'delete', description: 'Remove staff from branch' },

  // manager
  { resource: 'manager', action: 'create', description: 'Assign a manager to branch' },
  { resource: 'manager', action: 'read',   description: 'View manager info' },
  { resource: 'manager', action: 'update', description: 'Update manager info' },
  { resource: 'manager', action: 'delete', description: 'Remove manager from branch' },

  // service
  { resource: 'service', action: 'create', description: 'Add a service to branch' },
  { resource: 'service', action: 'read',   description: 'View services' },
  { resource: 'service', action: 'update', description: 'Update service/price' },
  { resource: 'service', action: 'delete', description: 'Remove a service' },

  // slot
  { resource: 'slot', action: 'create', description: 'Generate slots' },
  { resource: 'slot', action: 'read',   description: 'View available slots' },
  { resource: 'slot', action: 'update', description: 'Block/unblock a slot' },
  { resource: 'slot', action: 'delete', description: 'Delete slots' },

  // appointment
  { resource: 'appointment', action: 'create', description: 'Book an appointment' },
  { resource: 'appointment', action: 'read',   description: 'View appointments' },
  { resource: 'appointment', action: 'update', description: 'Update appointment status' },
  { resource: 'appointment', action: 'delete', description: 'Cancel an appointment' },

  // report
  { resource: 'report', action: 'read', description: 'View analytics and reports' },
]

// ================================
// Step 2 — Define role → permissions mapping
// ================================

const ROLE_PERMISSIONS = {
  // owner gets everything — but we still assign explicitly
  // so the permission check middleware works uniformly

  superadmin: [
    'salon:create', 'salon:read', 'salon:update', 'salon:delete',
    'branch:create', 'branch:read', 'branch:update', 'branch:delete',
    'manager:create', 'manager:read', 'manager:update', 'manager:delete',
    'staff:create', 'staff:read', 'staff:update', 'staff:delete',
    'service:read',
    'report:read'
  ],

  // owner gets everything ...
  owner: [
    'salon:create', 'salon:read', 'salon:update', 'salon:delete',
    'branch:create', 'branch:read', 'branch:update', 'branch:delete',
    'manager:create', 'manager:read', 'manager:update', 'manager:delete',
    'staff:create', 'staff:read', 'staff:update', 'staff:delete',
    'service:create', 'service:read', 'service:update', 'service:delete',
    'slot:create', 'slot:read', 'slot:update', 'slot:delete',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
    'report:read'
  ],

  // manager can manage their single branch
  manager: [
    'branch:read',
    'staff:create', 'staff:read', 'staff:update', 'staff:delete',
    'service:create', 'service:read', 'service:update', 'service:delete',
    'slot:create', 'slot:read', 'slot:update', 'slot:delete',
    'appointment:read', 'appointment:update',
    'report:read'
  ],

  // staff can only see their schedule and update appointment progress
  staff: [
    'service:read',
    'slot:read',
    'appointment:read', 'appointment:update'
  ],

  // customer can only book and view their own appointments
  customer: [
    'service:read',
    'slot:read',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete'
  ]
}

// ================================
// Main seeder function
// ================================
const seed = async () => {
  try {
    // connect to mongodb
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // --------------------------------
    // Clean existing data
    // --------------------------------
    await Permission.deleteMany({})
    await Role.deleteMany({})
    await User.deleteMany({})
    await Salon.deleteMany({})
    await Branch.deleteMany({})
    console.log('🧹 Cleared existing data')

    // --------------------------------
    // Insert permissions
    // --------------------------------
    const insertedPermissions = await Permission.insertMany(PERMISSIONS)
    console.log(`✅ Inserted ${insertedPermissions.length} permissions`)

    // build a lookup map: "appointment:read" => ObjectId
    // so we can find permissions quickly when building roles
    const permissionMap = {}
    insertedPermissions.forEach((p) => {
      permissionMap[`${p.resource}:${p.action}`] = p._id
    })

    // --------------------------------
    // Insert roles with their permissions
    // --------------------------------
    const roleDocuments = Object.entries(ROLE_PERMISSIONS).map(([roleName, keys]) => ({
      name: roleName,
      // map permission keys to their ObjectIds
      permissions: keys.map((key) => permissionMap[key]),
      description: `${roleName} role with default permissions`
    }))

    const insertedRoles = await Role.insertMany(roleDocuments)
    console.log(`✅ Inserted ${insertedRoles.length} roles`)

    // build role lookup: "owner" => ObjectId
    const roleMap = {}
    insertedRoles.forEach((r) => {
      roleMap[r.name] = r._id
    })

    // --------------------------------
    // Create test owner user
    // --------------------------------
    const ownerUser = await User.create({
      name: 'Test Owner',
      email: 'owner@salon.com',
      phone: '+91-9000000001',
      password: 'Password@123',
      role: roleMap['owner'],
      isActive: true
    })
    console.log(`✅ Created owner: ${ownerUser.email}`)

    // --------------------------------
    // Create test salon
    // --------------------------------
    const salon = await Salon.create({
      name: 'Glamour Studios',
      owner: ownerUser._id,
      description: 'Premium salon chain',
      contactEmail: 'contact@glamourstudios.com',
      contactPhone: '+91-9000000000'
    })
    console.log(`✅ Created salon: ${salon.name}`)

    // update owner with salonId now that salon exists
    await User.findByIdAndUpdate(ownerUser._id, { salonId: salon._id })

    // --------------------------------
    // Create test branch
    // --------------------------------
    const branch = await Branch.create({
      salonId: salon._id,
      name: 'Bandra West',
      address: {
        street: '14, Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        country: 'India'
      },
      contactPhone: '+91-9000000002',
      contactEmail: 'bandra@glamourstudios.com',
      slotDurationMinutes: 60,
      advanceBookingDays: 30,
      // default working hours Mon-Sat 9AM-9PM, Sunday closed
      workingHours: [
        { day: 0, isOpen: false, openTime: '09:00', closeTime: '21:00' }, // Sun
        { day: 1, isOpen: true,  openTime: '09:00', closeTime: '21:00' }, // Mon
        { day: 2, isOpen: true,  openTime: '09:00', closeTime: '21:00' }, // Tue
        { day: 3, isOpen: true,  openTime: '09:00', closeTime: '21:00' }, // Wed
        { day: 4, isOpen: true,  openTime: '09:00', closeTime: '21:00' }, // Thu
        { day: 5, isOpen: true,  openTime: '09:00', closeTime: '21:00' }, // Fri
        { day: 6, isOpen: true,  openTime: '09:00', closeTime: '21:00' }, // Sat
      ]
    })
    console.log(`✅ Created branch: ${branch.name}`)

    // --------------------------------
    // Create test manager
    // --------------------------------
    const managerUser = await User.create({
      name: 'Test Manager',
      email: 'manager@salon.com',
      phone: '+91-9000000003',
      password: 'Password@123',
      role: roleMap['manager'],
      salonId: salon._id,
      branchId: branch._id,
      isActive: true
    })
    console.log(`✅ Created manager: ${managerUser.email}`)

    // update branch with managerId
    await Branch.findByIdAndUpdate(branch._id, { managerId: managerUser._id })

    // --------------------------------
    // Create test staff
    // --------------------------------
    const staffUser = await User.create({
      name: 'Test Staff',
      email: 'staff@salon.com',
      phone: '+91-9000000004',
      password: 'Password@123',
      role: roleMap['staff'],
      salonId: salon._id,
      branchId: branch._id,
      isActive: true
    })
    console.log(`✅ Created staff: ${staffUser.email}`)

    // --------------------------------
    // Create test customer
    // --------------------------------
    const customerUser = await User.create({
      name: 'Test Customer',
      email: 'customer@salon.com',
      phone: '+91-9000000005',
      password: 'Password@123',
      role: roleMap['customer'],
      isActive: true
    })
    console.log(`✅ Created customer: ${customerUser.email}`)

    // --------------------------------
    // Create superadmin user
    // --------------------------------
    const superadminUser = await User.create({
      name: 'Platform Admin',
      email: 'admin@salonhq.com',
      phone: '+91-9000000099',
      password: 'Admin@123',
      role: roleMap['superadmin'],
      isActive: true
    })
    console.log(`✅ Created superadmin: ${superadminUser.email}`)

    // --------------------------------
    // Summary
    // --------------------------------
    console.log('\n========================================')
    console.log('🎉 Seeding complete!')
    console.log('========================================')
    console.log('Test accounts: Password@123 (except superadmin)')
    console.log('  SuperAdmin → admin@salonhq.com (Admin@123)')
    console.log('  Owner      → owner@salon.com (Password@123)')
    console.log('  Manager    → manager@salon.com (Password@123)')
    console.log('  Staff      → staff@salon.com (Password@123)')
    console.log('  Customer   → customer@salon.com (Password@123)')
    console.log('========================================\n')

    process.exit(0)

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

seed()