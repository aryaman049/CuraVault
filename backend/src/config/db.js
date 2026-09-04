const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');
exports.connectDB = async () => {
  if (!MONGODB_URI) { console.warn('No MONGODB_URI, skipping DB connect for demo'); return; }
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
};
