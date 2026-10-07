const express = require('express');
const catalog = require('../controllers/catalog.controller');
const cart = require('../controllers/cart.controller');
const wishlist = require('../controllers/wishlist.controller');
const order = require('../controllers/order.controller');
const payment = require('../controllers/payment.controller');
const review = require('../controllers/review.controller');
const content = require('../controllers/content.controller');
const v = require('../validators/shop');
const validate = require('../middlewares/validate');
const { protect, optionalAuth } = require('../middlewares/auth');
const limit = require('../middlewares/rateLimiters');
const upload = require('../middlewares/upload');

const r = () => express.Router();

const products = r();
products.get('/', catalog.products);
products.get('/by-ids', catalog.productsByIds);
products.get('/:slug', catalog.product);
products.get('/:slug/reviews', catalog.productReviews);

const categories = r();
categories.get('/', catalog.categories);
categories.get('/:slug', catalog.category);

const brands = r();
brands.get('/', catalog.brands);

const search = r();
search.get('/suggest', limit.search, catalog.suggest);
search.get('/popular', catalog.popularSearches);

const cartRouter = r();
cartRouter.post('/price', optionalAuth, validate({ body: v.cartPrice }), cart.price);
cartRouter.use(protect);
cartRouter.get('/', cart.get);
cartRouter.delete('/', cart.clear);
cartRouter.post('/items', validate({ body: v.cartAdd }), cart.add);
cartRouter.patch('/items/:itemId', validate({ body: v.cartUpdate }), cart.update);
cartRouter.delete('/items/:itemId', cart.remove);
cartRouter.post('/items/:itemId/wishlist', cart.moveToWishlist);
cartRouter.post('/merge', validate({ body: v.cartMerge }), cart.merge);

const coupons = r();
coupons.use(protect);
coupons.post('/apply', validate({ body: v.coupon }), cart.applyCoupon);
coupons.delete('/', cart.removeCoupon);

const wishlistRouter = r();
wishlistRouter.use(protect);
wishlistRouter.get('/', wishlist.get);
wishlistRouter.post('/toggle', validate({ body: v.wishlist }), wishlist.toggle);
wishlistRouter.delete('/:productId', wishlist.remove);

const orders = r();
orders.post('/checkout', limit.checkout, optionalAuth, validate({ body: v.checkout }), order.checkout);
orders.post('/track', limit.forms, validate({ body: v.trackOrder }), order.track);
orders.get('/', protect, order.list);
orders.get('/:orderNumber', protect, order.detail);
orders.get('/:orderNumber/invoice', protect, order.invoice);
orders.post('/:orderNumber/cancel', protect, validate({ body: v.cancelOrder }), order.cancel);

const payments = r();
payments.post('/verify', limit.checkout, validate({ body: v.verifyPayment }), payment.verify);
payments.post('/failed', limit.checkout, validate({ body: v.paymentFailed }), payment.failed);
// /webhook is mounted in app.js before the JSON body parser.

const reviews = r();
reviews.use(protect);
reviews.get('/mine', review.mine);
reviews.get('/eligibility/:productId', review.eligibility);
reviews.post('/', limit.forms, validate({ body: v.review }), review.create);
reviews.post('/upload', limit.forms, upload.reviewImage, review.uploadImage);

const banners = r();
banners.get('/', content.banners);

const blogs = r();
blogs.get('/', content.blogs);
blogs.get('/:slug', content.blog);

const faqs = r();
faqs.get('/', content.faqs);

const pages = r();
pages.get('/:slug', content.page);

const newsletter = r();
newsletter.post('/subscribe', limit.forms, validate({ body: v.newsletter }), content.subscribe);

const contact = r();
contact.post('/', limit.forms, validate({ body: v.contact }), content.contact);

const settings = r();
settings.get('/', content.settings);

const shipping = r();
shipping.get('/methods', content.shippingMethods);
shipping.get('/check', content.checkPincode);

module.exports = { products, categories, brands, search, cart: cartRouter, coupons, wishlist: wishlistRouter, orders, payments, reviews, banners, blogs, faqs, pages, newsletter, contact, settings, shipping, home: catalog.home, sitemap: catalog.sitemap };
