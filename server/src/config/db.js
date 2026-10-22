const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If remote connection fails, attempt fallback to local MongoDB if not already
    if (!config.mongoUri.includes('localhost') && !config.mongoUri.includes('127.0.0.1')) {
      console.log('🔄 Attempting fallback connection to local MongoDB...');
      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/worksphere');
        console.log(`✅ MongoDB Fallback Connected: ${localConn.connection.host}`);
        return localConn;
      } catch (fallbackError) {
        console.error(`❌ Local fallback also failed: ${fallbackError.message}`);
        process.exit(1);
      }
    }
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected.');
});

module.exports = connectDB;
