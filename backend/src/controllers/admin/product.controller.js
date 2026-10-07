const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok, created } = require('../../utils/respond');
const { paginate, pageMeta, escapeRegex, isObjectId, sendCsv } = require('../../utils/helpers');
const { richText } = require('../../utils/sanitize');
const { Product, ProductVariant, OrderItem, Cart, Wishlist, Review } = require('../../models');
const productService = require('../../services/product.service');
const uploadService = require('../../services/upload.service');

const clean = (body) => (body.description !== undefined ? { ...body, description: richText(body.description) } : body);

function buildFilter(q) {
  const filter = {};
  if (q.q) {
    const rx = new RegExp(escapeRegex(String(q.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { tags: rx }];
  }
  if (isObjectId(q.category)) filter.category = q.category;
  if (isObjectId(q.brand)) filter.brand = q.brand;
  if (q.status === 'active') filter.isActive = true;
  if (q.status === 'inactive') filter.isActive = false;
  if (q.stock === 'out') filter.stock = { $lte: 0 };
  if (q.stock === 'low') filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
  if (q.stock === 'in') filter.stock = { $gt: 0 };
  ['isFeatured', 'isBestSeller', 'isNewArrival'].forEach((f) => {
    if (q[f] === 'true') filter[f] = true;
  });
  return filter;
}
const SORTS = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, name: { name: 1 }, 'price-asc': { price: 1 }, 'price-desc': { price: -1 }, 'stock-asc': { stock: 1 }, sold: { soldCount: -1 } };

exports.list = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const sort = SORTS[req.query.sort] || SORTS.newest;
  if (req.query.format === 'csv') {
    const rows = await Product.find(filter).select('+costPrice').populate('category', 'name').populate('brand', 'name').sort(sort).limit(5000).lean();
    return sendCsv(res, 'products.csv', rows, [
      { label: 'Name', value: 'name' }, { label: 'SKU', value: 'sku' }, { label: 'Category', value: (r) => r.category && r.category.name }, { label: 'Brand', value: (r) => r.brand && r.brand.name },
      { label: 'MRP', value: 'mrp' }, { label: 'Price', value: 'price' }, { label: 'Cost', value: 'costPrice' }, { label: 'Stock', value: 'stock' }, { label: 'Sold', value: 'soldCount' }, { label: 'Active', value: (r) => (r.isActive ? 'Yes' : 'No') },
    ]);
  }
  const pg = paginate(req.query, { defaultLimit: 20, maxLimit: 100 });
  const [items, total] = await Promise.all([
    Product.find(filter).select('name slug sku thumbnail mrp price stock lowStockThreshold hasVariants isActive isFeatured isBestSeller isNewArrival soldCount ratingAverage category brand createdAt').populate('category', 'name').populate('brand', 'name').sort(sort).skip(pg.skip).limit(pg.limit).lean(),
    Product.countDocuments(filter),
  ]);
  return ok(res, { items }, 'Success', 200, pageMeta(pg, total));
});

exports.get = asyncHandler(async (req, res) => ok(res, await productService.getAdminProduct(req.params.id)));
exports.create = asyncHandler(async (req, res) => created(res, await productService.saveProduct(clean(req.body), { adminId: req.admin._id }), 'Product created'));
exports.update = asyncHandler(async (req, res) => ok(res, await productService.saveProduct(clean(req.body), { id: req.params.id, adminId: req.admin._id }), 'Product saved'));

async function removeProduct(id) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  // Products that were ever ordered are archived, not deleted, so past orders and invoices stay valid.
  if (await OrderItem.exists({ product: id })) {
    product.isActive = false;
    await product.save();
    return 'archived';
  }
  await Promise.all([
    ...product.images.map((i) => uploadService.removeImage(i.publicId)),
    ProductVariant.deleteMany({ product: id }),
    Review.deleteMany({ product: id }),
    Cart.updateMany({}, { $pull: { items: { product: id } } }),
    Wishlist.updateMany({}, { $pull: { products: id } }),
  ]);
  await product.deleteOne();
  return 'deleted';
}

exports.remove = asyncHandler(async (req, res) => {
  const result = await removeProduct(req.params.id);
  ok(res, { result }, result === 'archived' ? 'Product has past orders, so it was disabled instead of deleted' : 'Product deleted');
});

exports.bulk = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  const flags = { activate: { isActive: true }, deactivate: { isActive: false }, feature: { isFeatured: true }, unfeature: { isFeatured: false }, bestSeller: { isBestSeller: true }, notBestSeller: { isBestSeller: false }, newArrival: { isNewArrival: true }, notNewArrival: { isNewArrival: false } };
  if (flags[action]) {
    const r = await Product.updateMany({ _id: { $in: ids } }, flags[action]);
    return ok(res, { modified: r.modifiedCount }, `${r.modifiedCount} product(s) updated`);
  }
  if (action === 'delete') {
    const results = [];
    for (const id of ids) results.push(await removeProduct(id).catch(() => 'skipped')); // eslint-disable-line no-await-in-loop
    return ok(res, { results }, `${results.filter((r) => r === 'deleted').length} deleted, ${results.filter((r) => r === 'archived').length} disabled`);
  }
  throw new ApiError(400, 'Unknown bulk action');
});

exports.upload = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw new ApiError(400, 'Choose at least one image');
  const folder = ['products', 'banners', 'blog', 'categories', 'brands', 'misc'].includes(req.query.folder) ? req.query.folder : 'misc';
  created(res, { images: await uploadService.uploadImages(req.files, folder) }, 'Uploaded');
});

exports.deleteUpload = asyncHandler(async (req, res) => {
  await uploadService.removeImage(String(req.body.publicId || ''));
  ok(res, {}, 'Image removed');
});
