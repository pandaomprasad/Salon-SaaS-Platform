const mongoose = require('mongoose')
const logger = require('../utils/logger')

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ CRITICAL: MONGO_URI environment variable is missing!')
      logger.error('MONGO_URI environment variable is missing!')
      return
    }
    console.log('🔄 Connecting to MongoDB...')
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    logger.info(`MongoDB connected: ${conn.connection.host}`)

    // Backfill citySlug on branches created before the field existed.
    // Pipeline update runs server-side so it pays no network cost.
    const Branch = require('../models/branch.model')
    const backfill = await Branch.updateMany(
      { $or: [{ citySlug: { $exists: false } }, { citySlug: null }] },
      [
        {
          $set: {
            citySlug: {
              $toLower: { $trim: { input: '$address.city' } }
            }
          }
        }
      ],
      { updatePipeline: true }
    )
    if (backfill.matchedCount > 0) {
      console.log(`🏙️ Backfilled citySlug on ${backfill.modifiedCount} branch(es)`)
    }

    // Drop legacy non-sparse phone_1 index if present
    try {
      const User = require('../models/user.model')
      await User.collection.dropIndex('phone_1')
      console.log('✅ Dropped legacy non-sparse phone_1 index from MongoDB')
    } catch (indexErr) {
      // Index didn't exist or was already replaced — non-fatal
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    logger.error(`MongoDB connection error: ${error.message}`)
  }
}

module.exports = connectDB