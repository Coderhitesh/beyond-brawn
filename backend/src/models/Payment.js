const { Schema, model } = require('mongoose');
const schema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    provider: { type: String, default: 'razorpay' },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, index: true, sparse: true },
    razorpaySignature: { type: String, select: false },
    amount: { type: Number, required: true }, // rupees
    amountPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['created', 'paid', 'failed', 'refund_initiated', 'refunded'], default: 'created', index: true },
    method: String,
    paidAt: Date,
    failureReason: String,
    refunds: [{ _id: false, refundId: String, amount: Number, status: String, note: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);
module.exports = model('Payment', schema);
