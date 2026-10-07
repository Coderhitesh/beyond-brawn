import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { apiGet } from '@/lib/server-api';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/utils/format';

const getPage = (slug) => apiGet(`/pages/${slug}`, { revalidate: 300, tags: [`page-${slug}`] });

export async function cmsMetadata(slug, fallbackTitle) {
  const res = await getPage(slug);
  const page = res && res.data.page;
  const seo = (page && page.seo) || {};
  return buildMetadata({ title: (page && page.title) || fallbackTitle, description: seo.description || `${(page && page.title) || fallbackTitle} for Beyond Brawn.`, path: `/${slug === 'about' ? 'about' : slug}` });
}

// Policy and info pages are edited in Admin > Content > Pages and rendered here.
export default async function CmsPage({ slug, fallbackTitle, children }) {
  const res = await getPage(slug);
  if (!res) notFound();
  const { page } = res.data;
  return (
    <>
      <PageHeader title={page.title || fallbackTitle} crumbs={[{ name: page.title || fallbackTitle }]} />
      <div className="container-site py-10 sm:py-14">
        <div className="prose-bb" dangerouslySetInnerHTML={{ __html: page.content || '' }} />
        {children}
        <p className="mt-10 text-sm text-mute">Last updated {formatDate(page.updatedAt)}</p>
      </div>
    </>
  );
}
