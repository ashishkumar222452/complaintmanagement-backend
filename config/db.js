const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/complaint_system';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️  MongoDB service unavailable at ${uri}: ${error.message}`);
    console.log(`📦 Running in Self-Contained Persistent Storage Mode (Data auto-saved to backend/data/)`);
    console.log(`💡 To connect to a live MongoDB instance, ensure MongoDB service is running or provide MONGODB_URI in .env`);
    return false;
  }
};

const getDbStatus = () => isConnected;

module.exports = { connectDB, getDbStatus };
