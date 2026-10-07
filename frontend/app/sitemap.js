import { apiGet } from '@/lib/server-api';
import { SITE_URL } from '@/lib/config';
import { POLICY_LINKS } from '@/lib/config';

export const revalidate = 3600;

export default async function sitemap() {
  const res = await apiGet('/sitemap', { revalidate: 3600 }).catch(() => null);
  const data = (res && res.data) || { products: [], categories: [], blogs: [] };
  const url = (path, lastModified, changeFrequency, priority) => ({ url: `${SITE_URL}${path}`, lastModified: lastModified ? new Date(lastModified) : new Date(), changeFrequency, priority });
  return [
    url('/', null, 'daily', 1),
    url('/shop', null, 'daily', 0.9),
    ...data.categories.map((c) => url(`/category/${c.slug}`, c.updatedAt, 'daily', 0.8)),
    ...data.products.map((p) => url(`/products/${p.slug}`, p.updatedAt, 'daily', 0.8)),
    url('/blog', null, 'weekly', 0.6),
    ...data.blogs.map((b) => url(`/blog/${b.slug}`, b.updatedAt, 'monthly', 0.5)),
    ...['/about', '/contact', '/faq', '/track-order', ...POLICY_LINKS.map((l) => l.href)].map((p) => url(p, null, 'monthly', 0.3)),
  ];
}
