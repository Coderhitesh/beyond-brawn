'use client';
import ResourceManager from '@/components/admin/ResourceManager';
import { SEO_FIELDS } from '@/components/admin/FormFields';
import { ActiveBadge } from '@/components/admin/ui';

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'slug', label: 'URL slug', hint: 'Leave empty to create it from the name' },
  { name: 'description', label: 'Description', type: 'textarea', hint: 'Shown under the category title on the store' },
  { name: 'image', label: 'Image', type: 'image', folder: 'categories' },
  { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'Lower numbers come first' },
  { name: 'isActive', label: 'Visible on the store', type: 'checkbox' },
  { name: 'isFeatured', label: 'Feature on the homepage', type: 'checkbox', full: true },
  ...SEO_FIELDS,
];
const columns = [
  { key: 'name', label: 'Category', render: (r) => <span className="font-semibold">{r.name}</span> },
  { key: 'slug', label: 'URL', render: (r) => <span className="text-mute">/category/{r.slug}</span> },
  { key: 'sortOrder', label: 'Order', align: 'right' },
  { key: 'isFeatured', label: 'Homepage', render: (r) => (r.isFeatured ? 'Featured' : '') },
  { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} yes="Visible" no="Hidden" /> },
];

export default function Page() {
  return <ResourceManager title="Categories" text="Top-level groups in the store menu." crumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'Categories' }]} endpoint="/categories" perm="catalog.manage" singular="category" limit={100} columns={columns} fields={fields} defaults={{ isActive: true, sortOrder: 0 }} />;
}
