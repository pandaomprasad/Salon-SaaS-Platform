require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Role = require('./src/models/role.model');

async function resetSuperAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/salon_saas';
    console.log('🔄 Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    // 1. Ensure Superadmin Role exists
    let superadminRole = await Role.findOne({ name: 'superadmin' });
    if (!superadminRole) {
      superadminRole = await Role.create({
        name: 'superadmin',
        description: 'Super Administrator with full system control',
        scopes: ['*'],
      });
      console.log('✅ Created Superadmin Role.');
    }

    // 2. Remove all existing SuperAdmin accounts
    const deleteResult = await User.deleteMany({ role: superadminRole._id });
    console.log(`🗑️ Removed ${deleteResult.deletedCount} existing SuperAdmin user(s).`);

    // Also delete any users with email admin@salonhq.com to avoid duplicate email errors
    await User.deleteMany({ email: 'admin@salonhq.com' });

    // 3. Create fresh SuperAdmin user
    const newSuperAdmin = await User.create({
      name: 'Platform SuperAdmin',
      email: 'admin@salonhq.com',
      phone: '+91-9999900000',
      password: 'Admin@123',
      gender: 'male',
      role: superadminRole._id,
      isActive: true,
    });

    console.log('\n========================================');
    console.log('🎉 SuperAdmin reset complete!');
    console.log('========================================');
    console.log('New SuperAdmin Credentials:');
    console.log('  Email / ID : admin@salonhq.com');
    console.log('  Password   : Admin@123');
    console.log('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reset SuperAdmin:', error);
    process.exit(1);
  }
}

resetSuperAdmin();
