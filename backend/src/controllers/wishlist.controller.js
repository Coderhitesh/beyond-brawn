const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const { Wishlist, Product } = require('../models');
const productService = require('../services/product.service');

async function payload(userId) {
  const wl = await Wishlist.findOne({ user: userId }).lean();
  const ids = wl ? wl.products.map(String).reverse() : [];
  const products = ids.length ? await productService.cards({ _id: { $in: ids } }, {}, 100) : [];
  const rank = new Map(ids.map((id, i) => [id, i]));
  products.sort((a, b) => rank.get(String(a._id)) - rank.get(String(b._id)));
  return { products, ids: products.map((p) => String(p._id)) };
}

exports.get = asyncHandler(async (req, res) => ok(res, await payload(req.user._id)));

exports.toggle = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!(await Product.exists({ _id: productId, isActive: true }))) throw new ApiError(404, 'Product not found');
  const has = await Wishlist.exists({ user: req.user._id, products: productId });
  if (has) await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: productId } });
  else {
    const wl = await Wishlist.findOne({ user: req.user._id }).select('products').lean();
    if (wl && wl.products.length >= 100) throw new ApiError(400, 'Your wishlist is full');
    await Wishlist.updateOne({ user: req.user._id }, { $addToSet: { products: productId } }, { upsert: true });
  }
  ok(res, { ...(await payload(req.user._id)), added: !has }, has ? 'Removed from wishlist' : 'Added to wishlist');
});

exports.remove = asyncHandler(async (req, res) => {
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } });
  ok(res, await payload(req.user._id), 'Removed from wishlist');
});
