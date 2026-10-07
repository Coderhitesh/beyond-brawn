const ApiError = require('../utils/ApiError');
const { Product, ProductVariant, Inventory } = require('../models');
const { notifyAdmin } = require('./notification.service');

/*
 * The only place stock is changed. Atomic: a negative delta only applies when enough stock exists,
 * so two simultaneous checkouts cannot oversell. Every change is written to the Inventory ledger.
 */
async function adjust({ productId, variantId = null, delta, type, note, order, admin }) {
  const qty = Math.trunc(Number(delta));
  if (!qty) return null;
  const guard = qty < 0 ? { stock: { $gte: -qty } } : {};
  let after;
  let sku;
  let name;
  let threshold;

  if (variantId) {
    const v = await ProductVariant.findOneAndUpdate({ _id: variantId, product: productId, ...guard }, { $inc: { stock: qty } }, { new: true });
    if (!v) throw new ApiError(409, 'Not enough stock', { productId, variantId }, 'INSUFFICIENT_STOCK');
    const p = await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } }, { new: true });
    if (p && p.stock < 0) await Product.updateOne({ _id: productId }, { stock: 0 });
    after = v.stock;
    sku = v.sku;
    name = `${p ? p.name : 'Product'} (${v.label || v.sku})`;
    threshold = p ? p.lowStockThreshold : 0;
  } else {
    const p = await Product.findOneAndUpdate({ _id: productId, ...guard }, { $inc: { stock: qty } }, { new: true });
    if (!p) throw new ApiError(409, 'Not enough stock', { productId }, 'INSUFFICIENT_STOCK');
    after = p.stock;
    sku = p.sku;
    name = p.name;
    threshold = p.lowStockThreshold;
  }

  const before = after - qty;
  await Inventory.create({ product: productId, variant: variantId, sku, type, quantity: qty, stockBefore: before, stockAfter: after, note, order, admin });

  if (qty < 0 && after <= threshold && before > threshold) {
    notifyAdmin('low_stock', after === 0 ? 'Out of stock' : 'Low stock', `${name} has ${after} left (SKU ${sku})`, '/admin/products/inventory?filter=low');
  }
  return { before, after, sku };
}

// Reserves every line or none (compensates on failure).
async function reserveLines(lines, orderId, note) {
  const done = [];
  try {
    for (const l of lines) {
      // eslint-disable-next-line no-await-in-loop
      await adjust({ productId: l.productId || l.product, variantId: l.variantId || l.variant || null, delta: -l.quantity, type: 'reserve', order: orderId, note });
      done.push(l);
    }
  } catch (e) {
    await releaseLines(done, orderId, 'Reservation rolled back');
    throw e;
  }
}

async function releaseLines(lines, orderId, note, type = 'release') {
  for (const l of lines) {
    // eslint-disable-next-line no-await-in-loop
    await adjust({ productId: l.productId || l.product, variantId: l.variantId || l.variant || null, delta: l.quantity, type, order: orderId, note }).catch(() => null);
  }
}

// Recomputes a variant product's mirrored price / stock from its active variants.
async function syncProductFromVariants(productId) {
  const variants = await ProductVariant.find({ product: productId, isActive: true }).sort({ price: 1 }).lean();
  if (!variants.length) return;
  const cheapest = variants[0];
  await Product.updateOne({ _id: productId }, { price: cheapest.price, mrp: Math.max(cheapest.mrp, cheapest.price), stock: variants.reduce((s, v) => s + v.stock, 0) });
}

module.exports = { adjust, reserveLines, releaseLines, syncProductFromVariants };
