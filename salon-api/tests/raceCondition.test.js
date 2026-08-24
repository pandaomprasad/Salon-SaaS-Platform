const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Slot = require('../src/models/slot.model');

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
  await Slot.deleteMany({});
});

describe('High-Risk Logic: Slot Booking Race Condition', () => {
  test('Concurrent booking requests on the same slot must allow only 1 winner', async () => {
    // 1. Create a single AVAILABLE slot
    const slot = await Slot.create({
      branchId: new mongoose.Types.ObjectId(),
      salonId: new mongoose.Types.ObjectId(),
      staffId: new mongoose.Types.ObjectId(),
      date: '2026-09-01',
      startTime: '10:00',
      endTime: '11:00',
      status: 'AVAILABLE'
    });

    const appointmentId1 = new mongoose.Types.ObjectId();
    const appointmentId2 = new mongoose.Types.ObjectId();

    // Atomic booking function simulating simultaneous requests
    const attemptBooking = async (appointmentId) => {
      return await Slot.findOneAndUpdate(
        { _id: slot._id, status: 'AVAILABLE' },
        { $set: { status: 'BOOKED', appointmentId } },
        { new: true }
      );
    };

    // 2. Fire concurrent requests simultaneously
    const [result1, result2] = await Promise.all([
      attemptBooking(appointmentId1),
      attemptBooking(appointmentId2)
    ]);

    // 3. Assert exact single winner behavior
    const winners = [result1, result2].filter(Boolean);
    expect(winners).toHaveLength(1);

    const finalSlotState = await Slot.findById(slot._id);
    expect(finalSlotState.status).toBe('BOOKED');
    expect(['AVAILABLE', 'BLOCKED', 'COMPLETED']).not.toContain(finalSlotState.status);
  });
});
