const router = require('express').Router();
const c = require('../controllers/user.controller');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');
const { updateProfile } = require('../validators/auth');
const { address } = require('../validators/shop');

router.use(protect);
router.patch('/me', validate({ body: updateProfile }), c.updateProfile);
router.get('/dashboard', c.dashboard);
router.get('/addresses', c.listAddresses);
router.post('/addresses', validate({ body: address }), c.createAddress);
router.put('/addresses/:id', validate({ body: address }), c.updateAddress);
router.delete('/addresses/:id', c.deleteAddress);
router.get('/notifications', c.notifications);
router.post('/notifications/read', c.readNotifications);

module.exports = router;
