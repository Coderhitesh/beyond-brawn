import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import JsonLd from '@/components/ui/JsonLd';
import ProductPurchase from '@/components/product/ProductPurchase';
import ProductDetails from '@/components/product/ProductDetails';
import ProductRow from '@/components/product/ProductRow';
import FrequentlyBought from '@/components/product/FrequentlyBought';
import RecentlyViewed from '@/components/product/RecentlyViewed';
import Reviews from '@/components/product/Reviews';
import { apiGet, getSettings } from '@/lib/server-api';
import { buildMetadata, productLd } from '@/lib/seo';

const getProduct = (slug) => apiGet(`/products/${encodeURIComponent(slug)}`, { revalidate: 30, tags: [`product-${slug}`] });

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const res = await getProduct(slug);
  if (!res) return { title: 'Product not found' };
  const { product } = res.data;
  const seo = product.seo || {};
  return buildMetadata({
    title: seo.title ? { absolute: seo.title } : product.name,
    description: seo.description || product.shortDescription,
    keywords: seo.keywords || (product.tags || []).join(', '),
    path: `/products/${product.slug}`,
    image: product.thumbnail,
  });
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const [res, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!res) notFound();
  const { product, variants, related, similar, frequentlyBoughtTogether } = res.data;
  const crumbs = [{ name: 'Shop', href: '/shop' }];
  if (product.category) crumbs.push({ name: product.category.name, href: `/category/${product.category.slug}` });
  if (product.category && product.subCategory) crumbs.push({ name: product.subCategory.name, href: `/category/${product.category.slug}?subcategory=${product.subCategory.slug}` });
  crumbs.push({ name: product.name });

  // Card-shaped copy of this product for the "bought together" bundle (uses the cheapest in-stock variant).
  const defaultVariant = variants.find((v) => v.stock > 0) || null;
  const current = { _id: product._id, name: product.name, slug: product.slug, thumbnail: product.thumbnail, price: defaultVariant ? defaultVariant.price : product.price, stock: product.stock, hasVariants: product.hasVariants, defaultVariantId: defaultVariant ? defaultVariant._id : null };

  return (
    <>
      <div className="container-site pb-4 pt-6">
        <Breadcrumbs items={crumbs} />
      </div>
      <div className="container-site pb-12">
        <ProductPurchase product={product} variants={variants} settings={settings} />
      </div>
      <div className="container-site space-y-14 pb-14">
        <ProductDetails product={product} />
        <FrequentlyBought current={current} partners={frequentlyBoughtTogether} />
        <Reviews product={product} />
      </div>
      <div className="border-t border-line">
        <ProductRow title="Related products" products={related} />
        <ProductRow title="Similar products" products={similar} />
        <RecentlyViewed excludeId={product._id} />
      </div>
      <JsonLd data={productLd(product, variants)} />
    </>
  );
}
