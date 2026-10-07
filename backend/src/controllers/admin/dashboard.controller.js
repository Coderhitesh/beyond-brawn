const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const { Order, User, Product, ProductVariant } = require('../../models');
const { TZ, startOfDayIST, startOfMonthIST, addDays } = require('../../utils/time');

const PAID = { paymentStatus: { $in: ['paid', 'refund_initiated'] } };
const sum = async (match) => {
  const [r] = await Order.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }]);
  return r || { total: 0, count: 0 };
};

exports.overview = asyncHandler(async (req, res) => {
  const today = startOfDayIST();
  const month = startOfMonthIST();
  const from = addDays(today, -29);

  const [all, day, mon, statusCounts, customers, products, lowProducts, lowVariants, series, topProducts, recentOrders] = await Promise.all([
    sum(PAID),
    sum({ ...PAID, placedAt: { $gte: today } }),
    sum({ ...PAID, placedAt: { $gte: month } }),
    Order.aggregate([{ $match: { placedAt: { $ne: null } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments({ isEmailVerified: true }),
    Product.countDocuments({}),
    Product.aggregate([{ $match: { hasVariants: false, $expr: { $lte: ['$stock', '$lowStockThreshold'] } } }, { $sort: { stock: 1 } }, { $limit: 8 }, { $project: { name: 1, sku: 1, stock: 1, lowStockThreshold: 1, thumbnail: 1 } }]),
    ProductVariant.aggregate([
      { $match: { isActive: true } },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $match: { $expr: { $lte: ['$stock', '$p.lowStockThreshold'] } } },
      { $sort: { stock: 1 } },
      { $limit: 8 },
      { $project: { _id: '$p._id', name: { $concat: ['$p.name', ' (', { $ifNull: ['$label', '$sku'] }, ')'] }, sku: 1, stock: 1, lowStockThreshold: '$p.lowStockThreshold', thumbnail: '$p.thumbnail' } },
    ]),
    Order.aggregate([
      { $match: { placedAt: { $gte: from }, paymentStatus: { $in: ['paid', 'refund_initiated', 'refunded'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt', timezone: TZ } }, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
    ]),
    Product.find({ soldCount: { $gt: 0 } }).select('name slug sku thumbnail soldCount price stock').sort({ soldCount: -1 }).limit(6).lean(),
    Order.find({ placedAt: { $ne: null } }).select('orderNumber customer.name pricing.total status paymentStatus placedAt itemCount').sort({ placedAt: -1 }).limit(8).lean(),
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
  const totalOrders = statusCounts.reduce((s, x) => s + x.count, 0);
  const map = new Map(series.map((s) => [s._id, s]));
  const chart = [];
  for (let i = 0; i < 30; i += 1) {
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(addDays(from, i));
    const row = map.get(key);
    chart.push({ date: key, revenue: row ? Math.round(row.revenue) : 0, orders: row ? row.orders : 0 });
  }
  const lowStock = [...lowProducts, ...lowVariants].sort((a, b) => a.stock - b.stock).slice(0, 10);

  ok(res, {
    stats: {
      totalSales: all.total,
      todaySales: day.total,
      todayOrders: day.count,
      monthlySales: mon.total,
      monthlyOrders: mon.count,
      totalOrders,
      pendingOrders: (byStatus.Confirmed || 0) + (byStatus.Processing || 0) + (byStatus.Packed || 0),
      shippedOrders: (byStatus.Shipped || 0) + (byStatus['Out for Delivery'] || 0),
      completedOrders: byStatus.Delivered || 0,
      cancelledOrders: (byStatus.Cancelled || 0) + (byStatus.Refunded || 0),
      totalCustomers: customers,
      totalProducts: products,
      lowStockProducts: lowStock.length,
    },
    ordersByStatus: byStatus,
    chart,
    topProducts,
    recentOrders,
    lowStock,
  });
});
