import PageHeader from '@/components/ui/PageHeader';
import ProductListing, { fetchListing } from '@/components/product/ProductListing';
import { buildMetadata, seoTitle } from '@/lib/seo';
import { pageSeo } from '@/lib/seo-pages';
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

// Collection / goal views of /shop that have their own SEO (meta sheet) and their own canonical URL.
const COLLECTIONS = [
  { param: 'bestSeller', key: 'shop:bestSeller' },
  { param: 'newArrival', key: 'shop:newArrival' },
  { param: 'offers', key: 'shop:offers' },
  { param: 'featured', key: 'shop:featured' },
];
function collectionOf(sp) {
  if (sp.goal && GOALS.some((g) => g.slug === sp.goal)) return { key: `shop:goal:${sp.goal}`, path: `/shop?goal=${sp.goal}`, params: ['goal'] };
  const c = COLLECTIONS.find((x) => sp[x.param]);
  if (c) return { key: c.key, path: `/shop?${c.param}=1`, params: [c.param] };
  if (sp.tag === 'stack') return { key: 'shop:stack', path: '/shop?tag=stack', params: ['tag'] };
  return { key: '/shop', path: '/shop', params: [] };
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const h = heading(sp);
  const c = collectionOf(sp);
  const m = pageSeo(c.key);
  // Sorting does not change what the page is; any other filter/page param = thin duplicate, keep it out of search.
  const filtered = Object.keys(sp).some((k) => k !== 'sort' && !c.params.includes(k));
  return buildMetadata({
    title: seoTitle(m, h.title === 'All products' ? 'Shop all supplements' : h.title),
    description: m.description || `${h.text} Shop authentic Beyond Brawn sports nutrition with fast delivery across India.`,
    keywords: m.keywords,
    robots: m.robots,
    path: c.path,
    noindex: filtered,
  });
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
