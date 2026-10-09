require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Role = require('./src/models/role.model');

async function setupClientAdmin() {
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

    const clientEmail = 'hairxsalonservice@gmail.com';
    const defaultPassword = 'Admin@123';

    // 2. Find or update/create SuperAdmin for hairxsalonservice@gmail.com
    let adminUser = await User.findOne({ email: clientEmail });

    if (adminUser) {
      adminUser.role = superadminRole._id;
      adminUser.password = defaultPassword;
      adminUser.isActive = true;
      adminUser.isEmailVerified = true;
      await adminUser.save();
      console.log(`✅ Updated existing user ${clientEmail} to SuperAdmin role.`);
    } else {
      adminUser = await User.create({
        name: 'HairX Platform Admin',
        email: clientEmail,
        phone: '+91-9876543210',
        password: defaultPassword,
        gender: 'male',
        role: superadminRole._id,
        isActive: true,
        isEmailVerified: true,
      });
      console.log(`✅ Created new SuperAdmin user: ${clientEmail}`);
    }

    console.log('\n========================================');
    console.log('🎉 CLIENT SUPERADMIN ACCOUNT SETUP COMPLETE!');
    console.log('========================================');
    console.log(`  Email    : ${clientEmail}`);
    console.log(`  Password : ${defaultPassword}`);
    console.log(`  Role     : Superadmin`);
    console.log('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to setup client admin:', error);
    process.exit(1);
  }
}

setupClientAdmin();
