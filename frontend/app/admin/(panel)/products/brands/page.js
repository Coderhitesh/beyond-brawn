'use client';
import ResourceManager from '@/components/admin/ResourceManager';
import { ActiveBadge } from '@/components/admin/ui';

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'slug', label: 'URL slug', hint: 'Leave empty to create it from the name' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'logo', label: 'Logo', type: 'image', folder: 'brands' },
  { name: 'isActive', label: 'Active', type: 'checkbox', full: true },
];
const columns = [
  { key: 'name', label: 'Brand', render: (r) => <span className="font-semibold">{r.name}</span> },
  { key: 'description', label: 'Description', render: (r) => <span className="line-clamp-1 text-mute">{r.description}</span> },
  { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} /> },
];

export default function Page() {
  return <ResourceManager title="Brands" crumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'Brands' }]} endpoint="/brands" perm="catalog.manage" singular="brand" limit={100} columns={columns} fields={fields} defaults={{ isActive: true }} />;
}
