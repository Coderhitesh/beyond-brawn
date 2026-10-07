const router = require('express').Router();
const shop = require('./shop.routes');

const { isDbReady } = require('../config/db');

router.get('/health', (req, res) => res.status(isDbReady() ? 200 : 503).json({ success: isDbReady(), message: isDbReady() ? 'OK' : 'Database not connected', data: { uptime: process.uptime(), database: isDbReady() ? 'connected' : 'disconnected' } }));

// Without this, every request would hang while Mongoose waits for a connection that is not there.
router.use((req, res, next) => (isDbReady() ? next() : res.status(503).json({ success: false, message: 'The database is not reachable right now. Try again in a moment.', error: { code: 'DB_UNAVAILABLE' } })));

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/products', shop.products);
router.use('/categories', shop.categories);
router.use('/brands', shop.brands);
router.use('/search', shop.search);
router.use('/cart', shop.cart);
router.use('/coupons', shop.coupons);
router.use('/wishlist', shop.wishlist);
router.use('/orders', shop.orders);
router.use('/payments', shop.payments);
router.use('/reviews', shop.reviews);
router.use('/banners', shop.banners);
router.use('/blogs', shop.blogs);
router.use('/faqs', shop.faqs);
router.use('/pages', shop.pages);
router.use('/newsletter', shop.newsletter);
router.use('/contact', shop.contact);
router.use('/settings', shop.settings);
router.use('/shipping', shop.shipping);
router.get('/home', shop.home);
router.get('/sitemap', shop.sitemap);
router.use('/admin', require('./admin'));

module.exports = router;
