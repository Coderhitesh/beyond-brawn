const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const { paginate, pageMeta } = require('../utils/helpers');
const { Category, SubCategory, Brand, Product, Review, Banner, Blog } = require('../models');
const productService = require('../services/product.service');

async function categoryTree() {
  const [cats, subs] = await Promise.all([Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(), SubCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean()]);
  return cats.map((c) => ({ ...c, subCategories: subs.filter((s) => String(s.category) === String(c._id)) }));
}
const activeBanners = (placement) => {
  const now = new Date();
  return Banner.find({ isActive: true, ...(placement ? { placement } : {}), $and: [{ $or: [{ startDate: null }, { startDate: { $lte: now } }] }, { $or: [{ endDate: null }, { endDate: { $gte: now } }] }] })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();
};
exports.activeBanners = activeBanners;

exports.products = asyncHandler(async (req, res) => {
  const { products, meta, facets, category, subCategory } = await productService.listProducts(req.query);
  ok(res, { products, facets, category, subCategory }, 'Products fetched successfully', 200, meta);
});

exports.product = asyncHandler(async (req, res) => ok(res, await productService.getProductBySlug(req.params.slug), 'Product fetched successfully'));

exports.productsByIds = asyncHandler(async (req, res) => ok(res, { products: await productService.getByIds(String(req.query.ids || '').split(',')) }));

exports.productReviews = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).select('_id').lean();
  if (!product) throw new ApiError(404, 'Product not found');
  const pg = paginate(req.query, { defaultLimit: 6, maxLimit: 30 });
  const filter = { product: product._id, status: 'approved' };
  const sort = req.query.sort === 'highest' ? { rating: -1, createdAt: -1 } : req.query.sort === 'lowest' ? { rating: 1, createdAt: -1 } : { createdAt: -1 };
  const [reviews, total] = await Promise.all([Review.find(filter).populate('user', 'name').sort(sort).skip(pg.skip).limit(pg.limit).lean(), Review.countDocuments(filter)]);
  ok(res, { reviews: reviews.map((r) => ({ id: r._id, rating: r.rating, title: r.title, comment: r.comment, images: r.images, name: r.user ? r.user.name : 'Customer', isVerifiedPurchase: r.isVerifiedPurchase, createdAt: r.createdAt })) }, 'Success', 200, pageMeta(pg, total));
});

exports.categories = asyncHandler(async (req, res) => ok(res, { categories: await categoryTree() }));

exports.category = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!category) throw new ApiError(404, 'Category not found', null, 'NOT_FOUND');
  const subCategories = await SubCategory.find({ category: category._id, isActive: true }).sort({ sortOrder: 1 }).lean();
  ok(res, { category, subCategories });
});

exports.brands = asyncHandler(async (req, res) => ok(res, { brands: await Brand.find({ isActive: true }).sort('name').lean() }));

exports.suggest = asyncHandler(async (req, res) => ok(res, await productService.suggest(req.query.q)));
exports.popularSearches = asyncHandler(async (req, res) => ok(res, { terms: await productService.popularSearches() }));

// One request for the whole homepage keeps the storefront fast.
exports.home = asyncHandler(async (req, res) => {
  const [heroBanners, promoBanners, categories, bestSellers, newArrivals, featured, reviews, blogs] = await Promise.all([
    activeBanners('hero'),
    activeBanners('promo'),
    Category.find({ isActive: true }).sort({ isFeatured: -1, sortOrder: 1 }).limit(8).lean(),
    productService.cards({ isBestSeller: true }, { soldCount: -1 }, 8),
    productService.cards({ isNewArrival: true }, { createdAt: -1 }, 8),
    productService.cards({ isFeatured: true }, { soldCount: -1 }, 8),
    Review.find({ status: 'approved', rating: { $gte: 4 } }).sort({ createdAt: -1 }).limit(6).populate('user', 'name').populate('product', 'name slug').lean(),
    Blog.find({ isPublished: true }).sort({ publishedAt: -1 }).limit(3).select('title slug excerpt coverImage publishedAt readMinutes').lean(),
  ]);
  ok(res, {
    heroBanners,
    promoBanners,
    categories,
    bestSellers: bestSellers.length ? bestSellers : await productService.cards({}, { soldCount: -1 }, 8),
    newArrivals: newArrivals.length ? newArrivals : await productService.cards({}, { createdAt: -1 }, 8),
    featured,
    reviews: reviews.filter((r) => r.product).map((r) => ({ id: r._id, rating: r.rating, title: r.title, comment: r.comment, name: r.user ? r.user.name : 'Customer', product: r.product })),
    blogs,
  });
});

// Slugs for sitemap.xml
exports.sitemap = asyncHandler(async (req, res) => {
  const [products, categories, blogs] = await Promise.all([
    Product.find({ isActive: true }).select('slug updatedAt').lean(),
    Category.find({ isActive: true }).select('slug updatedAt').lean(),
    Blog.find({ isPublished: true }).select('slug updatedAt').lean(),
  ]);
  ok(res, { products, categories, blogs });
});
