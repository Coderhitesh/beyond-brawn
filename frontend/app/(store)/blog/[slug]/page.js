import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import JsonLd from '@/components/ui/JsonLd';
import Img from '@/components/ui/Img';
import BlogCard from '@/components/home/BlogCard';
import { apiGet } from '@/lib/server-api';
import { articleLd, buildMetadata } from '@/lib/seo';
import { formatDate } from '@/utils/format';

const getBlog = (slug) => apiGet(`/blogs/${encodeURIComponent(slug)}`, { revalidate: 120 });

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await getBlog(slug);
  if (!res) return { title: 'Article not found' };
  const { blog } = res.data;
  const seo = blog.seo || {};
  return buildMetadata({ title: seo.title || blog.title, description: seo.description || blog.excerpt, keywords: seo.keywords || (blog.tags || []).join(', '), path: `/blog/${blog.slug}`, image: blog.coverImage, type: 'article' });
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const res = await getBlog(slug);
  if (!res) notFound();
  const { blog, related } = res.data;
  return (
    <>
      <article className="container-site py-8 sm:py-12">
        <Breadcrumbs items={[{ name: 'Blog', href: '/blog' }, { name: blog.title }]} />
        <header className="mt-6 max-w-4xl">
          <h1 className="display text-5xl sm:text-7xl">{blog.title}</h1>
          <p className="mt-4 text-mute">
            {blog.author}, {formatDate(blog.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
            {blog.readMinutes ? `, ${blog.readMinutes} min read` : ''}
          </p>
          {blog.excerpt && <p className="mt-4 max-w-3xl text-xl leading-relaxed">{blog.excerpt}</p>}
        </header>
        <div className="relative mt-8 aspect-[16/9] max-w-5xl overflow-hidden bg-black">
          <Img src={blog.coverImage || '/placeholders/blog.svg'} alt="" fill priority sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
        </div>
        <div className="prose-bb mt-10" dangerouslySetInnerHTML={{ __html: blog.content || '' }} />
        {blog.tags && blog.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {blog.tags.map((t) => (
              <li key={t} className="border border-line px-3 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-10 max-w-[68ch] border-2 border-black p-5">
          This article is general information, not medical advice. Check with a doctor before starting a supplement if you have a health condition.{' '}
          <Link href="/shop" className="link font-bold">
            Shop the range
          </Link>
        </p>
      </article>
      {related.length > 0 && (
        <section className="border-t-2 border-black bg-bone">
          <div className="container-site py-12">
            <h2 className="h-section mb-6">Keep reading</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {related.map((b) => (
                <BlogCard key={b._id} blog={b} />
              ))}
            </div>
          </div>
        </section>
      )}
      <JsonLd data={articleLd(blog)} />
    </>
  );
}
