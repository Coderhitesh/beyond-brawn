const { z, objectId, email, password } = require('./common');
const { ORDER_STATUSES, GOALS } = require('../models/_shared');

const money = z.coerce.number().min(0).max(1e7);
const seo = z.object({ title: z.string().max(160).optional(), description: z.string().max(320).optional(), keywords: z.string().max(320).optional() }).partial().optional();
const image = z.object({ url: z.string().min(1), publicId: z.string().optional().nullable(), alt: z.string().optional().nullable() });

const variant = z.object({
  _id: objectId.optional(),
  sku: z.string().trim().min(2).max(60),
  options: z.record(z.string().max(60)).default({}),
  label: z.string().trim().max(120).optional(),
  mrp: money,
  price: money,
  costPrice: money.optional(),
  stock: z.coerce.number().int().min(0).default(0),
  image: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

const productBase = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(140).optional(),
  sku: z.string().trim().min(2).max(60),
  brand: objectId.nullable().optional(),
  category: objectId,
  subCategory: objectId.nullable().optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(50000).optional(),
  benefits: z.array(z.string().max(300)).max(20).optional(),
  ingredients: z.string().max(5000).optional(),
  nutritionFacts: z
    .object({
      servingSize: z.string().max(80).optional(),
      servingsPerContainer: z.string().max(80).optional(),
      rows: z.array(z.object({ label: z.string().max(80), amount: z.string().max(40).optional(), dailyValue: z.string().max(40).optional() })).max(60).optional(),
    })
    .optional(),
  directions: z.string().max(3000).optional(),
  warnings: z.string().max(3000).optional(),
  specifications: z.array(z.object({ label: z.string().max(80), value: z.string().max(300) })).max(40).optional(),
  faqs: z.array(z.object({ question: z.string().max(300), answer: z.string().max(2000) })).max(30).optional(),
  images: z.array(image).max(12).optional(),
  thumbnail: z.string().optional().nullable(),
  videoUrl: z.string().max(500).optional().nullable(),
  mrp: money,
  price: money,
  costPrice: money.optional(),
  gstRate: z.coerce.number().min(0).max(40).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  hasVariants: z.boolean().optional(),
  variantOptions: z.array(z.object({ name: z.string().max(40), values: z.array(z.string().max(60)).max(30) })).max(3).optional(),
  variants: z.array(variant).max(60).optional(),
  tags: z.array(z.string().max(40)).max(30).optional(),
  goals: z.array(z.enum(GOALS)).optional(),
  productType: z.string().max(40).optional(),
  dietary: z.array(z.string().max(40)).max(10).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  frequentlyBoughtWith: z.array(objectId).max(6).optional(),
  weightGrams: z.coerce.number().min(0).optional(),
  seo,
});
const priceRule = (d) => d.price === undefined || d.mrp === undefined || d.price <= d.mrp;
const priceMsg = { message: 'Selling price cannot be higher than MRP', path: ['price'] };

module.exports = {
  productCreate: productBase.refine(priceRule, priceMsg),
  productUpdate: productBase.partial().refine(priceRule, priceMsg),
  stockAdjust: z.object({
    productId: objectId,
    variantId: objectId.nullable().optional(),
    mode: z.enum(['add', 'remove', 'set']),
    quantity: z.coerce.number().int().min(0).max(1e6),
    note: z.string().trim().max(300).optional(),
  }),
  orderStatus: z.object({
    status: z.enum(ORDER_STATUSES),
    note: z.string().trim().max(500).optional(),
    notifyCustomer: z.boolean().default(true),
    tracking: z.object({ carrier: z.string().trim().max(80).optional(), trackingNumber: z.string().trim().max(80).optional(), trackingUrl: z.string().trim().max(500).optional() }).optional(),
  }),
  refund: z.object({ amount: z.coerce.number().positive().optional(), note: z.string().trim().max(300).optional() }),
  coupon: z
    .object({
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/, 'Use 3-40 letters, numbers, - or _'),
      description: z.string().max(300).optional(),
      discountType: z.enum(['percentage', 'fixed']),
      value: z.coerce.number().positive(),
      minOrderAmount: money.default(0),
      maxDiscount: money.default(0),
      startDate: z.coerce.date().nullable().optional(),
      expiryDate: z.coerce.date().nullable().optional(),
      usageLimit: z.coerce.number().int().min(0).default(0),
      perUserLimit: z.coerce.number().int().min(0).default(1),
      applicableCategories: z.array(objectId).default([]),
      applicableProducts: z.array(objectId).default([]),
      isActive: z.boolean().default(true),
    })
    .refine((d) => d.discountType !== 'percentage' || d.value <= 100, { message: 'Percentage cannot exceed 100', path: ['value'] })
    .refine((d) => !d.startDate || !d.expiryDate || d.expiryDate > d.startDate, { message: 'Expiry must be after the start date', path: ['expiryDate'] }),
  adminCreate: z.object({ name: z.string().trim().min(2).max(80), email, password, role: objectId, isActive: z.boolean().default(true) }),
  adminUpdate: z.object({ name: z.string().trim().min(2).max(80).optional(), email: email.optional(), password: password.optional(), role: objectId.optional(), isActive: z.boolean().optional() }),
  role: z.object({ name: z.string().trim().min(2).max(60), description: z.string().max(200).optional(), permissions: z.array(z.string().max(60)).default([]) }),
  reviewStatus: z.object({ status: z.enum(['approved', 'rejected', 'pending']) }),
  bulkIds: z.object({ ids: z.array(objectId).min(1).max(200), action: z.string().max(40), value: z.any().optional() }),
};
