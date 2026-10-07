const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/respond');
const { paginate, pageMeta } = require('../utils/helpers');
const { Blog, BlogCategory, FAQ, Page, Newsletter, ContactMessage } = require('../models');
const settings = require('../services/settings.service');
const shipping = require('../services/shipping.service');
const email = require('../services/email.service');
const { notifyAdmin } = require('../services/notification.service');
const { activeBanners } = require('./catalog.controller');

exports.settings = asyncHandler(async (req, res) => ok(res, { settings: await settings.getPublic() }));

exports.banners = asyncHandler(async (req, res) => ok(res, { banners: await activeBanners(req.query.placement ? String(req.query.placement) : undefined) }));

exports.blogs = asyncHandler(async (req, res) => {
  const pg = paginate(req.query, { defaultLimit: 9, maxLimit: 30 });
  const filter = { isPublished: true };
  if (req.query.category) {
    const cat = await BlogCategory.findOne({ slug: String(req.query.category) }).lean();
    filter.category = cat ? cat._id : null;
  }
  if (req.query.tag) filter.tags = String(req.query.tag);
  const [blogs, total, categories] = await Promise.all([
    Blog.find(filter).select('-content').populate('category', 'name slug').sort({ publishedAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Blog.countDocuments(filter),
    BlogCategory.find().sort('name').lean(),
  ]);
  ok(res, { blogs, categories }, 'Success', 200, pageMeta(pg, total));
});

exports.blog = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true }).populate('category', 'name slug').lean();
  if (!blog) throw new ApiError(404, 'Article not found', null, 'NOT_FOUND');
  const related = await Blog.find({ isPublished: true, _id: { $ne: blog._id }, ...(blog.category ? { category: blog.category._id } : {}) })
    .select('title slug excerpt coverImage publishedAt readMinutes')
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();
  ok(res, { blog, related });
});

exports.faqs = asyncHandler(async (req, res) => ok(res, { faqs: await FAQ.find({ isActive: true }).sort({ category: 1, sortOrder: 1 }).lean() }));

exports.page = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!page) throw new ApiError(404, 'Page not found', null, 'NOT_FOUND');
  ok(res, { page });
});

exports.subscribe = asyncHandler(async (req, res) => {
  await Newsletter.updateOne({ email: req.body.email }, { $set: { isSubscribed: true }, $setOnInsert: { source: 'website' } }, { upsert: true });
  ok(res, {}, 'Subscribed. Watch your inbox for offers and training tips.');
});

exports.contact = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.create(req.body);
  email.adminRecipient().then((to) => email.queue('contactNotification', to, req.body, { replyTo: req.body.email }));
  notifyAdmin('contact_message', 'New contact message', `${msg.name}: ${(msg.subject || msg.message).slice(0, 80)}`, '/admin/content/messages');
  created(res, {}, 'Message sent. We reply within one working day.');
});

exports.shippingMethods = asyncHandler(async (req, res) => ok(res, await shipping.getMethods(Number(req.query.amount) || 0)));
exports.checkPincode = asyncHandler(async (req, res) => ok(res, await shipping.checkPincode(req.query.pincode)));
