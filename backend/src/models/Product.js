const { Schema, model } = require('mongoose');
const { seoSchema, imageSchema, GOALS } = require('./_shared');

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory: { type: Schema.Types.ObjectId, ref: 'SubCategory' },

    shortDescription: { type: String, trim: true, maxlength: 300 },
    description: String,
    benefits: [{ type: String, trim: true }],
    ingredients: String,
    nutritionFacts: {
      servingSize: String,
      servingsPerContainer: String,
      rows: [{ _id: false, label: String, amount: String, dailyValue: String }],
    },
    directions: String,
    warnings: String,
    specifications: [{ _id: false, label: String, value: String }],
    faqs: [{ _id: false, question: String, answer: String }],

    images: [imageSchema],
    thumbnail: String,
    videoUrl: String,

    // For products with variants these mirror the cheapest active variant / the summed stock.
    mrp: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0, select: false },
    gstRate: { type: Number, default: 18, min: 0, max: 40 },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },

    hasVariants: { type: Boolean, default: false },
    variantOptions: [{ _id: false, name: String, values: [String] }],

    tags: [{ type: String, trim: true, lowercase: true }],
    goals: [{ type: String, enum: GOALS }],
    productType: { type: String, trim: true }, // Powder, Capsule, Tablet, Liquid, Accessory
    dietary: [{ type: String, trim: true }], // Vegetarian, Vegan, Gluten Free, No Added Sugar

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    frequentlyBoughtWith: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    weightGrams: Number,
    seo: seoSchema,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('discountPercent').get(function discount() {
  return this.mrp > this.price ? Math.round(((this.mrp - this.price) / this.mrp) * 100) : 0;
});
productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.index({ name: 'text', tags: 'text', sku: 'text', shortDescription: 'text' }, { weights: { name: 10, tags: 5, sku: 5, shortDescription: 1 }, name: 'product_search' });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });
productSchema.index({ isActive: 1, subCategory: 1 });
productSchema.index({ isActive: 1, brand: 1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, soldCount: -1 });
productSchema.index({ isActive: 1, ratingAverage: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ tags: 1 });

module.exports = model('Product', productSchema);
