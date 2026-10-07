const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  // Indexes are built automatically in development. In production run `npm run seed` once (it syncs indexes) or set AUTO_INDEX=1.
  const autoIndex = process.env.AUTO_INDEX ? process.env.AUTO_INDEX === '1' : !env.isProd;
  // Fail in seconds, not minutes, when the database cannot be reached (wrong IP allow-list, network drop).
  mongoose.set('bufferTimeoutMS', 8000);
  await mongoose.connect(env.mongoUri, { autoIndex, serverSelectionTimeoutMS: 10000, socketTimeoutMS: 45000 });
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected. Requests get 503 until it reconnects.'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (e) => logger.error('MongoDB error:', e.message));
  logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

const isDbReady = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, mongoose, isDbReady };
