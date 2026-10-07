const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const { Cart, Product, ProductVariant, Wishlist } = require('../models');
const pricing = require('../services/pricing.service');

const getCart = async (userId) => (await Cart.findOne({ user: userId })) || Cart.create({ user: userId, items: [] });

async function respond(res, cart, message = 'Success', extra = {}) {
  const priced = await pricing.priceCart(cart.items.map((i) => ({ _id: i._id, product: i.product, variant: i.variant, quantity: i.quantity })), { couponCode: cart.couponCode, userId: cart.user });
  let couponError = priced.couponError;
  if (cart.couponCode && couponError) {
    cart.couponCode = null; // an invalid coupon never lingers on the cart
    await cart.save();
  } else couponError = null;
  ok(res, { cart: { ...priced, couponError, ...extra } }, message);
}

// Checks the product / variant exists and returns the stock available for it.
async function assertPurchasable(productId, variantId) {
  const product = await Product.findOne({ _id: productId, isActive: true }).select('hasVariants stock name').lean();
  if (!product) throw new ApiError(404, 'This product is no longer available');
  if (!product.hasVariants) return { stock: product.stock, variantId: null };
  if (!variantId) throw new ApiError(400, 'Choose an option before adding to cart', null, 'VARIANT_REQUIRED');
  const variant = await ProductVariant.findOne({ _id: variantId, product: productId, isActive: true }).select('stock').lean();
  if (!variant) throw new ApiError(404, 'This option is no longer available');
  return { stock: variant.stock, variantId };
}

exports.get = asyncHandler(async (req, res) => respond(res, await getCart(req.user._id)));

exports.add = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const { stock, variantId } = await assertPurchasable(productId, req.body.variantId);
  if (stock <= 0) throw new ApiError(409, 'This item is out of stock', null, 'OUT_OF_STOCK');
  const cart = await getCart(req.user._id);
  const line = cart.items.find((i) => String(i.product) === productId && String(i.variant || '') === String(variantId || ''));
  const wanted = Math.min(20, (line ? line.quantity : 0) + quantity);
  if (wanted > stock) throw new ApiError(409, `Only ${stock} left in stock`, { stock }, 'INSUFFICIENT_STOCK');
  if (line) line.quantity = wanted;
  else {
    if (cart.items.length >= 50) throw new ApiError(400, 'Your cart is full');
    cart.items.push({ product: productId, variant: variantId, quantity: wanted });
  }
  await cart.save();
  await respond(res, cart, 'Added to cart');
});

exports.update = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  const line = cart.items.id(req.params.itemId);
  if (!line) throw new ApiError(404, 'Item not found in cart');
  const { stock } = await assertPurchasable(String(line.product), line.variant ? String(line.variant) : null);
  if (req.body.quantity > stock) throw new ApiError(409, stock > 0 ? `Only ${stock} left in stock` : 'This item is out of stock', { stock }, 'INSUFFICIENT_STOCK');
  line.quantity = req.body.quantity;
  await cart.save();
  await respond(res, cart, 'Cart updated');
});

exports.remove = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  cart.items.pull(req.params.itemId);
  await cart.save();
  await respond(res, cart, 'Removed from cart');
});

exports.clear = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  cart.items = [];
  cart.couponCode = null;
  await cart.save();
  await respond(res, cart, 'Cart cleared');
});

// Moves a line to the wishlist ("save for later").
exports.moveToWishlist = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  const line = cart.items.id(req.params.itemId);
  if (!line) throw new ApiError(404, 'Item not found in cart');
  await Wishlist.updateOne({ user: req.user._id }, { $addToSet: { products: line.product } }, { upsert: true });
  cart.items.pull(line._id);
  await cart.save();
  await respond(res, cart, 'Moved to wishlist');
});

// Merges a guest (browser) cart into the account cart after login.
exports.merge = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  for (const it of req.body.items) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { stock, variantId } = await assertPurchasable(it.productId, it.variantId);
      if (stock > 0) {
        const line = cart.items.find((i) => String(i.product) === it.productId && String(i.variant || '') === String(variantId || ''));
        const wanted = Math.min(20, stock, (line ? line.quantity : 0) + it.quantity);
        if (line) line.quantity = wanted;
        else if (cart.items.length < 50) cart.items.push({ product: it.productId, variant: variantId, quantity: wanted });
      }
    } catch (e) {
      /* skip items that are no longer purchasable */
    }
  }
  await cart.save();
  await respond(res, cart, 'Cart updated');
});

exports.applyCoupon = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  if (!cart.items.length) throw new ApiError(400, 'Add items to your cart before applying a coupon');
  const code = req.body.code.toUpperCase();
  const priced = await pricing.priceCart(cart.items.map((i) => ({ _id: i._id, product: i.product, variant: i.variant, quantity: i.quantity })), { couponCode: code, userId: req.user._id, email: req.user.email });
  if (priced.couponError) throw new ApiError(400, priced.couponError, null, 'COUPON_INVALID');
  cart.couponCode = code;
  await cart.save();
  ok(res, { cart: priced }, `Coupon ${code} applied`);
});

exports.removeCoupon = asyncHandler(async (req, res) => {
  const cart = await getCart(req.user._id);
  cart.couponCode = null;
  await cart.save();
  await respond(res, cart, 'Coupon removed');
});

// Prices an arbitrary item list. Used by guest carts, Buy Now and the checkout summary.
exports.price = asyncHandler(async (req, res) => {
  const { items, couponCode, shippingMethod } = req.body;
  const priced = await pricing.priceCart(items, { couponCode, userId: req.user && req.user._id, email: req.user && req.user.email, methodCode: shippingMethod });
  ok(res, { cart: priced });
});
