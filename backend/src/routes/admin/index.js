const router = require('express').Router();
const validate = require('../../middlewares/validate');
const { protectAdmin, can } = require('../../middlewares/auth');
const limit = require('../../middlewares/rateLimiters');
const upload = require('../../middlewares/upload');
const authV = require('../../validators/auth');
const v = require('../../validators/admin');
const crud = require('../../controllers/admin/crud.factory');
const { Category, SubCategory, Brand, Attribute, Coupon, Banner, Blog, BlogCategory, FAQ, Page, Product, CouponUsage } = require('../../models');
const ApiError = require('../../utils/ApiError');

const auth = require('../../controllers/admin/auth.controller');
const dashboard = require('../../controllers/admin/dashboard.controller');
const product = require('../../controllers/admin/product.controller');
const inventory = require('../../controllers/admin/inventory.controller');
const order = require('../../controllers/admin/order.controller');
const customer = require('../../controllers/admin/customer.controller');
const review = require('../../controllers/admin/review.controller');
const settings = require('../../controllers/admin/settings.controller');
const report = require('../../controllers/admin/report.controller');
const adminUser = require('../../controllers/admin/adminUser.controller');
const misc = require('../../controllers/admin/misc.controller');

/* ---------- auth (separate from customer login) ---------- */
router.post('/auth/login', limit.adminLogin, validate({ body: authV.adminLogin }), auth.login);
router.post('/auth/logout', auth.logout);

router.use(protectAdmin);
router.get('/auth/me', auth.me);
router.post('/auth/change-password', validate({ body: authV.changePassword }), auth.changePassword);

router.get('/dashboard', can('dashboard.view'), dashboard.overview);
router.get('/notifications', misc.notifications);
router.post('/notifications/read', misc.readNotifications);

/* ---------- uploads ---------- */
const anyContent = can('products.manage', 'catalog.manage', 'banners.manage', 'content.manage', 'settings.manage');
router.post('/uploads', anyContent, upload.adminImages, product.upload);
router.delete('/uploads', anyContent, product.deleteUpload);

/* ---------- products ---------- */
router.get('/products', can('products.view', 'products.manage'), product.list);
router.post('/products', can('products.manage'), validate({ body: v.productCreate }), product.create);
router.post('/products/bulk', can('products.manage'), validate({ body: v.bulkIds }), product.bulk);
router.get('/products/:id', can('products.view', 'products.manage'), product.get);
router.put('/products/:id', can('products.manage'), validate({ body: v.productUpdate }), product.update);
router.delete('/products/:id', can('products.manage'), product.remove);

/* ---------- inventory ---------- */
router.get('/inventory', can('inventory.view', 'inventory.manage'), inventory.list);
router.get('/inventory/history', can('inventory.view', 'inventory.manage'), inventory.history);
router.post('/inventory/adjust', can('inventory.manage'), validate({ body: v.stockAdjust }), inventory.adjust);

/* ---------- orders ---------- */
router.get('/orders', can('orders.view', 'orders.manage'), order.list);
router.post('/orders/bulk-status', can('orders.manage'), validate({ body: v.bulkIds }), order.bulkStatus);
router.get('/orders/:id', can('orders.view', 'orders.manage'), order.get);
router.get('/orders/:id/invoice', can('orders.view', 'orders.manage'), order.invoice);
router.patch('/orders/:id/status', can('orders.manage'), validate({ body: v.orderStatus }), order.updateStatus);
router.post('/orders/:id/refund', can('refunds.manage'), validate({ body: v.refund }), order.refund);
router.post('/orders/:id/refund/complete', can('refunds.manage'), order.completeRefund);

/* ---------- customers ---------- */
router.get('/customers', can('customers.view', 'customers.manage'), customer.list);
router.get('/customers/:id', can('customers.view', 'customers.manage'), customer.get);
router.patch('/customers/:id/active', can('customers.manage'), customer.setActive);

/* ---------- reviews ---------- */
router.get('/reviews', can('reviews.manage'), review.list);
router.post('/reviews/bulk', can('reviews.manage'), validate({ body: v.bulkIds }), review.bulk);
router.patch('/reviews/:id/status', can('reviews.manage'), validate({ body: v.reviewStatus }), review.setStatus);
router.delete('/reviews/:id', can('reviews.manage'), review.remove);

/* ---------- generic CRUD resources ---------- */
const seo = 'seo';
const resources = [
  {
    path: 'categories', perm: 'catalog.manage', read: ['products.view', 'products.manage', 'catalog.manage', 'coupons.manage'],
    ctrl: crud(Category, {
      label: 'Category', fields: ['name', 'slug', 'description', 'image', 'sortOrder', 'isActive', 'isFeatured', seo], search: ['name'], sort: { sortOrder: 1, name: 1 }, slugFrom: 'name', filters: ['isActive'],
      beforeRemove: async (doc) => {
        if (await Product.exists({ category: doc._id })) throw new ApiError(400, 'Move or delete the products in this category first');
        await SubCategory.deleteMany({ category: doc._id });
      },
    }),
  },
  {
    path: 'subcategories', perm: 'catalog.manage', read: ['products.view', 'products.manage', 'catalog.manage'],
    ctrl: crud(SubCategory, {
      label: 'Subcategory', fields: ['name', 'slug', 'category', 'description', 'image', 'sortOrder', 'isActive', seo], search: ['name'], sort: { sortOrder: 1, name: 1 }, slugFrom: 'name', filters: ['category', 'isActive'], populate: { path: 'category', select: 'name slug' },
      beforeSave: async (data) => {
        if (data.category && !(await Category.exists({ _id: data.category }))) throw new ApiError(400, 'Choose a valid parent category');
      },
      beforeRemove: async (doc) => {
        if (await Product.exists({ subCategory: doc._id })) throw new ApiError(400, 'Move or delete the products in this subcategory first');
      },
    }),
  },
  {
    path: 'brands', perm: 'catalog.manage', read: ['products.view', 'products.manage', 'catalog.manage'],
    ctrl: crud(Brand, {
      label: 'Brand', fields: ['name', 'slug', 'logo', 'description', 'isActive'], search: ['name'], sort: { name: 1 }, slugFrom: 'name', filters: ['isActive'],
      beforeRemove: async (doc) => {
        if (await Product.exists({ brand: doc._id })) throw new ApiError(400, 'This brand is still used by products');
      },
    }),
  },
  { path: 'attributes', perm: 'catalog.manage', read: ['products.view', 'products.manage', 'catalog.manage'], ctrl: crud(Attribute, { label: 'Attribute', fields: ['name', 'slug', 'values'], search: ['name'], sort: { name: 1 }, slugFrom: 'name' }) },
  {
    path: 'coupons', perm: 'coupons.manage', validator: v.coupon,
    ctrl: crud(Coupon, {
      label: 'Coupon', fields: ['code', 'description', 'discountType', 'value', 'minOrderAmount', 'maxDiscount', 'startDate', 'expiryDate', 'usageLimit', 'perUserLimit', 'applicableCategories', 'applicableProducts', 'isActive'], search: ['code', 'description'], filters: ['isActive'],
      beforeRemove: async (doc) => {
        if (await CouponUsage.exists({ coupon: doc._id })) throw new ApiError(400, 'This coupon has been used. Deactivate it instead of deleting it.');
      },
    }),
  },
  { path: 'banners', perm: 'banners.manage', ctrl: crud(Banner, { label: 'Banner', fields: ['title', 'subtitle', 'image', 'mobileImage', 'link', 'buttonText', 'placement', 'sortOrder', 'isActive', 'startDate', 'endDate'], search: ['title'], sort: { placement: 1, sortOrder: 1 }, filters: ['placement', 'isActive'] }) },
  { path: 'faqs', perm: 'content.manage', ctrl: crud(FAQ, { label: 'FAQ', fields: ['question', 'answer', 'category', 'sortOrder', 'isActive'], search: ['question', 'answer'], sort: { category: 1, sortOrder: 1 }, filters: ['isActive', 'category'] }) },
  {
    path: 'blog-categories', perm: 'content.manage',
    ctrl: crud(BlogCategory, {
      label: 'Blog category', fields: ['name', 'slug'], search: ['name'], sort: { name: 1 }, slugFrom: 'name',
      beforeRemove: async (doc) => {
        await Blog.updateMany({ category: doc._id }, { $unset: { category: 1 } });
      },
    }),
  },
  {
    path: 'blogs', perm: 'content.manage',
    ctrl: crud(Blog, {
      label: 'Article', fields: ['title', 'slug', 'excerpt', 'content', 'coverImage', 'category', 'author', 'tags', 'readMinutes', 'isPublished', seo], search: ['title', 'excerpt'], slugFrom: 'title', filters: ['isPublished', 'category'], populate: { path: 'category', select: 'name' }, html: ['content'],
      beforeSave: async (data, existing) => {
        if (data.isPublished && !(existing && existing.publishedAt)) data.publishedAt = new Date(); // eslint-disable-line no-param-reassign
        if (data.content) data.readMinutes = data.readMinutes || Math.max(1, Math.round(data.content.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 220)); // eslint-disable-line no-param-reassign
      },
    }),
  },
  { path: 'pages', perm: 'content.manage', ctrl: crud(Page, { label: 'Page', fields: ['slug', 'title', 'content', 'isActive', seo], search: ['title', 'slug'], sort: { title: 1 }, slugFrom: 'title', html: ['content'] }) },
];

resources.forEach(({ path, perm, read, ctrl, validator }) => {
  const canRead = can(...(read || [perm]));
  const body = validator ? [validate({ body: validator })] : [];
  router.get(`/${path}`, canRead, ctrl.list);
  router.get(`/${path}/:id`, canRead, ctrl.get);
  router.post(`/${path}`, can(perm), ...body, ctrl.create);
  router.put(`/${path}/:id`, can(perm), ...body, ctrl.update);
  router.delete(`/${path}/:id`, can(perm), ctrl.remove);
});

router.get('/coupon-stats', can('coupons.manage'), misc.couponStats);
router.get('/coupon-stats/:id/usage', can('coupons.manage'), misc.couponUsage);

/* ---------- marketing / content extras ---------- */
router.get('/newsletter', can('marketing.manage'), misc.newsletter);
router.delete('/newsletter/:id', can('marketing.manage'), misc.removeSubscriber);
router.get('/email-templates', can('marketing.manage', 'settings.manage'), settings.emailTemplates);
router.get('/email-templates/:key/preview', can('marketing.manage', 'settings.manage'), settings.previewTemplate);
router.post('/email-templates/:key/test', can('marketing.manage', 'settings.manage'), limit.forms, settings.sendTestTemplate);
router.get('/messages', can('messages.manage'), misc.messages);
router.patch('/messages/:id', can('messages.manage'), misc.messageStatus);
router.delete('/messages/:id', can('messages.manage'), misc.removeMessage);

/* ---------- settings ---------- */
router.get('/settings', can('settings.manage'), settings.getAll);
router.put('/settings/:group', can('settings.manage'), settings.update);
router.post('/settings/smtp-test', can('settings.manage'), settings.testSmtp);

/* ---------- reports ---------- */
router.get('/reports/sales', can('reports.view'), report.sales);
router.get('/reports/orders', can('reports.view'), report.orders);
router.get('/reports/products', can('reports.view'), report.products);
router.get('/reports/customers', can('reports.view'), report.customers);

/* ---------- admin users, roles, permissions ---------- */
router.get('/admins', can('admins.manage'), adminUser.listAdmins);
router.post('/admins', can('admins.manage'), validate({ body: v.adminCreate }), adminUser.createAdmin);
router.put('/admins/:id', can('admins.manage'), validate({ body: v.adminUpdate }), adminUser.updateAdmin);
router.delete('/admins/:id', can('admins.manage'), adminUser.removeAdmin);
router.get('/roles', can('admins.manage'), adminUser.listRoles);
router.post('/roles', can('admins.manage'), validate({ body: v.role }), adminUser.createRole);
router.put('/roles/:id', can('admins.manage'), validate({ body: v.role }), adminUser.updateRole);
router.delete('/roles/:id', can('admins.manage'), adminUser.removeRole);
router.get('/permissions', can('admins.manage'), adminUser.listPermissions);

module.exports = router;
