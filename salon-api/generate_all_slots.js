require('dotenv').config();
const mongoose = require('mongoose');

const Branch = require('./src/models/branch.model');
const User = require('./src/models/user.model');
const Role = require('./src/models/role.model');
const Slot = require('./src/models/slot.model');
const { generateDaySlots } = require('./src/utils/slotGenerator');

async function generateAllSlots() {
  await mongoose.connect(process.env.MONGO_URI);

  const branches = await Branch.find({ isActive: true }).lean();
  const staffRoles = await Role.find({ name: { $in: ['staff', 'manager'] } }).select('_id').lean();
  const roleIds = staffRoles.map(r => r._id);

  console.log(`Generating slots for ${branches.length} branches for today (2026-07-31)...`);

  const date = '2026-07-31';

  for (const branch of branches) {
    const staffMembers = await User.find({ branchId: branch._id, role: { $in: roleIds }, isActive: true }).lean();
    console.log(`Branch ${branch.name}: Found ${staffMembers.length} staff members (${staffMembers.map(s => s.name).join(', ')})`);

    for (const staff of staffMembers) {
      const daySlots = generateDaySlots(branch, date);
      const slotsToInsert = daySlots.map(slot => ({
        branchId: branch._id,
        salonId: branch.salonId,
        staffId: staff._id,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'AVAILABLE'
      }));

      try {
        const result = await Slot.insertMany(slotsToInsert, { ordered: false });
        console.log(`  └─ Created ${result.length} slots for ${staff.name}`);
      } catch (err) {
        const inserted = err.insertedDocs?.length || 0;
        console.log(`  └─ Created ${inserted} new slots for ${staff.name} (some already existed)`);
      }
    }
  }

  await mongoose.disconnect();
}

generateAllSlots().catch(err => {
  console.error(err);
  process.exit(1);
});
