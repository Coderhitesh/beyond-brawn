import PageHeader from '@/components/ui/PageHeader';
import ProductListing, { fetchListing } from '@/components/product/ProductListing';
import { buildMetadata } from '@/lib/seo';
import { GOALS } from '@/lib/config';

function heading(sp) {
  if (sp.bestSeller) return { title: 'Best sellers', text: 'What other lifters reorder most.' };
  if (sp.newArrival) return { title: 'New arrivals', text: 'The latest additions to the range.' };
  if (sp.offers) return { title: 'Offers', text: 'Everything currently below MRP.' };
  if (sp.featured) return { title: 'Featured products', text: 'Our picks from across the range.' };
  const goal = GOALS.find((g) => g.slug === sp.goal);
  if (goal) return { title: goal.name, text: `${goal.blurb}.` };
  return { title: 'All products', text: 'Protein, performance, wellness and gear. Filter to find your fit.' };
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const h = heading(sp);
  const filtered = Object.keys(sp).some((k) => !['bestSeller', 'newArrival', 'offers', 'featured', 'goal'].includes(k));
  return buildMetadata({ title: h.title === 'All products' ? 'Shop all supplements' : h.title, description: `${h.text} Shop authentic Beyond Brawn sports nutrition with fast delivery across India.`, path: '/shop', noindex: filtered });
}

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const h = heading(sp);
  const listing = await fetchListing(sp);
  return (
    <>
      <PageHeader title={h.title} text={h.text} crumbs={[{ name: 'Shop', href: '/shop' }]} />
      <ProductListing listing={listing} pathname="/shop" searchParams={sp} />
    </>
  );
}
