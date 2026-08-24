const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Branch = require('../src/models/branch.model');
const Service = require('../src/models/service.model');
const Notification = require('../src/models/notification.model');

jest.setTimeout(180000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.6' } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Branch.deleteMany({});
  await Service.deleteMany({});
  await Notification.deleteMany({});
});

describe('High-Risk Logic: Tenant Isolation Verification', () => {
  test('Queries scoped to Tenant A must never leak data from Tenant B', async () => {
    const salonIdA = new mongoose.Types.ObjectId();
    const salonIdB = new mongoose.Types.ObjectId();

    // 1. Create resources for Tenant A
    const branchA = await Branch.create({
      salonId: salonIdA,
      name: 'Tenant A Branch',
      address: { street: 'Main St', city: 'Brahmapur', state: 'Odisha', pincode: '760001' },
      contactPhone: '9999999999'
    });

    await Service.create({
      salonId: salonIdA,
      branchId: branchA._id,
      name: 'Haircut Tenant A',
      category: 'hair',
      price: 50000,
      durationMinutes: 30
    });

    await Notification.create({
      salonId: salonIdA,
      recipientId: new mongoose.Types.ObjectId(),
      type: 'leave.requested',
      title: 'Tenant A Alert'
    });

    // 2. Create resources for Tenant B
    const branchB = await Branch.create({
      salonId: salonIdB,
      name: 'Tenant B Branch',
      address: { street: 'Second St', city: 'Brahmapur', state: 'Odisha', pincode: '760001' },
      contactPhone: '8888888888'
    });

    await Service.create({
      salonId: salonIdB,
      branchId: branchB._id,
      name: 'Haircut Tenant B',
      category: 'hair',
      price: 60000,
      durationMinutes: 30
    });

    await Notification.create({
      salonId: salonIdB,
      recipientId: new mongoose.Types.ObjectId(),
      type: 'leave.requested',
      title: 'Tenant B Alert'
    });

    // 3. Query explicitly scoped to Tenant A
    const tenantABranches = await Branch.find({ salonId: salonIdA });
    const tenantAServices = await Service.find({ salonId: salonIdA });
    const tenantANotifications = await Notification.find({ salonId: salonIdA });

    // 4. Assert strict isolation
    expect(tenantABranches).toHaveLength(1);
    expect(tenantABranches[0].name).toBe('Tenant A Branch');

    expect(tenantAServices).toHaveLength(1);
    expect(tenantAServices[0].name).toBe('Haircut Tenant A');

    expect(tenantANotifications).toHaveLength(1);
    expect(tenantANotifications[0].title).toBe('Tenant A Alert');

    // Confirm Tenant B resources are completely absent
    const leakyBranches = tenantABranches.filter(b => b.salonId.toString() === salonIdB.toString());
    expect(leakyBranches).toHaveLength(0);
  });
});
