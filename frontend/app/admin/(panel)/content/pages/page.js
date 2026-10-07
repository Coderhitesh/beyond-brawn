'use client';
import ResourceManager from '@/components/admin/ResourceManager';
import { SEO_FIELDS } from '@/components/admin/FormFields';
import { ActiveBadge } from '@/components/admin/ui';
import { formatDate } from '@/utils/format';

// These slugs are wired to routes in the storefront.
const ROUTES = { about: '/about', 'privacy-policy': '/privacy-policy', 'terms-and-conditions': '/terms-and-conditions', 'refund-policy': '/refund-policy', 'shipping-policy': '/shipping-policy', 'return-policy': '/return-policy' };
const fields = [
  { name: 'title', label: 'Page title', required: true },
  { name: 'slug', label: 'URL slug', hint: `Store pages: ${Object.keys(ROUTES).join(', ')}. Do not rename these.` },
  { name: 'content', label: 'Content', type: 'richtext' },
  { name: 'isActive', label: 'Published', type: 'checkbox', full: true },
  ...SEO_FIELDS,
];
const columns = [
  { key: 'title', label: 'Page', render: (r) => <span className="font-semibold">{r.title}</span> },
  { key: 'slug', label: 'URL', render: (r) => <span className="text-mute">{ROUTES[r.slug] || `(${r.slug}: not linked to a store page)`}</span> },
  { key: 'updatedAt', label: 'Last updated', render: (r) => formatDate(r.updatedAt) },
  { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} yes="Published" no="Hidden" /> },
];

export default function Page() {
  return (
    <ResourceManager
      title="Pages" text="About and policy pages. Edits appear on the store within five minutes." crumbs={[{ label: 'Content' }, { label: 'Pages' }]} endpoint="/pages" perm="content.manage" singular="page" width="max-w-3xl" limit={50} columns={columns} fields={fields} defaults={{ isActive: true }}
      extraActions={(r) => (ROUTES[r.slug] ? <a href={ROUTES[r.slug]} target="_blank" rel="noopener noreferrer" className="px-2 text-[13px] font-semibold underline">View</a> : null)}
    />
  );
}
