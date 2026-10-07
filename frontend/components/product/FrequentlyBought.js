'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Img from '@/components/ui/Img';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/utils/format';

// The current product plus up to two partners, added to the cart together.
export default function FrequentlyBought({ current, partners = [] }) {
  const { add, openDrawer } = useCart();
  const items = [current, ...partners.filter((p) => p.stock > 0 && (!p.hasVariants || p.defaultVariantId)).slice(0, 2)];
  const [picked, setPicked] = useState(() => items.map((i) => i._id));
  const [loading, setLoading] = useState(false);
  if (items.length < 2 || current.stock <= 0) return null;

  const chosen = items.filter((i) => picked.includes(i._id));
  const total = chosen.reduce((s, i) => s + i.price, 0);
  const addAll = async () => {
    setLoading(true);
    for (const item of chosen) {
      // eslint-disable-next-line no-await-in-loop
      await add(item._id, item.defaultVariantId || null, 1, { open: false });
    }
    setLoading(false);
    openDrawer();
  };

  return (
    <section className="border-2 border-black p-4 sm:p-8">
      <h2 className="font-display text-3xl font-black uppercase leading-none sm:text-5xl">Frequently bought together</h2>
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
        <ul className="grid flex-1 grid-cols-3 gap-5 sm:gap-8">
          {items.map((item, i) => (
            <li key={item._id} className="relative min-w-0">
              {i > 0 && <Plus className="absolute -left-[18px] top-[18%] size-4 text-mute sm:-left-6" aria-hidden />}
              <label className="block cursor-pointer">
                <span className="relative block aspect-square bg-bone">
                  <Img src={item.thumbnail} alt="" fill sizes="200px" className={`object-cover ${picked.includes(item._id) ? '' : 'opacity-40'}`} />
                  <input type="checkbox" checked={picked.includes(item._id)} disabled={item._id === current._id} onChange={() => setPicked((cur) => (cur.includes(item._id) ? cur.filter((x) => x !== item._id) : [...cur, item._id]))} className="absolute left-2 top-2 size-5 accent-black" aria-label={`Include ${item.name}`} />
                </span>
                <span className="mt-2 block text-[13px] font-semibold leading-snug break-words sm:text-sm">
                  {item._id === current._id ? 'This item: ' : ''}
                  {item._id === current._id ? item.name : <Link href={`/products/${item.slug}`} className="hover:underline">{item.name}</Link>}
                </span>
                <span className="block text-sm font-bold">{formatINR(item.price)}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="lg:w-64 lg:border-l lg:border-line lg:pl-8">
          <p className="text-sm text-mute">Total for {chosen.length} {chosen.length === 1 ? 'item' : 'items'}</p>
          <p className="font-display text-5xl font-black leading-none">{formatINR(total)}</p>
          <Button variant="black" className="mt-4 w-full" onClick={addAll} loading={loading}>
            Add {chosen.length === 1 ? 'to cart' : `all ${chosen.length} to cart`}
          </Button>
        </div>
      </div>
    </section>
  );
}
