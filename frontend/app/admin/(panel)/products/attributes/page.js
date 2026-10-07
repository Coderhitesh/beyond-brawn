'use client';
import ResourceManager from '@/components/admin/ResourceManager';

const fields = [
  { name: 'name', label: 'Attribute name', required: true, placeholder: 'Flavor', full: true },
  { name: 'values', label: 'Values', type: 'list', required: true, hint: 'One per line, for example: Double Chocolate' },
];
const columns = [
  { key: 'name', label: 'Attribute', render: (r) => <span className="font-semibold">{r.name}</span> },
  { key: 'values', label: 'Values', render: (r) => <span className="text-mute">{(r.values || []).join(', ')}</span> },
];

export default function Page() {
  return <ResourceManager title="Attributes" text="Reusable option lists such as Flavor and Size. Pick them in a product's Variants tab to build its variants." crumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'Attributes' }]} endpoint="/attributes" perm="catalog.manage" singular="attribute" limit={100} columns={columns} fields={fields} />;
}
