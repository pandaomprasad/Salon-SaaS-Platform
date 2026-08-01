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
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`)
    logger.error(`MongoDB connection error: ${error.message}`)
  }
}

module.exports = connectDB