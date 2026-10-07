import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import ProductListing, { fetchListing } from '@/components/product/ProductListing';
import { apiGet } from '@/lib/server-api';
import { buildMetadata } from '@/lib/seo';

const getCategory = (slug) => apiGet(`/categories/${encodeURIComponent(slug)}`, { revalidate: 120 });

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const res = await getCategory(slug);
  if (!res) return { title: 'Category not found' };
  const { category } = res.data;
  const seo = category.seo || {};
  return buildMetadata({
    title: seo.title || `${category.name} supplements`,
    description: seo.description || category.description || `Shop ${category.name} from Beyond Brawn.`,
    keywords: seo.keywords,
    path: `/category/${category.slug}`,
    image: category.image,
    noindex: Object.keys(sp).some((k) => k !== 'subcategory'),
  });
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const res = await getCategory(slug);
  if (!res) notFound();
  const { category, subCategories } = res.data;
  const sub = subCategories.find((s) => s.slug === sp.subcategory);
  const listing = await fetchListing(sp, { category: category.slug });
  const crumbs = [{ name: 'Shop', href: '/shop' }, { name: category.name, href: `/category/${category.slug}` }];
  if (sub) crumbs.push({ name: sub.name });
  return (
    <>
      <PageHeader title={sub ? sub.name : category.name} text={(sub && sub.description) || category.description} crumbs={crumbs} />
      <ProductListing listing={listing} pathname={`/category/${category.slug}`} searchParams={sp} showSubCategories />
    </>
  );
}
