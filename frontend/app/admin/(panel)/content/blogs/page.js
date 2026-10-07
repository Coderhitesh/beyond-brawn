'use client';
import ResourceManager from '@/components/admin/ResourceManager';
import { SEO_FIELDS } from '@/components/admin/FormFields';
import { ActiveBadge } from '@/components/admin/ui';
import { formatDate } from '@/utils/format';

const fields = [
  { name: 'title', label: 'Title', required: true, full: true },
  { name: 'slug', label: 'URL slug', hint: 'Leave empty to create it from the title' },
  { name: 'category', label: 'Category', type: 'asyncSelect', endpoint: '/blog-categories', placeholder: 'No category' },
  { name: 'excerpt', label: 'Summary', type: 'textarea', rows: 2, maxLength: 400, hint: 'Shown on the blog list and in search results' },
  { name: 'coverImage', label: 'Cover image', type: 'image', folder: 'blog' },
  { name: 'content', label: 'Article', type: 'richtext' },
  { name: 'author', label: 'Author' },
  { name: 'tags', label: 'Tags', type: 'tags', hint: 'Comma separated' },
  { name: 'isPublished', label: 'Published', type: 'checkbox', full: true, hint: 'Unpublished articles are drafts and are not visible on the store' },
  ...SEO_FIELDS,
];
const columns = [
  { key: 'title', label: 'Title', render: (r) => <span className="font-semibold">{r.title}</span> },
  { key: 'category', label: 'Category', render: (r) => (r.category ? r.category.name : '') },
  { key: 'publishedAt', label: 'Published', render: (r) => (r.publishedAt ? formatDate(r.publishedAt) : '') },
  { key: 'isPublished', label: 'Status', render: (r) => <ActiveBadge on={r.isPublished} yes="Published" no="Draft" /> },
];

export default function Page() {
  return (
    <ResourceManager
      title="Blog" crumbs={[{ label: 'Content' }, { label: 'Blog' }]} endpoint="/blogs" perm="content.manage" singular="article" width="max-w-3xl" columns={columns} fields={fields}
      defaults={{ author: 'Team Beyond Brawn', isPublished: false }}
      filters={[{ key: 'isPublished', label: 'Any status', options: [{ value: 'true', label: 'Published' }, { value: 'false', label: 'Draft' }] }]}
      extraActions={(r) => (r.isPublished ? <a href={`/blog/${r.slug}`} target="_blank" rel="noopener noreferrer" className="px-2 text-[13px] font-semibold underline">View</a> : null)}
    />
  );
}
