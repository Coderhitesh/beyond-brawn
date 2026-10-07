const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/respond');
const { Review, OrderItem, Order, Product } = require('../models');
const uploadService = require('../services/upload.service');
const { notifyAdmin } = require('../services/notification.service');

// A customer may review a product once it has been delivered to them.
async function deliveredOrderFor(userId, productId) {
  const items = await OrderItem.find({ user: userId, product: productId }).select('order').lean();
  if (!items.length) return null;
  return Order.findOne({ _id: { $in: items.map((i) => i.order) }, user: userId, status: 'Delivered' }).select('_id').lean();
}

exports.eligibility = asyncHandler(async (req, res) => {
  const [existing, order] = await Promise.all([Review.findOne({ user: req.user._id, product: req.params.productId }).lean(), deliveredOrderFor(req.user._id, req.params.productId)]);
  ok(res, { canReview: Boolean(order) && !existing, hasPurchased: Boolean(order), existing: existing ? { rating: existing.rating, title: existing.title, comment: existing.comment, status: existing.status } : null });
});

exports.create = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment, images } = req.body;
  const product = await Product.findOne({ _id: productId, isActive: true }).select('name').lean();
  if (!product) throw new ApiError(404, 'Product not found');
  const order = await deliveredOrderFor(req.user._id, productId);
  if (!order) throw new ApiError(403, 'You can review a product after it has been delivered to you', null, 'NOT_VERIFIED_PURCHASE');
  if (await Review.exists({ user: req.user._id, product: productId })) throw new ApiError(409, 'You have already reviewed this product', null, 'DUPLICATE');
  const review = await Review.create({ product: productId, user: req.user._id, order: order._id, rating, title, comment, images: images || [], status: 'pending', isVerifiedPurchase: true });
  notifyAdmin('new_review', 'New review', `${req.user.name} rated ${product.name} ${rating}/5`, '/admin/reviews?status=pending');
  created(res, { review }, 'Thanks. Your review will appear once it is approved.');
});

exports.mine = asyncHandler(async (req, res) => ok(res, { reviews: await Review.find({ user: req.user._id }).populate('product', 'name slug thumbnail').sort({ createdAt: -1 }).lean() }));

exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose an image to upload');
  const image = await uploadService.uploadImage(req.file, 'reviews');
  created(res, { url: image.url }, 'Image uploaded');
});
