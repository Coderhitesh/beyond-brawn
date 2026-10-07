'use client';
import ResourceManager from '@/components/admin/ResourceManager';

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'slug', label: 'URL slug', hint: 'Leave empty to create it from the name' },
];
const columns = [
  { key: 'name', label: 'Category', render: (r) => <span className="font-semibold">{r.name}</span> },
  { key: 'slug', label: 'URL', render: (r) => <span className="text-mute">/blog?category={r.slug}</span> },
];

export default function Page() {
  return <ResourceManager title="Blog categories" crumbs={[{ label: 'Content' }, { label: 'Blog categories' }]} endpoint="/blog-categories" perm="content.manage" singular="category" limit={100} columns={columns} fields={fields} width="max-w-md" />;
}
