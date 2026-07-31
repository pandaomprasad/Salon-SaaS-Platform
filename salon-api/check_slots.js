require('dotenv').config();
const mongoose = require('mongoose');

async function checkSlots() {
  await mongoose.connect(process.env.MONGO_URI);
  const Slot = mongoose.model('Slot', new mongoose.Schema({
    branchId: mongoose.Schema.Types.ObjectId,
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: String,
    startTime: String,
    endTime: String,
    status: String
  }));
  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    role: mongoose.Schema.Types.ObjectId,
    branchId: mongoose.Schema.Types.ObjectId
  }));
  const Branch = mongoose.model('Branch', new mongoose.Schema({
    name: String
  }));

  const branches = await Branch.find().lean();
  console.log('=== BRANCHES LIST ===');
  branches.forEach(b => console.log(`${b.name} -> ID: ${b._id}`));

  const allStaff = await User.find({ branchId: { $ne: null } }).lean();
  console.log('\n=== STAFF ASSIGNED TO BRANCHES ===');
  allStaff.forEach(s => console.log(`${s.name} -> BranchID: ${s.branchId}`));

  const slots = await Slot.find({ date: '2026-07-31' }).populate('staffId').lean();
  console.log(`\n=== SLOTS FOR 2026-07-31 (${slots.length} Total Slots) ===`);

  const staffSlotMap = {};
  slots.forEach(s => {
    const sName = s.staffId?.name || 'Unknown';
    const bId = s.branchId?.toString();
    const key = `${sName} [Branch: ${bId}]`;
    if (!staffSlotMap[key]) staffSlotMap[key] = 0;
    staffSlotMap[key]++;
  });

  console.log(staffSlotMap);
  await mongoose.disconnect();
}

checkSlots().catch(err => {
  console.error(err);
  process.exit(1);
});
