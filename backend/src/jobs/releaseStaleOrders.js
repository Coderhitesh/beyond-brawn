const logger = require('../utils/logger');
const orderService = require('../services/order.service');

const EVERY = 5 * 60 * 1000;
let timer = null;

async function run() {
  try {
    const released = await orderService.releaseStaleOrders();
    if (released) logger.info(`Released stock for ${released} unpaid order(s)`);
  } catch (e) {
    logger.error('releaseStaleOrders failed:', e.message);
  }
}

module.exports = {
  start() {
    if (timer) return;
    timer = setInterval(run, EVERY);
    timer.unref();
    run();
  },
  stop() {
    clearInterval(timer);
    timer = null;
  },
};
