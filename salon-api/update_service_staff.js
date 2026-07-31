require('dotenv').config();
const mongoose = require('mongoose');

async function updateServices() {
  await mongoose.connect(process.env.MONGO_URI);
  const Service = mongoose.model('Service', new mongoose.Schema({
    name: String,
    branchId: mongoose.Schema.Types.ObjectId,
    eligibleStaff: [mongoose.Schema.Types.ObjectId]
  }));
  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    branchId: mongoose.Schema.Types.ObjectId,
    isActive: Boolean
  }));
  const Role = mongoose.model('Role', new mongoose.Schema({ name: String }));

  const staffRoles = await Role.find({ name: { $in: ['staff', 'manager'] } }).select('_id').lean();
  const roleIds = staffRoles.map(r => r._id);

  const services = await Service.find().lean();
  console.log(`Updating ${services.length} services...`);

  for (const s of services) {
    const branchStaff = await User.find({ branchId: s.branchId, role: { $in: roleIds }, isActive: true }).select('_id name').lean();
    const staffIds = branchStaff.map(st => st._id);

    await Service.findByIdAndUpdate(s._id, { eligibleStaff: staffIds });
    console.log(`Updated "${s.name}" -> eligibleStaff: [${branchStaff.map(st => st.name).join(', ')}]`);
  }

  await mongoose.disconnect();
}

updateServices().catch(err => {
  console.error(err);
  process.exit(1);
});
