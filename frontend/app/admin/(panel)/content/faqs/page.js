'use client';
import ResourceManager from '@/components/admin/ResourceManager';
import { ActiveBadge } from '@/components/admin/ui';

const fields = [
  { name: 'question', label: 'Question', required: true, full: true },
  { name: 'answer', label: 'Answer', type: 'textarea', rows: 5, required: true },
  { name: 'category', label: 'Group', required: true, hint: 'Questions with the same group are listed together, e.g. "Orders & Shipping"' },
  { name: 'sortOrder', label: 'Sort order', type: 'number' },
  { name: 'isActive', label: 'Published', type: 'checkbox', full: true },
];
const columns = [
  { key: 'question', label: 'Question', render: (r) => <span className="font-semibold">{r.question}</span> },
  { key: 'category', label: 'Group' },
  { key: 'sortOrder', label: 'Order', align: 'right' },
  { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} yes="Published" no="Hidden" /> },
];

export default function Page() {
  return <ResourceManager title="FAQ" crumbs={[{ label: 'Content' }, { label: 'FAQ' }]} endpoint="/faqs" perm="content.manage" singular="question" limit={50} columns={columns} fields={fields} defaults={{ isActive: true, category: 'General', sortOrder: 0 }} />;
}
