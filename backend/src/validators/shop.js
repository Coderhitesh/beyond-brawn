const { z, objectId, email, phone, address, cartItem } = require('./common');

module.exports = {
  address: address.extend({ label: z.enum(['Home', 'Work', 'Other']).default('Home'), isDefault: z.boolean().optional() }),
  cartAdd: cartItem,
  cartUpdate: z.object({ quantity: z.coerce.number().int().min(1).max(20) }),
  cartMerge: z.object({ items: z.array(cartItem).max(50) }),
  cartPrice: z.object({
    items: z.array(cartItem).max(50),
    couponCode: z.string().trim().max(40).nullable().optional(),
    shippingMethod: z.string().trim().max(40).optional(),
    pincode: z.string().trim().max(6).optional(),
  }),
  coupon: z.object({ code: z.string().trim().min(2, 'Enter a coupon code').max(40) }),
  wishlist: z.object({ productId: objectId }),
  checkout: z
    .object({
      items: z.array(cartItem).min(1).max(50).optional(), // guests only; logged-in users check out their server cart
      addressId: objectId.optional(),
      address: address.optional(),
      guest: z.object({ name: z.string().trim().min(2).max(80), email, phone }).optional(),
      couponCode: z.string().trim().max(40).nullable().optional(),
      shippingMethod: z.string().trim().max(40).default('standard'),
      notes: z.string().trim().max(500).optional(),
      buyNow: cartItem.optional(), // single-item "Buy Now" that bypasses the cart
    })
    .refine((d) => d.addressId || d.address, { message: 'Add a delivery address', path: ['address'] }),
  verifyPayment: z.object({
    razorpay_order_id: z.string().min(5).max(80),
    razorpay_payment_id: z.string().min(5).max(80),
    razorpay_signature: z.string().min(10).max(200),
  }),
  paymentFailed: z.object({ razorpay_order_id: z.string().min(5).max(80), reason: z.string().max(300).optional() }),
  trackOrder: z.object({ orderNumber: z.string().trim().toUpperCase().max(30), email }),
  cancelOrder: z.object({ reason: z.string().trim().max(300).optional() }),
  review: z.object({
    productId: objectId,
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(120).optional(),
    comment: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(2000),
    images: z.array(z.string().url()).max(1).optional(),
  }),
  contact: z.object({
    name: z.string().trim().min(2).max(80),
    email,
    phone: phone.optional().or(z.literal('')),
    subject: z.string().trim().max(160).optional(),
    message: z.string().trim().min(10, 'Message is too short').max(4000),
  }),
  newsletter: z.object({ email }),
};
