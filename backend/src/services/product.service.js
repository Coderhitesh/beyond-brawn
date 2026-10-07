const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { escapeRegex, paginate, pageMeta, isObjectId } = require('../utils/helpers');
const { uniqueSlug } = require('../utils/slug');
const { Product, ProductVariant, Category, SubCategory, Brand, OrderItem, Review, SearchTerm } = require('../models');
const inventory = require('./inventory.service');

const CARD_FIELDS = 'name slug sku thumbnail images shortDescription mrp price stock ratingAverage ratingCount hasVariants isBestSeller isNewArrival isFeatured brand category productType createdAt';
const SORTS = {
  featured: { isFeatured: -1, soldCount: -1, _id: -1 },
  newest: { createdAt: -1, _id: -1 },
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: 1 },
  'best-selling': { soldCount: -1, _id: -1 },
  rating: { ratingAverage: -1, ratingCount: -1, _id: -1 },
};
const NONE = new mongoose.Types.ObjectId('000000000000000000000000');
const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
const flag = (v) => v === '1' || v === 'true' || v === true;

// Adds discountPercent / inStock (virtuals are lost with .lean()) and a default variant for one-tap add to cart.
async function decorate(products) {
  const withVariants = products.filter((p) => p.hasVariants).map((p) => p._id);
  const defaults = new Map();
  if (withVariants.length) {
    const variants = await ProductVariant.find({ product: { $in: withVariants }, isActive: true }).select('product price stock label').sort({ price: 1 }).lean();
    variants.forEach((v) => {
      const key = String(v.product);
      const cur = defaults.get(key);
      if (!cur || (cur.stock <= 0 && v.stock > 0)) defaults.set(key, v);
    });
  }
  return products.map((p) => {
    const dv = defaults.get(String(p._id));
    return {
      ...p,
      images: (p.images || []).slice(0, 2),
      discountPercent: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
      inStock: p.stock > 0,
      defaultVariantId: dv ? dv._id : null,
      defaultVariantLabel: dv ? dv.label : null,
    };
  });
}

async function searchClause(q) {
  const rx = new RegExp(escapeRegex(q.trim().slice(0, 60)), 'i');
  const [cats, subs, brands] = await Promise.all([Category.find({ name: rx }).select('_id').lean(), SubCategory.find({ name: rx }).select('_id').lean(), Brand.find({ name: rx }).select('_id').lean()]);
  return [{ name: rx }, { sku: rx }, { tags: rx }, { category: { $in: cats.map((c) => c._id) } }, { subCategory: { $in: subs.map((c) => c._id) } }, { brand: { $in: brands.map((c) => c._id) } }];
}

// base = scope (category / search / flags); refine = user-controlled facets (brand, price, rating ...)
async function buildFilters(q) {
  const base = { isActive: true };
  const refine = {};
  let category = null;
  let subCategory = null;

  if (q.category) {
    category = await Category.findOne({ slug: q.category, isActive: true }).lean();
    base.category = category ? category._id : NONE;
  }
  if (q.subcategory) {
    subCategory = await SubCategory.findOne({ slug: q.subcategory, isActive: true }).lean();
    base.subCategory = subCategory ? subCategory._id : NONE;
  }
  if (q.q && String(q.q).trim()) base.$or = await searchClause(String(q.q));
  if (q.goal) base.goals = String(q.goal);
  if (q.tag) base.tags = String(q.tag).toLowerCase();
  if (flag(q.featured)) base.isFeatured = true;
  if (flag(q.bestSeller)) base.isBestSeller = true;
  if (flag(q.newArrival)) base.isNewArrival = true;
  if (flag(q.offers)) base.$expr = { $gt: ['$mrp', '$price'] };

  if (q.brand) {
    const brands = await Brand.find({ slug: { $in: list(q.brand) } }).select('_id').lean();
    refine.brand = { $in: brands.map((b) => b._id) };
  }
  const min = Number(q.minPrice);
  const max = Number(q.maxPrice);
  if (q.minPrice !== undefined && q.minPrice !== '' && Number.isFinite(min)) refine.price = { ...(refine.price || {}), $gte: min };
  if (q.maxPrice !== undefined && q.maxPrice !== '' && Number.isFinite(max)) refine.price = { ...(refine.price || {}), $lte: max };
  const rating = Number(q.rating);
  if (rating >= 1 && rating <= 5) refine.ratingAverage = { $gte: rating };
  if (flag(q.inStock)) refine.stock = { $gt: 0 };
  if (q.type) refine.productType = { $in: list(q.type) };
  if (q.dietary) refine.dietary = { $all: list(q.dietary) };

  return { base, refine, category, subCategory };
}

async function facets(base) {
  const group = (stages) => Product.aggregate([{ $match: base }, ...stages]);
  const [brands, price, types, dietary, subCategories] = await Promise.all([
    group([{ $group: { _id: '$brand', count: { $sum: 1 } } }]),
    group([{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
    group([{ $match: { productType: { $nin: [null, ''] } } }, { $group: { _id: '$productType', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    group([{ $unwind: '$dietary' }, { $group: { _id: '$dietary', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    group([{ $group: { _id: '$subCategory', count: { $sum: 1 } } }]),
  ]);
  const agg = { brands, price, types, dietary, subCategories };
  const brandDocs = await Brand.find({ _id: { $in: agg.brands.map((b) => b._id).filter(Boolean) } }).select('name slug').lean();
  const subDocs = await SubCategory.find({ _id: { $in: agg.subCategories.map((b) => b._id).filter(Boolean) }, isActive: true }).select('name slug').sort('sortOrder').lean();
  const count = (arr, id) => (arr.find((x) => String(x._id) === String(id)) || {}).count || 0;
  return {
    brands: brandDocs.map((b) => ({ name: b.name, slug: b.slug, count: count(agg.brands, b._id) })).sort((a, b) => a.name.localeCompare(b.name)),
    subCategories: subDocs.map((s) => ({ name: s.name, slug: s.slug, count: count(agg.subCategories, s._id) })),
    price: agg.price[0] ? { min: Math.floor(agg.price[0].min), max: Math.ceil(agg.price[0].max) } : { min: 0, max: 0 },
    types: agg.types.map((t) => ({ name: t._id, count: t.count })),
    dietary: agg.dietary.map((t) => ({ name: t._id, count: t.count })),
  };
}

async function listProducts(q) {
  const pg = paginate(q, { defaultLimit: 12, maxLimit: 48 });
  const { base, refine, category, subCategory } = await buildFilters(q);
  const filter = { ...base, ...refine };
  const sort = SORTS[q.sort] || SORTS.featured;
  const [items, total, facetData] = await Promise.all([
    Product.find(filter).select(CARD_FIELDS).populate('brand', 'name slug').populate('category', 'name slug').sort(sort).skip(pg.skip).limit(pg.limit).lean(),
    Product.countDocuments(filter),
    flag(q.facets) || q.facets === undefined ? facets(base) : null,
  ]);
  if (q.q && String(q.q).trim().length >= 3 && pg.page === 1 && total > 0) {
    SearchTerm.updateOne({ term: String(q.q).trim().toLowerCase().slice(0, 60) }, { $inc: { count: 1 } }, { upsert: true }).catch(() => null);
  }
  return { products: await decorate(items), meta: pageMeta(pg, total), facets: facetData, category, subCategory };
}

const cards = async (filter, sort, limit) => decorate(await Product.find({ isActive: true, ...filter }).select(CARD_FIELDS).populate('brand', 'name slug').sort(sort).limit(limit).lean());

async function frequentlyBoughtTogether(product) {
  if (product.frequentlyBoughtWith && product.frequentlyBoughtWith.length) {
    return cards({ _id: { $in: product.frequentlyBoughtWith } }, { soldCount: -1 }, 3);
  }
  const orderIds = (await OrderItem.find({ product: product._id }).sort({ createdAt: -1 }).limit(300).select('order').lean()).map((i) => i.order);
  if (orderIds.length) {
    const co = await OrderItem.aggregate([{ $match: { order: { $in: orderIds }, product: { $ne: product._id } } }, { $group: { _id: '$product', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 3 }]);
    if (co.length) {
      const found = await cards({ _id: { $in: co.map((c) => c._id) }, stock: { $gt: 0 } }, { soldCount: -1 }, 3);
      if (found.length) return found;
    }
  }
  // Cold start: best sellers from other categories pair well (e.g. creatine with whey).
  return cards({ category: { $ne: product.category._id || product.category }, stock: { $gt: 0 } }, { soldCount: -1, isBestSeller: -1 }, 3);
}

async function getProductBySlug(slug) {
  const product = await Product.findOne({ slug, isActive: true }).populate('brand', 'name slug logo').populate('category', 'name slug').populate('subCategory', 'name slug').lean({ virtuals: false });
  if (!product) throw new ApiError(404, 'Product not found', null, 'NOT_FOUND');
  delete product.costPrice;

  const catId = product.category && product.category._id;
  const subId = product.subCategory && product.subCategory._id;
  const [variants, related, similar, fbt, ratingBreakdown] = await Promise.all([
    product.hasVariants ? ProductVariant.find({ product: product._id, isActive: true }).sort({ sortOrder: 1, price: 1 }).lean() : [],
    cards(subId ? { subCategory: subId, _id: { $ne: product._id } } : { category: catId, _id: { $ne: product._id } }, { soldCount: -1 }, 8),
    cards({ _id: { $ne: product._id }, category: catId, ...(subId ? { subCategory: { $ne: subId } } : { goals: { $in: product.goals || [] } }) }, { ratingAverage: -1, soldCount: -1 }, 8),
    frequentlyBoughtTogether(product),
    Review.aggregate([{ $match: { product: product._id, status: 'approved' } }, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
  ]);
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingBreakdown.forEach((r) => {
    breakdown[r._id] = r.count;
  });
  return {
    product: { ...product, discountPercent: product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0, inStock: product.stock > 0, ratingBreakdown: breakdown },
    variants: variants.map((v) => ({ ...v, options: v.options instanceof Map ? Object.fromEntries(v.options) : v.options, discountPercent: v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0, inStock: v.stock > 0 })),
    related,
    similar,
    frequentlyBoughtTogether: fbt,
  };
}

async function getByIds(ids = []) {
  const valid = ids.filter(isObjectId).slice(0, 24);
  if (!valid.length) return [];
  const found = await cards({ _id: { $in: valid } }, {}, 24);
  const order = new Map(valid.map((id, i) => [id, i]));
  return found.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));
}

async function suggest(q) {
  const term = String(q || '').trim();
  if (term.length < 2) return { products: [], categories: [], brands: [] };
  const rx = new RegExp(escapeRegex(term.slice(0, 60)), 'i');
  const [products, categories, subCategories, brands] = await Promise.all([
    Product.find({ isActive: true, $or: [{ name: rx }, { sku: rx }, { tags: rx }] }).select('name slug thumbnail price mrp').sort({ soldCount: -1 }).limit(6).lean(),
    Category.find({ isActive: true, name: rx }).select('name slug').limit(3).lean(),
    SubCategory.find({ isActive: true, name: rx }).select('name slug').populate('category', 'slug').limit(4).lean(),
    Brand.find({ isActive: true, name: rx }).select('name slug').limit(3).lean(),
  ]);
  return {
    products,
    categories: [...categories.map((c) => ({ name: c.name, href: `/category/${c.slug}` })), ...subCategories.map((s) => ({ name: s.name, href: `/category/${s.category ? s.category.slug : ''}?subcategory=${s.slug}` }))],
    brands: brands.map((b) => ({ name: b.name, href: `/shop?brand=${b.slug}` })),
  };
}

const popularSearches = async () => (await SearchTerm.find().sort({ count: -1 }).limit(8).lean()).map((t) => t.term);

async function recalcRating(productId) {
  const [agg] = await Review.aggregate([{ $match: { product: new mongoose.Types.ObjectId(String(productId)), status: 'approved' } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  await Product.updateOne({ _id: productId }, { ratingAverage: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg ? agg.count : 0 });
}

/* ---------------- admin: create / update ---------------- */

const variantLabel = (v) => v.label || Object.values(v.options || {}).filter(Boolean).join(' / ') || v.sku;

async function saveVariants(product, variants, adminId) {
  const existing = await ProductVariant.find({ product: product._id });
  const keep = new Set();
  for (const v of variants) {
    const sku = String(v.sku).toUpperCase();
    // eslint-disable-next-line no-await-in-loop
    if (await Product.exists({ sku, _id: { $ne: product._id } })) throw new ApiError(409, `SKU ${sku} is already used by another product`, null, 'DUPLICATE');
    const cur = v._id ? existing.find((e) => String(e._id) === String(v._id)) : existing.find((e) => e.sku === sku);
    const fields = { sku, options: v.options || {}, label: variantLabel(v), mrp: Math.max(v.mrp, v.price), price: v.price, image: v.image || undefined, isActive: v.isActive !== false, sortOrder: v.sortOrder || 0 };
    if (v.costPrice !== undefined) fields.costPrice = v.costPrice;
    if (cur) {
      Object.assign(cur, fields);
      // eslint-disable-next-line no-await-in-loop
      await cur.save();
      keep.add(String(cur._id));
      const delta = (v.stock ?? cur.stock) - cur.stock;
      // eslint-disable-next-line no-await-in-loop
      if (delta) await inventory.adjust({ productId: product._id, variantId: cur._id, delta, type: 'adjustment', note: 'Edited in product form', admin: adminId });
    } else {
      // eslint-disable-next-line no-await-in-loop
      const created = await ProductVariant.create({ ...fields, product: product._id, stock: 0 });
      keep.add(String(created._id));
      // eslint-disable-next-line no-await-in-loop
      if (v.stock) await inventory.adjust({ productId: product._id, variantId: created._id, delta: v.stock, type: 'initial', note: 'Opening stock', admin: adminId });
    }
  }
  for (const old of existing.filter((e) => !keep.has(String(e._id)))) {
    // Variants that appear in past orders are kept (inactive) so order history stays intact.
    // eslint-disable-next-line no-await-in-loop
    if (await OrderItem.exists({ variant: old._id })) await ProductVariant.updateOne({ _id: old._id }, { isActive: false, stock: 0 });
    // eslint-disable-next-line no-await-in-loop
    else await old.deleteOne();
  }
  await inventory.syncProductFromVariants(product._id);
}

async function saveProduct(data, { id = null, adminId = null } = {}) {
  const { variants, stock, ...fields } = data;
  let product = id ? await Product.findById(id).select('+costPrice') : null;
  if (id && !product) throw new ApiError(404, 'Product not found');

  const categoryId = fields.category || (product && product.category);
  if (fields.category && !(await Category.exists({ _id: fields.category }))) throw new ApiError(400, 'Choose a valid category');
  if (fields.subCategory && !(await SubCategory.exists({ _id: fields.subCategory, category: categoryId }))) throw new ApiError(400, 'That subcategory does not belong to the selected category');
  if (fields.sku) {
    fields.sku = fields.sku.toUpperCase();
    if (await ProductVariant.exists({ sku: fields.sku, ...(product ? { product: { $ne: product._id } } : {}) })) throw new ApiError(409, `SKU ${fields.sku} is already used by a variant`, null, 'DUPLICATE');
  }
  if (fields.slug !== undefined || !product) fields.slug = await uniqueSlug(Product, fields.slug || fields.name || (product && product.name), id);
  if (fields.images && !fields.thumbnail) fields.thumbnail = fields.images[0] ? fields.images[0].url : undefined;
  if (fields.mrp !== undefined && fields.price !== undefined) fields.mrp = Math.max(fields.mrp, fields.price);

  const hasVariants = fields.hasVariants !== undefined ? fields.hasVariants : product ? product.hasVariants : false;
  if (hasVariants && !product && !(variants && variants.length)) throw new ApiError(400, 'Add at least one variant or turn variants off');

  if (product) {
    Object.assign(product, fields);
    await product.save();
  } else {
    product = await Product.create({ ...fields, stock: 0 });
  }

  if (hasVariants) {
    if (variants) await saveVariants(product, variants, adminId);
    else await inventory.syncProductFromVariants(product._id);
  } else {
    if (await ProductVariant.exists({ product: product._id })) await ProductVariant.updateMany({ product: product._id }, { isActive: false });
    if (stock !== undefined) {
      const current = (await Product.findById(product._id).select('stock').lean()).stock;
      const delta = stock - current;
      if (delta) await inventory.adjust({ productId: product._id, delta, type: id ? 'adjustment' : 'initial', note: id ? 'Edited in product form' : 'Opening stock', admin: adminId });
    }
  }
  return getAdminProduct(product._id);
}

async function getAdminProduct(id) {
  const product = await Product.findById(id).select('+costPrice').populate('brand', 'name').populate('category', 'name slug').populate('subCategory', 'name slug').lean();
  if (!product) throw new ApiError(404, 'Product not found');
  const variants = await ProductVariant.find({ product: id }).select('+costPrice').sort({ sortOrder: 1, createdAt: 1 }).lean();
  return { product, variants: variants.map((v) => ({ ...v, options: v.options instanceof Map ? Object.fromEntries(v.options) : v.options })) };
}

module.exports = { listProducts, getProductBySlug, getByIds, suggest, popularSearches, recalcRating, saveProduct, getAdminProduct, decorate, cards, CARD_FIELDS };
