const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, mongoose } = require('./config/db');
const app = require('./app');
const staleOrders = require('./jobs/releaseStaleOrders');

let server;

async function start() {
  await connectDB();
  staleOrders.start();
  server = app.listen(env.port, () => logger.info(`Beyond Brawn API listening on :${env.port} (${env.nodeEnv})`));
}

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  staleOrders.stop();
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (e) => logger.error('Unhandled rejection:', e));
process.on('uncaughtException', (e) => {
  logger.error('Uncaught exception:', e);
  process.exit(1);
});

start().catch((e) => {
  logger.error('Failed to start:', e);
  process.exit(1);
});
