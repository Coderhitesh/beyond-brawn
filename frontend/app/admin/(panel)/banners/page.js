'use client';
import ResourceManager from '@/components/admin/ResourceManager';
import { ActiveBadge } from '@/components/admin/ui';

const PLACEMENTS = [{ value: 'hero', label: 'Homepage hero' }, { value: 'promo', label: 'Promotional banner' }, { value: 'offer', label: 'Offer strip' }, { value: 'category', label: 'Category' }];
const fields = [
  { name: 'title', label: 'Headline', required: true, full: true },
  { name: 'subtitle', label: 'Supporting text', type: 'textarea', rows: 2 },
  { name: 'placement', label: 'Where it shows', type: 'select', options: PLACEMENTS, required: true },
  { name: 'sortOrder', label: 'Sort order', type: 'number', hint: 'The lowest number is shown' },
  { name: 'buttonText', label: 'Button text', placeholder: 'Shop now' },
  { name: 'link', label: 'Button link', placeholder: '/shop?offers=1' },
  { name: 'image', label: 'Image (desktop)', type: 'image', folder: 'banners' },
  { name: 'mobileImage', label: 'Image (mobile, optional)', type: 'image', folder: 'banners' },
  { name: 'startDate', label: 'Show from', type: 'date' },
  { name: 'endDate', label: 'Show until', type: 'dateEnd' },
  { name: 'isActive', label: 'Active', type: 'checkbox', full: true },
];
const columns = [
  { key: 'image', label: '', render: (r) => (r.image ? <img src={r.image} alt="" className="h-10 w-16 bg-bone object-cover" /> : <span className="block h-10 w-16 bg-bone" />) },
  { key: 'title', label: 'Headline', render: (r) => <span className="font-semibold">{r.title}</span> },
  { key: 'placement', label: 'Placement', render: (r) => (PLACEMENTS.find((p) => p.value === r.placement) || {}).label },
  { key: 'sortOrder', label: 'Order', align: 'right' },
  { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} /> },
];

export default function Page() {
  return <ResourceManager title="Banners" text="The first active hero banner replaces the homepage headline. The first active promotional banner replaces the lime promo strip." crumbs={[{ label: 'Banners' }]} endpoint="/banners" perm="banners.manage" singular="banner" columns={columns} fields={fields} defaults={{ isActive: true, placement: 'hero', sortOrder: 0 }} filters={[{ key: 'placement', label: 'All placements', options: PLACEMENTS }]} />;
}
