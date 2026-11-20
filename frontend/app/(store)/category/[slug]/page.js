import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import ProductListing, { fetchListing } from '@/components/product/ProductListing';
import { apiGet } from '@/lib/server-api';
import { buildMetadata, seoTitle } from '@/lib/seo';

const getCategory = (slug) => apiGet(`/categories/${encodeURIComponent(slug)}`, { revalidate: 120 });

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const res = await getCategory(slug);
  if (!res) return { title: 'Category not found' };
  const { category, subCategories = [] } = res.data;
  // ?subcategory=x gets its own title/description/canonical when that sub-category has SEO filled in.
  const sub = sp.subcategory ? subCategories.find((s) => s.slug === sp.subcategory) : null;
  const subSeo = sub && sub.seo && sub.seo.title ? sub.seo : null;
  const seo = subSeo || category.seo || {};
  const name = subSeo ? sub.name : category.name;
  return buildMetadata({
    title: seoTitle(seo, `${name} supplements`),
    description: seo.description || (subSeo ? sub.description : category.description) || `Shop ${name} from Beyond Brawn.`,
    keywords: seo.keywords,
    path: subSeo ? `/category/${category.slug}?subcategory=${sub.slug}` : `/category/${category.slug}`,
    image: (subSeo && sub.image) || category.image,
    robots: seo.robots,
    noindex: Object.keys(sp).some((k) => k !== 'subcategory') || Boolean(sp.subcategory && !subSeo),
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
