import Link from 'next/link';
import Hero from '@/components/home/Hero';
import ShopByGoal from '@/components/home/ShopByGoal';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import PromoBanner from '@/components/home/PromoBanner';
import WhyUs from '@/components/home/WhyUs';
import ReviewsStrip from '@/components/home/ReviewsStrip';
import BlogCard from '@/components/home/BlogCard';
import Newsletter from '@/components/home/Newsletter';
import ProductRow from '@/components/product/ProductRow';
import { apiGet, getSettings } from '@/lib/server-api';

export const revalidate = 60;

export async function generateMetadata() {
  const { seo } = await getSettings();
  return { title: { absolute: seo.defaultTitle }, description: seo.defaultDescription, alternates: { canonical: '/' } };
}

export default async function HomePage() {
  const [settings, res] = await Promise.all([getSettings(), apiGet('/home', { revalidate: 60 })]);
  const home = (res && res.data) || {};
  const { hero, promo } = settings.homepage;
  return (
    <>
      <Hero hero={hero} banner={(home.heroBanners || [])[0]} />
      <ShopByGoal />
      <FeaturedCategories categories={home.categories} />
      <ProductRow title="Best sellers" products={home.bestSellers} href="/shop?bestSeller=1&sort=best-selling" />
      <ProductRow title="New arrivals" products={home.newArrivals} href="/shop?newArrival=1&sort=newest" />
      <PromoBanner promo={promo} banner={(home.promoBanners || [])[0]} />
      <WhyUs />
      <ProductRow title="Featured products" products={home.featured} href="/shop?featured=1" />
      <ReviewsStrip reviews={home.reviews} />
      {home.blogs && home.blogs.length > 0 && (
        <section className="container-site py-12 sm:py-16">
          <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-black pb-3">
            <h2 className="h-section">Training and nutrition</h2>
            <Link href="/blog" className="link shrink-0 whitespace-nowrap text-[15px] font-semibold">
              All articles
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {home.blogs.map((b) => (
              <BlogCard key={b._id} blog={b} />
            ))}
          </div>
        </section>
      )}
      <Newsletter />
    </>
  );
}
