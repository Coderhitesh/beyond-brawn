import { BarChart3, FileText, Image as ImageIcon, LayoutDashboard, Megaphone, Package, Settings, ShieldCheck, ShoppingCart, Star, Tag, Users } from 'lucide-react';

// perm: any one of these permissions shows the item.
export const NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, perm: ['dashboard.view'], exact: true },
  {
    label: 'Products', icon: Package,
    children: [
      { label: 'All products', href: '/admin/products', perm: ['products.view', 'products.manage'], exact: true },
      { label: 'Add product', href: '/admin/products/new', perm: ['products.manage'] },
      { label: 'Categories', href: '/admin/products/categories', perm: ['catalog.manage'] },
      { label: 'Subcategories', href: '/admin/products/subcategories', perm: ['catalog.manage'] },
      { label: 'Brands', href: '/admin/products/brands', perm: ['catalog.manage'] },
      { label: 'Attributes (variants)', href: '/admin/products/attributes', perm: ['catalog.manage'] },
      { label: 'Inventory', href: '/admin/products/inventory', perm: ['inventory.view', 'inventory.manage'] },
    ],
  },
  {
    label: 'Orders', icon: ShoppingCart, perm: ['orders.view', 'orders.manage'],
    children: [
      { label: 'All orders', href: '/admin/orders', exact: true },
      { label: 'To process', href: '/admin/orders?status=Confirmed' },
      { label: 'Processing', href: '/admin/orders?status=Processing' },
      { label: 'Shipped', href: '/admin/orders?status=Shipped' },
      { label: 'Delivered', href: '/admin/orders?status=Delivered' },
      { label: 'Cancelled', href: '/admin/orders?status=Cancelled' },
      { label: 'Refunds', href: '/admin/orders?refunds=true' },
    ],
  },
  { label: 'Customers', href: '/admin/customers', icon: Users, perm: ['customers.view', 'customers.manage'] },
  {
    label: 'Coupons', icon: Tag, perm: ['coupons.manage'],
    children: [
      { label: 'Coupon list', href: '/admin/coupons', exact: true },
      { label: 'Usage statistics', href: '/admin/coupons/usage' },
    ],
  },
  { label: 'Reviews', href: '/admin/reviews', icon: Star, perm: ['reviews.manage'] },
  { label: 'Banners', href: '/admin/banners', icon: ImageIcon, perm: ['banners.manage'] },
  {
    label: 'Content', icon: FileText,
    children: [
      { label: 'Pages', href: '/admin/content/pages', perm: ['content.manage'] },
      { label: 'FAQ', href: '/admin/content/faqs', perm: ['content.manage'] },
      { label: 'Blog', href: '/admin/content/blogs', perm: ['content.manage'] },
      { label: 'Blog categories', href: '/admin/content/blog-categories', perm: ['content.manage'] },
      { label: 'Messages', href: '/admin/content/messages', perm: ['messages.manage'] },
    ],
  },
  {
    label: 'Marketing', icon: Megaphone,
    children: [
      { label: 'Newsletter', href: '/admin/marketing/newsletter', perm: ['marketing.manage'] },
      { label: 'Email templates', href: '/admin/marketing/email-templates', perm: ['marketing.manage', 'settings.manage'] },
    ],
  },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3, perm: ['reports.view'] },
  { label: 'Settings', href: '/admin/settings', icon: Settings, perm: ['settings.manage'] },
  {
    label: 'Admin users', icon: ShieldCheck, perm: ['admins.manage'],
    children: [
      { label: 'Admins', href: '/admin/admin-users', exact: true },
      { label: 'Roles and permissions', href: '/admin/admin-users/roles' },
    ],
  },
];
