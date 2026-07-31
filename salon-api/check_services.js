require('dotenv').config();
const mongoose = require('mongoose');

async function checkServices() {
  await mongoose.connect(process.env.MONGO_URI);
  const Service = mongoose.model('Service', new mongoose.Schema({
    name: String,
    branchId: mongoose.Schema.Types.ObjectId,
    eligibleStaff: [mongoose.Schema.Types.ObjectId]
  }));
  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    role: mongoose.Schema.Types.ObjectId,
    branchId: mongoose.Schema.Types.ObjectId
  }));

  const services = await Service.find().lean();
  console.log(`=== ALL SERVICES (${services.length} Total) ===`);
  services.forEach(s => {
    console.log(`Service: ${s.name} [ID: ${s._id}, BranchID: ${s.branchId}]`);
    console.log(`  eligibleStaff:`, s.eligibleStaff);
  });

  const staff = await User.find({ branchId: { $ne: null } }).lean();
  console.log(`\n=== ALL STAFF (${staff.length} Total) ===`);
  staff.forEach(st => console.log(`Staff: ${st.name} [ID: ${st._id}, BranchID: ${st.branchId}]`));

  await mongoose.disconnect();
}

checkServices().catch(err => console.error(err));
