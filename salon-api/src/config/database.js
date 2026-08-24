const mongoose = require('mongoose')
const logger = require('../utils/logger')

// Set up connection event listeners once
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Attempting to reconnect...')
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB Runtime Error: ${err.message}`)
  logger.error(`MongoDB runtime error: ${err.message}`)
})

const connectDB = async (retryCount = 0) => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ CRITICAL: MONGO_URI environment variable is missing!')
      logger.error('MONGO_URI environment variable is missing!')
      return
    }

    if (mongoose.connection.readyState === 1) {
      return
    }

    console.log('🔄 Connecting to MongoDB...')
    const conn = await mongoose.connect(process.env.MONGO_URI.trim(), {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 25,
      minPoolSize: 5,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    logger.info(`MongoDB connected: ${conn.connection.host}`)

    // Trigger cache warming asynchronously so public endpoints are pre-cached immediately
    setTimeout(() => {
      const warmCacheOnBoot = require('../utils/cacheWarmer');
      warmCacheOnBoot();
    }, 500);

    // Backfill citySlug on branches created before the field existed.
    try {
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
    } catch (e) {
      console.log('CitySlug backfill error:', e.message)
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
    console.error(`❌ MongoDB Connection Error (${error.message}). Retrying in 3s...`)
    logger.error(`MongoDB connection error: ${error.message}`)
    if (retryCount < 5) {
      setTimeout(() => connectDB(retryCount + 1), 3000)
    }
  }
}

module.exports = connectDB