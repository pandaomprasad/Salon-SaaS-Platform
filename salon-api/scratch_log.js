require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  salonId: mongoose.Schema.Types.ObjectId,
  branchId: mongoose.Schema.Types.ObjectId
});

const roleSchema = new mongoose.Schema({ name: String });
const salonSchema = new mongoose.Schema({ name: String, description: String, contactEmail: String, contactPhone: String, owner: mongoose.Schema.Types.ObjectId });
const branchSchema = new mongoose.Schema({ name: String, address: Object, salonId: mongoose.Schema.Types.ObjectId });

const User = mongoose.model('User', userSchema);
const Role = mongoose.model('Role', roleSchema);
const Salon = mongoose.model('Salon', salonSchema);
const Branch = mongoose.model('Branch', branchSchema);

async function logAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\n======================================================');
  console.log('              SALON SAAS PLATFORM DATA               ');
  console.log('======================================================\n');

  const [salons, branches, roles, users] = await Promise.all([
    Salon.find().lean(),
    Branch.find().lean(),
    Role.find().lean(),
    User.find().populate('role').lean()
  ]);

  const roleMap = {};
  roles.forEach(r => {
    if (r._id) roleMap[r._id.toString()] = r.name;
  });

  console.log(`--- 🏢 SALONS (${salons.length}) ---`);
  salons.forEach((s, idx) => {
    console.log(`[${idx + 1}] ${s.name}`);
    console.log(`     ID: ${s._id}`);
    console.log(`     Email: ${s.contactEmail || 'N/A'} | Phone: ${s.contactPhone || 'N/A'}`);
    console.log('------------------------------------------------------');
  });

  console.log(`\n--- 📍 BRANCHES (${branches.length}) ---`);
  branches.forEach((b, idx) => {
    const city = b.address?.city || 'N/A';
    console.log(`[${idx + 1}] ${b.name} (${city})`);
    console.log(`     ID: ${b._id}`);
    console.log(`     Salon ID: ${b.salonId}`);
    console.log('------------------------------------------------------');
  });

  console.log(`\n--- 👔 OWNERS, MANAGERS & STAFF (${users.length} Total Users) ---`);
  users.forEach((u, idx) => {
    const rName = (u.role?.name || roleMap[u.role?.toString()] || 'User').toUpperCase();
    console.log(`[${idx + 1}] ${u.name} — Role: ${rName}`);
    console.log(`     ID: ${u._id}`);
    console.log(`     Email: ${u.email} | Phone: ${u.phone}`);
    console.log(`     Salon ID: ${u.salonId || 'N/A'} | Branch ID: ${u.branchId || 'N/A'}`);
    console.log('------------------------------------------------------');
  });

  await mongoose.disconnect();
}

logAll().catch(err => {
  console.error('Error fetching data:', err);
  process.exit(1);
});
