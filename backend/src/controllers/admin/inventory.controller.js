const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok } = require('../../utils/respond');
const { paginate, pageMeta, escapeRegex, isObjectId, sendCsv } = require('../../utils/helpers');
const { Product, ProductVariant, Inventory } = require('../../models');
const inventory = require('../../services/inventory.service');

// One row per sellable SKU: simple products and each variant.
async function rows(q) {
  const match = {};
  if (q.q) {
    const rx = new RegExp(escapeRegex(String(q.q).slice(0, 60)), 'i');
    const variantProductIds = await ProductVariant.find({ sku: rx }).distinct('product');
    match.$or = [{ name: rx }, { sku: rx }, { _id: { $in: variantProductIds } }];
  }
  const products = await Product.find(match).select('name sku thumbnail stock lowStockThreshold hasVariants isActive').sort({ name: 1 }).lean();
  const variants = await ProductVariant.find({ product: { $in: products.filter((p) => p.hasVariants).map((p) => p._id) }, isActive: true }).select('product sku label stock').sort({ sortOrder: 1 }).lean();
  const out = [];
  products.forEach((p) => {
    const mk = (stock, extra) => ({ productId: p._id, name: p.name, thumbnail: p.thumbnail, isActive: p.isActive, lowStockThreshold: p.lowStockThreshold, stock, status: stock <= 0 ? 'out' : stock <= p.lowStockThreshold ? 'low' : 'ok', ...extra });
    if (p.hasVariants) variants.filter((v) => String(v.product) === String(p._id)).forEach((v) => out.push(mk(v.stock, { variantId: v._id, sku: v.sku, variantLabel: v.label })));
    else out.push(mk(p.stock, { variantId: null, sku: p.sku, variantLabel: '' }));
  });
  const filtered = ['out', 'low', 'ok'].includes(q.filter) ? out.filter((r) => r.status === q.filter) : q.filter === 'restock' ? out.filter((r) => r.status !== 'ok') : out;
  return { all: out, filtered };
}

exports.list = asyncHandler(async (req, res) => {
  const { all, filtered } = await rows(req.query);
  if (req.query.format === 'csv') {
    return sendCsv(res, 'inventory.csv', filtered, [{ label: 'Product', value: 'name' }, { label: 'Variant', value: 'variantLabel' }, { label: 'SKU', value: 'sku' }, { label: 'Stock', value: 'stock' }, { label: 'Low stock at', value: 'lowStockThreshold' }, { label: 'Status', value: 'status' }]);
  }
  const pg = paginate(req.query, { defaultLimit: 25, maxLimit: 200 });
  return ok(res, { items: filtered.slice(pg.skip, pg.skip + pg.limit), summary: { total: all.length, out: all.filter((r) => r.status === 'out').length, low: all.filter((r) => r.status === 'low').length } }, 'Success', 200, pageMeta(pg, filtered.length));
});

exports.adjust = asyncHandler(async (req, res) => {
  const { productId, variantId, mode, quantity, note } = req.body;
  const product = await Product.findById(productId).select('stock hasVariants').lean();
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.hasVariants && !variantId) throw new ApiError(400, 'Choose which variant to adjust');
  if (!product.hasVariants && variantId) throw new ApiError(400, 'This product has no variants');
  let current = product.stock;
  if (variantId) {
    const v = await ProductVariant.findOne({ _id: variantId, product: productId }).select('stock').lean();
    if (!v) throw new ApiError(404, 'Variant not found');
    current = v.stock;
  }
  const delta = mode === 'add' ? quantity : mode === 'remove' ? -quantity : quantity - current;
  if (!delta) return ok(res, { stock: current }, 'Stock unchanged');
  const result = await inventory.adjust({ productId, variantId: variantId || null, delta, type: mode === 'add' ? 'restock' : 'adjustment', note, admin: req.admin._id });
  return ok(res, { stock: result.after }, 'Stock updated');
});

exports.history = asyncHandler(async (req, res) => {
  const pg = paginate(req.query, { defaultLimit: 30, maxLimit: 100 });
  const filter = {};
  if (isObjectId(req.query.productId)) filter.product = req.query.productId;
  if (isObjectId(req.query.variantId)) filter.variant = req.query.variantId;
  if (req.query.type) filter.type = String(req.query.type);
  const [items, total] = await Promise.all([
    Inventory.find(filter).populate('product', 'name').populate('variant', 'label').populate('admin', 'name').populate('order', 'orderNumber').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Inventory.countDocuments(filter),
  ]);
  ok(res, { items }, 'Success', 200, pageMeta(pg, total));
});
