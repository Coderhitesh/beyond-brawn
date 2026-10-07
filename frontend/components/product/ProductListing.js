import { Suspense } from 'react';
import { SearchX } from 'lucide-react';
import { apiGet } from '@/lib/server-api';
import { EmptyState } from '@/components/ui/States';
import ProductGrid from './ProductGrid';
import Filters from './Filters';
import Pagination from './Pagination';

const ALLOWED = ['q', 'subcategory', 'brand', 'minPrice', 'maxPrice', 'rating', 'inStock', 'type', 'dietary', 'goal', 'tag', 'featured', 'bestSeller', 'newArrival', 'offers', 'sort', 'page'];

export async function fetchListing(searchParams = {}, fixed = {}) {
  const qs = new URLSearchParams();
  ALLOWED.forEach((k) => {
    const v = searchParams[k];
    if (typeof v === 'string' && v !== '') qs.set(k, v);
  });
  Object.entries(fixed).forEach(([k, v]) => qs.set(k, v));
  qs.set('limit', '12');
  const res = await apiGet(`/products?${qs.toString()}`, { revalidate: 30 });
  return res ? { ...res.data, meta: res.meta } : { products: [], facets: null, meta: { page: 1, pages: 1, total: 0, limit: 12 } };
}

// Shared by /shop, /category/[slug] and /search. Filter state lives in the URL so results are shareable and server-rendered.
export default function ProductListing({ listing, pathname, searchParams, showSubCategories = false, emptyTitle = 'No products match these filters', emptyText = 'Remove a filter or two to see more products.' }) {
  const { products, facets, meta } = listing;
  return (
    <div className="container-site py-8 lg:grid lg:grid-cols-[250px_1fr] lg:gap-x-10 lg:py-12">
      <Suspense fallback={null}>
        <Filters facets={facets} showSubCategories={showSubCategories} total={meta.total} />
      </Suspense>
      <div className="lg:col-start-2">
        {products.length ? (
          <>
            <ProductGrid products={products} cols={3} priorityCount={3} />
            <Pagination meta={meta} pathname={pathname} searchParams={searchParams} />
          </>
        ) : (
          <EmptyState icon={SearchX} title={emptyTitle} text={emptyText} action="Browse all products" href="/shop" />
        )}
      </div>
    </div>
  );
}
