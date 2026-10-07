const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const { sendCsv } = require('../../utils/helpers');
const { TZ, dateRange } = require('../../utils/time');
const { Order, OrderItem, User } = require('../../models');

const PAID = ['paid', 'refund_initiated', 'refunded'];
const out = (req, res, name, rows, columns, extra = {}) => (req.query.format === 'csv' ? sendCsv(res, `${name}.csv`, rows, columns) : ok(res, { rows, ...extra }));

exports.sales = asyncHandler(async (req, res) => {
  const { from, to } = dateRange(req.query);
  const unit = req.query.groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
  const rows = await Order.aggregate([
    { $match: { placedAt: { $gte: from, $lt: to }, paymentStatus: { $in: PAID } } },
    {
      $group: {
        _id: { $dateToString: { format: unit, date: '$placedAt', timezone: TZ } },
        orders: { $sum: 1 }, items: { $sum: '$itemCount' }, gross: { $sum: '$pricing.subtotal' }, discounts: { $sum: '$pricing.couponDiscount' }, shipping: { $sum: '$pricing.shipping' }, tax: { $sum: '$pricing.tax' }, revenue: { $sum: '$pricing.total' },
        refunded: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, '$pricing.total', 0] } },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, period: '$_id', orders: 1, items: 1, gross: { $round: ['$gross', 2] }, discounts: { $round: ['$discounts', 2] }, shipping: { $round: ['$shipping', 2] }, tax: { $round: ['$tax', 2] }, revenue: { $round: ['$revenue', 2] }, refunded: { $round: ['$refunded', 2] } } },
  ]);
  const totals = rows.reduce((t, r) => ({ orders: t.orders + r.orders, revenue: t.revenue + r.revenue, discounts: t.discounts + r.discounts, refunded: t.refunded + r.refunded }), { orders: 0, revenue: 0, discounts: 0, refunded: 0 });
  totals.averageOrderValue = totals.orders ? Math.round((totals.revenue / totals.orders) * 100) / 100 : 0;
  out(req, res, 'sales-report', rows, ['period', 'orders', 'items', 'gross', 'discounts', 'shipping', 'tax', 'revenue', 'refunded'].map((k) => ({ label: k, value: k })), { totals });
});

exports.orders = asyncHandler(async (req, res) => {
  const { from, to } = dateRange(req.query);
  const match = { createdAt: { $gte: from, $lt: to }, $nor: [{ status: 'Pending', paymentStatus: 'pending' }] };
  const [byStatus, byPayment, byMethod, byState] = await Promise.all([
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', orders: { $sum: 1 }, value: { $sum: '$pricing.total' } } }, { $sort: { orders: -1 } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$paymentStatus', orders: { $sum: 1 }, value: { $sum: '$pricing.total' } } }]),
    Order.aggregate([{ $match: { ...match, paymentStatus: { $in: PAID } } }, { $group: { _id: { $ifNull: ['$paymentMethod', 'unknown'] }, orders: { $sum: 1 }, value: { $sum: '$pricing.total' } } }, { $sort: { orders: -1 } }]),
    Order.aggregate([{ $match: { ...match, paymentStatus: { $in: PAID } } }, { $group: { _id: '$shippingAddress.state', orders: { $sum: 1 }, value: { $sum: '$pricing.total' } } }, { $sort: { orders: -1 } }, { $limit: 15 }]),
  ]);
  const rows = byStatus.map((r) => ({ status: r._id, orders: r.orders, value: Math.round(r.value) }));
  out(req, res, 'order-report', rows, [{ label: 'status', value: 'status' }, { label: 'orders', value: 'orders' }, { label: 'value', value: 'value' }], {
    byPayment: byPayment.map((r) => ({ paymentStatus: r._id, orders: r.orders, value: Math.round(r.value) })),
    byMethod: byMethod.map((r) => ({ method: r._id, orders: r.orders, value: Math.round(r.value) })),
    byState: byState.map((r) => ({ state: r._id, orders: r.orders, value: Math.round(r.value) })),
  });
});

exports.products = asyncHandler(async (req, res) => {
  const { from, to } = dateRange(req.query);
  const rows = await OrderItem.aggregate([
    { $match: { createdAt: { $gte: from, $lt: to } } },
    { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'o' } },
    { $unwind: '$o' },
    { $match: { 'o.paymentStatus': { $in: ['paid', 'refund_initiated'] } } },
    { $group: { _id: { product: '$product', sku: '$sku' }, name: { $first: '$name' }, variant: { $first: '$variantLabel' }, units: { $sum: '$quantity' }, revenue: { $sum: '$lineTotal' }, orders: { $addToSet: '$order' } } },
    { $project: { _id: 0, productId: '$_id.product', sku: '$_id.sku', name: 1, variant: 1, units: 1, revenue: { $round: ['$revenue', 2] }, orders: { $size: '$orders' } } },
    { $sort: { revenue: -1 } },
    { $limit: 500 },
  ]);
  out(req, res, 'product-report', rows, ['name', 'variant', 'sku', 'units', 'orders', 'revenue'].map((k) => ({ label: k, value: k })));
});

exports.customers = asyncHandler(async (req, res) => {
  const { from, to } = dateRange(req.query);
  const [top, newCustomers, guestOrders] = await Promise.all([
    Order.aggregate([
      { $match: { placedAt: { $gte: from, $lt: to }, paymentStatus: { $in: ['paid', 'refund_initiated'] } } },
      { $group: { _id: '$customer.email', name: { $first: '$customer.name' }, phone: { $first: '$customer.phone' }, orders: { $sum: 1 }, spent: { $sum: '$pricing.total' }, lastOrder: { $max: '$placedAt' } } },
      { $project: { _id: 0, email: '$_id', name: 1, phone: 1, orders: 1, spent: { $round: ['$spent', 2] }, lastOrder: 1 } },
      { $sort: { spent: -1 } },
      { $limit: 200 },
    ]),
    User.countDocuments({ createdAt: { $gte: from, $lt: to }, isEmailVerified: true }),
    Order.countDocuments({ placedAt: { $gte: from, $lt: to }, isGuest: true, paymentStatus: { $in: PAID } }),
  ]);
  out(req, res, 'customer-report', top, ['name', 'email', 'phone', 'orders', 'spent', 'lastOrder'].map((k) => ({ label: k, value: k })), {
    summary: { newCustomers, buyers: top.length, repeatBuyers: top.filter((c) => c.orders > 1).length, guestOrders },
  });
});
