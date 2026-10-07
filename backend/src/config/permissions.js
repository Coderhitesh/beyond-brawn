// Single source of truth for permission keys. Seeded into the Permission collection.
const PERMISSIONS = [
  { key: 'dashboard.view', label: 'View dashboard', group: 'Dashboard' },
  { key: 'products.view', label: 'View products', group: 'Products' },
  { key: 'products.manage', label: 'Create / edit / delete products', group: 'Products' },
  { key: 'catalog.manage', label: 'Manage categories, brands, attributes', group: 'Products' },
  { key: 'inventory.view', label: 'View inventory', group: 'Inventory' },
  { key: 'inventory.manage', label: 'Adjust stock', group: 'Inventory' },
  { key: 'orders.view', label: 'View orders', group: 'Orders' },
  { key: 'orders.manage', label: 'Update order status & tracking', group: 'Orders' },
  { key: 'refunds.manage', label: 'Issue refunds', group: 'Orders' },
  { key: 'customers.view', label: 'View customers', group: 'Customers' },
  { key: 'customers.manage', label: 'Block / unblock customers', group: 'Customers' },
  { key: 'coupons.manage', label: 'Manage coupons', group: 'Marketing' },
  { key: 'marketing.manage', label: 'Newsletter & email templates', group: 'Marketing' },
  { key: 'reviews.manage', label: 'Moderate reviews', group: 'Reviews' },
  { key: 'banners.manage', label: 'Manage banners', group: 'Content' },
  { key: 'content.manage', label: 'Manage pages, FAQ, blog', group: 'Content' },
  { key: 'messages.manage', label: 'Contact messages', group: 'Content' },
  { key: 'settings.manage', label: 'Manage settings', group: 'Settings' },
  { key: 'reports.view', label: 'View reports', group: 'Reports' },
  { key: 'admins.manage', label: 'Manage admin users, roles, permissions', group: 'Admin Users' },
];

const ALL = PERMISSIONS.map((p) => p.key);
const without = (...keys) => ALL.filter((k) => !keys.includes(k));

const DEFAULT_ROLES = [
  { name: 'Super Admin', slug: 'super-admin', description: 'Full access', permissions: ALL, isSystem: true },
  { name: 'Admin', slug: 'admin', description: 'Everything except admin user management', permissions: without('admins.manage'), isSystem: true },
  {
    name: 'Manager', slug: 'manager', description: 'Catalog, orders, customers and reports',
    permissions: ['dashboard.view', 'products.view', 'products.manage', 'catalog.manage', 'inventory.view', 'inventory.manage', 'orders.view', 'orders.manage', 'customers.view', 'coupons.manage', 'reviews.manage', 'reports.view'],
    isSystem: true,
  },
  {
    name: 'Order Manager', slug: 'order-manager', description: 'Order processing and shipping',
    permissions: ['dashboard.view', 'orders.view', 'orders.manage', 'refunds.manage', 'customers.view', 'inventory.view', 'products.view'],
    isSystem: true,
  },
  {
    name: 'Content Manager', slug: 'content-manager', description: 'Banners, pages, blog, FAQ, reviews',
    permissions: ['dashboard.view', 'banners.manage', 'content.manage', 'reviews.manage', 'messages.manage', 'products.view'],
    isSystem: true,
  },
];

module.exports = { PERMISSIONS, ALL_PERMISSIONS: ALL, DEFAULT_ROLES };
