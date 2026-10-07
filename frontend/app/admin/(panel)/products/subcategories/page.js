'use client';
import ResourceManager from '@/components/admin/ResourceManager';
import { SEO_FIELDS, useOptions } from '@/components/admin/FormFields';
import { ActiveBadge } from '@/components/admin/ui';

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'category', label: 'Parent category', type: 'asyncSelect', endpoint: '/categories', placeholder: 'Choose category', required: true },
  { name: 'slug', label: 'URL slug', hint: 'Leave empty to create it from the name' },
  { name: 'sortOrder', label: 'Sort order', type: 'number' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'isActive', label: 'Visible on the store', type: 'checkbox', full: true },
  ...SEO_FIELDS,
];
const columns = [
  { key: 'name', label: 'Subcategory', render: (r) => <span className="font-semibold">{r.name}</span> },
  { key: 'category', label: 'Category', render: (r) => (r.category ? r.category.name : '') },
  { key: 'sortOrder', label: 'Order', align: 'right' },
  { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} yes="Visible" no="Hidden" /> },
];

export default function Page() {
  const categories = useOptions('/categories');
  return <ResourceManager title="Subcategories" text="Second-level groups shown inside each category." crumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'Subcategories' }]} endpoint="/subcategories" perm="catalog.manage" singular="subcategory" limit={100} columns={columns} fields={fields} defaults={{ isActive: true, sortOrder: 0 }} filters={[{ key: 'category', label: 'All categories', options: categories }]} />;
}
