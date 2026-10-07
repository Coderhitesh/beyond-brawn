import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import BlogCard from '@/components/home/BlogCard';
import Pagination from '@/components/product/Pagination';
import { apiGet } from '@/lib/server-api';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  return buildMetadata({ title: 'Training and nutrition blog', description: 'Practical, evidence-based articles on protein, creatine, training and recovery from the Beyond Brawn team.', path: '/blog', noindex: Boolean(sp.page || sp.category) });
}

export default async function BlogPage({ searchParams }) {
  const sp = await searchParams;
  const qs = new URLSearchParams({ limit: '9' });
  if (typeof sp.page === 'string') qs.set('page', sp.page);
  if (typeof sp.category === 'string') qs.set('category', sp.category);
  const res = await apiGet(`/blogs?${qs}`, { revalidate: 120 });
  const blogs = (res && res.data.blogs) || [];
  const categories = (res && res.data.categories) || [];
  const chip = (active) => `border px-3.5 py-1.5 text-[15px] font-semibold ${active ? 'border-black bg-black text-white' : 'border-line hover:border-black'}`;
  return (
    <>
      <PageHeader title="Training and nutrition" text="Short, practical reads. No bro-science." crumbs={[{ name: 'Blog' }]} />
      <div className="container-site py-10 sm:py-14">
        {categories.length > 0 && (
          <ul className="mb-8 flex flex-wrap gap-2">
            <li>
              <Link href="/blog" className={chip(!sp.category)}>
                All
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c._id}>
                <Link href={`/blog?category=${c.slug}`} className={chip(sp.category === c.slug)}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {blogs.length ? (
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((b) => (
              <BlogCard key={b._id} blog={b} />
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-line px-6 py-16 text-center text-mute">No articles here yet.</p>
        )}
        <Pagination meta={res && res.meta} pathname="/blog" searchParams={sp} />
      </div>
    </>
  );
}
