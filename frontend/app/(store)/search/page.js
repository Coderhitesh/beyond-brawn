import PageHeader from '@/components/ui/PageHeader';
import ProductListing, { fetchListing } from '@/components/product/ProductListing';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata({ searchParams }) {
  const { q = '' } = await searchParams;
  return buildMetadata({ title: q ? `Search results for "${q}"` : 'Search', path: '/search', noindex: true });
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const listing = q ? await fetchListing(sp) : { products: [], facets: null, meta: { page: 1, pages: 1, total: 0 } };
  return (
    <>
      <PageHeader title={q ? `Results for "${q}"` : 'Search'} text={q ? `${listing.meta.total} ${listing.meta.total === 1 ? 'product' : 'products'} found` : 'Use the search icon in the header to find products by name, category, brand or SKU.'} crumbs={[{ name: 'Search' }]} />
      <ProductListing listing={listing} pathname="/search" searchParams={sp} emptyTitle={q ? `Nothing matches "${q}"` : 'Search for a product'} emptyText={q ? 'Check the spelling, or try a broader word like "protein" or "creatine".' : 'Try "whey", "creatine" or "pre workout".'} />
    </>
  );
}
