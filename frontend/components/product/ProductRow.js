'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

// Horizontal, swipeable product strip with scroll-snap. Arrow buttons page it on desktop.
export default function ProductRow({ title, products = [], href, hrefLabel = 'View all' }) {
  const ref = useRef(null);
  if (!products.length) return null;
  const page = (dir) => ref.current && ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <section className="container-site py-12 sm:py-16">
      <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-black pb-3">
        <h2 className="h-section">{title}</h2>
        <div className="flex items-center gap-2">
          {href && (
            <Link href={href} className="link mr-2 hidden text-[15px] font-semibold sm:block">
              {hrefLabel}
            </Link>
          )}
          <button type="button" onClick={() => page(-1)} aria-label={`Scroll ${title} back`} className="hidden size-10 cursor-pointer items-center justify-center border border-black hover:bg-black hover:text-white md:flex">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => page(1)} aria-label={`Scroll ${title} forward`} className="hidden size-10 cursor-pointer items-center justify-center border border-black hover:bg-black hover:text-white md:flex">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
      <ul ref={ref} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:px-0">
        {products.map((p) => (
          <li key={p._id} className="w-[62%] shrink-0 snap-start sm:w-[38%] md:w-[30%] lg:w-[calc(25%-18px)]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      {href && (
        <Link href={href} className="btn btn-outline mt-8 w-full sm:hidden">
          {hrefLabel}
        </Link>
      )}
    </section>
  );
}
