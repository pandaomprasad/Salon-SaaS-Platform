require('dotenv').config();
const mongoose = require('mongoose');

async function checkStaff() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    branchId: mongoose.Schema.Types.ObjectId,
    salonId: mongoose.Schema.Types.ObjectId,
    isActive: Boolean
  }));
  const Role = mongoose.model('Role', new mongoose.Schema({ name: String }));

  const staffRoles = await Role.find({ name: { $in: ['staff', 'manager'] } }).select('_id').lean();
  const roleIds = staffRoles.map(r => r._id);

  const branch1 = '6a6b6dd9ad19a45c0956c479'; // Indiranagar Flagship
  const staff1 = await User.find({ branchId: branch1, role: { $in: roleIds } }).populate('role').lean();

  console.log('--- STAFF FOR INDIRANAGAR FLAGSHIP ---');
  staff1.forEach(s => console.log(`${s.name} | Role: ${s.role?.name} | isActive: ${s.isActive}`));

  const branch2 = '6a6b6dd8ad19a45c0956c46a'; // Bandra West Studio
  const staff2 = await User.find({ branchId: branch2, role: { $in: roleIds } }).populate('role').lean();

  console.log('\n--- STAFF FOR BANDRA WEST STUDIO ---');
  staff2.forEach(s => console.log(`${s.name} | Role: ${s.role?.name} | isActive: ${s.isActive}`));

  await mongoose.disconnect();
}

checkStaff().catch(err => console.error(err));
