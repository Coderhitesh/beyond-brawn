const { round2 } = require('../utils/helpers');
const { Product, ProductVariant } = require('../models');
const settings = require('./settings.service');
const shipping = require('./shipping.service');
const couponService = require('./coupon.service');

const BLOCKING = ['unavailable', 'variant_unavailable', 'out_of_stock'];
const ISSUE_TEXT = {
  unavailable: 'This product is no longer available',
  variant_unavailable: 'This option is no longer available',
  out_of_stock: 'Out of stock',
  insufficient_stock: 'Not enough stock for this quantity',
};

/*
 * Turns raw cart items ({ product|productId, variant|variantId, quantity }) into priced lines.
 * Every price comes from MongoDB. Nothing sent by the browser is trusted beyond ids and quantity.
 */
async function resolveLines(rawItems = []) {
  const merged = new Map();
  rawItems.forEach((it) => {
    const productId = String(it.productId || it.product || '');
    const variantId = it.variantId || it.variant ? String(it.variantId || it.variant) : null;
    if (!productId) return;
    const key = `${productId}:${variantId || ''}`;
    const quantity = Math.max(1, Math.min(20, parseInt(it.quantity, 10) || 1));
    const prev = merged.get(key);
    merged.set(key, { key, productId, variantId, quantity: prev ? Math.min(20, prev.quantity + quantity) : quantity, itemId: it._id ? String(it._id) : prev && prev.itemId });
  });
  const items = [...merged.values()];
  if (!items.length) return [];

  const [products, variants] = await Promise.all([
    Product.find({ _id: { $in: items.map((i) => i.productId) } })
      .select('name slug sku images thumbnail mrp price stock hasVariants isActive category subCategory gstRate')
      .lean(),
    ProductVariant.find({ _id: { $in: items.filter((i) => i.variantId).map((i) => i.variantId) } }).lean(),
  ]);
  const pMap = new Map(products.map((p) => [String(p._id), p]));
  const vMap = new Map(variants.map((v) => [String(v._id), v]));

  return items.map((it) => {
    const p = pMap.get(it.productId);
    const base = { key: it.key, itemId: it.itemId, productId: it.productId, variantId: it.variantId, quantity: it.quantity };
    if (!p || !p.isActive) return { ...base, name: p ? p.name : 'Unavailable product', slug: p && p.slug, mrp: 0, price: 0, lineMrp: 0, lineTotal: 0, stock: 0, issue: 'unavailable', issueText: ISSUE_TEXT.unavailable };

    let v = null;
    let issue = null;
    if (p.hasVariants) {
      v = it.variantId ? vMap.get(it.variantId) : null;
      if (!v || String(v.product) !== String(p._id) || !v.isActive) issue = 'variant_unavailable';
    }
    const src = v || p;
    const stock = issue ? 0 : src.stock;
    if (!issue) {
      if (stock <= 0) issue = 'out_of_stock';
      else if (it.quantity > stock) issue = 'insufficient_stock';
    }
    const price = issue === 'variant_unavailable' ? 0 : src.price;
    const mrp = issue === 'variant_unavailable' ? 0 : Math.max(src.mrp, src.price);
    return {
      ...base,
      variantId: v ? String(v._id) : null,
      name: p.name,
      slug: p.slug,
      sku: v ? v.sku : p.sku,
      image: (v && v.image) || p.thumbnail || (p.images && p.images[0] && p.images[0].url) || '',
      variantLabel: v ? v.label || Object.values(v.options || {}).join(' / ') : '',
      mrp,
      price,
      stock,
      lineMrp: round2(mrp * it.quantity),
      lineTotal: round2(price * it.quantity),
      gstRate: p.gstRate,
      categoryId: p.category ? String(p.category) : null,
      issue,
      issueText: issue ? ISSUE_TEXT[issue] : null,
    };
  });
}

/*
 * Prices lines: coupon, shipping, tax, total. Pure server-side maths.
 * Returns { lines, pricing, coupon, couponError, shippingMethod, shippingMethods, hasBlockingIssues, hasIssues }
 */
async function priceLines(lines, { couponCode, userId, email, methodCode } = {}) {
  const payable = lines.filter((l) => !BLOCKING.includes(l.issue));
  const subtotal = round2(payable.reduce((s, l) => s + l.lineTotal, 0));
  const mrpTotal = round2(payable.reduce((s, l) => s + l.lineMrp, 0));

  let coupon = null;
  let couponError = null;
  let couponDiscount = 0;
  let eligibleKeys = [];
  let eligibleTotal = 0;
  if (couponCode && payable.length) {
    try {
      const res = await couponService.evaluate(couponCode, { lines: payable, subtotal, userId, email });
      coupon = { id: res.coupon._id, code: res.coupon.code, description: res.coupon.description, discountType: res.coupon.discountType, value: res.coupon.value };
      couponDiscount = res.discount;
      eligibleKeys = res.eligibleKeys;
      eligibleTotal = res.eligibleTotal;
    } catch (e) {
      if (!e.isOperational) throw e;
      couponError = e.message;
    }
  }

  const afterDiscount = round2(subtotal - couponDiscount);
  const [{ method, methods, freeShippingThreshold }, taxCfg] = await Promise.all([shipping.quote({ amount: afterDiscount, methodCode }), settings.get('tax')]);
  const shippingCharge = payable.length ? method.charge : 0;

  // GST per line on the post-coupon value. Inclusive: extract from price. Exclusive: add on top.
  const inclusive = taxCfg.inclusive !== false;
  let tax = 0;
  payable.forEach((l) => {
    const share = eligibleKeys.includes(l.key) && eligibleTotal > 0 ? (couponDiscount * l.lineTotal) / eligibleTotal : 0;
    const net = l.lineTotal - share;
    const rate = Number.isFinite(l.gstRate) ? l.gstRate : taxCfg.defaultGstRate;
    tax += inclusive ? (net * rate) / (100 + rate) : (net * rate) / 100;
  });
  tax = round2(tax);

  const total = round2(afterDiscount + shippingCharge + (inclusive ? 0 : tax));
  const amountToFreeShipping = freeShippingThreshold > 0 && method.baseCharge > 0 ? Math.max(0, round2(freeShippingThreshold - afterDiscount)) : 0;

  return {
    lines,
    itemCount: payable.reduce((s, l) => s + l.quantity, 0),
    pricing: { mrpTotal, subtotal, productDiscount: round2(mrpTotal - subtotal), couponDiscount, shipping: shippingCharge, tax, taxInclusive: inclusive, total, freeShippingThreshold, amountToFreeShipping },
    coupon,
    couponError,
    shippingMethod: method,
    shippingMethods: methods,
    hasBlockingIssues: lines.some((l) => BLOCKING.includes(l.issue)),
    hasIssues: lines.some((l) => l.issue),
  };
}

const priceCart = async (rawItems, opts) => priceLines(await resolveLines(rawItems), opts);

module.exports = { resolveLines, priceLines, priceCart, BLOCKING };
