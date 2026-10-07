const Razorpay = require('razorpay');
const env = require('./env');
const ApiError = require('../utils/ApiError');

let instance = null;

function getRazorpay() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new ApiError(503, 'Payment gateway is not configured', null, 'PAYMENT_NOT_CONFIGURED');
  }
  if (!instance) instance = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return instance;
}

module.exports = { getRazorpay };
