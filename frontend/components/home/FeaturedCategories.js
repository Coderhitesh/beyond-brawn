import Link from 'next/link';
import Img from '@/components/ui/Img';

export default function FeaturedCategories({ categories = [] }) {
  const list = categories.slice(0, 5);
  if (!list.length) return null;
  return (
    <section className="bg-bone">
      <div className="container-site py-12 sm:py-16">
        <div className="mb-6 flex items-end justify-between border-b-2 border-black pb-3">
          <h2 className="h-section">Categories</h2>
          <Link href="/shop" className="link shrink-0 whitespace-nowrap text-[15px] font-semibold">
            All products
          </Link>
        </div>
        <ul className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
          {list.map((c) => (
            <li key={c._id} className="w-[58%] shrink-0 snap-start sm:w-auto">
              <Link href={`/category/${c.slug}`} className="group block bg-white">
                <span className="relative block aspect-[4/5] overflow-hidden bg-black">
                  <Img src={c.image || '/placeholders/product.svg'} alt="" fill sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 58vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </span>
                <span className="block border-t-[5px] border-black px-3 py-3">
                  <span className="block font-display text-2xl font-black uppercase leading-none">{c.name}</span>
                  {c.description && <span className="mt-1 line-clamp-2 block text-sm text-mute">{c.description}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
