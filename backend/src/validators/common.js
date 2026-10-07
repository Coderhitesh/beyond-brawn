const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(160);
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');
const otp = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit OTP');
const pincode = z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode');

const address = z.object({
  fullName: z.string().trim().min(2, 'Enter the full name').max(80),
  phone,
  line1: z.string().trim().min(3, 'Enter the address').max(200),
  line2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Enter the city').max(80),
  state: z.string().trim().min(2, 'Enter the state').max(80),
  pincode,
  country: z.string().trim().max(60).default('India'),
});

const cartItem = z.object({
  productId: objectId,
  variantId: objectId.nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(20),
});

module.exports = { z, objectId, email, phone, password, otp, pincode, address, cartItem };
