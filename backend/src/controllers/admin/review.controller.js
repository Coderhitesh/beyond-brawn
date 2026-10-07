const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok } = require('../../utils/respond');
const { paginate, pageMeta, isObjectId } = require('../../utils/helpers');
const { Review } = require('../../models');
const productService = require('../../services/product.service');

exports.list = asyncHandler(async (req, res) => {
  const pg = paginate(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};
  if (['pending', 'approved', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
  if (isObjectId(req.query.product)) filter.product = req.query.product;
  if (req.query.rating) filter.rating = Number(req.query.rating);
  const [items, total, pending] = await Promise.all([
    Review.find(filter).populate('user', 'name email').populate('product', 'name slug thumbnail').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Review.countDocuments(filter),
    Review.countDocuments({ status: 'pending' }),
  ]);
  ok(res, { items, pending }, 'Success', 200, pageMeta(pg, total));
});

exports.setStatus = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!review) throw new ApiError(404, 'Review not found');
  await productService.recalcRating(review.product);
  ok(res, { item: review }, `Review ${req.body.status}`);
});

exports.bulk = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  const reviews = await Review.find({ _id: { $in: ids } }).select('product').lean();
  if (action === 'delete') await Review.deleteMany({ _id: { $in: ids } });
  else if (['approved', 'rejected'].includes(action)) await Review.updateMany({ _id: { $in: ids } }, { status: action });
  else throw new ApiError(400, 'Unknown bulk action');
  await Promise.all([...new Set(reviews.map((r) => String(r.product)))].map((id) => productService.recalcRating(id)));
  ok(res, {}, `${reviews.length} review(s) updated`);
});

exports.remove = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  await productService.recalcRating(review.product);
  ok(res, {}, 'Review deleted');
});
