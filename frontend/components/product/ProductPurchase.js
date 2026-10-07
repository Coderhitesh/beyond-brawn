'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import Stars from '@/components/ui/Stars';
import Button from '@/components/ui/Button';
import QuantityInput from '@/components/cart/QuantityInput';
import { useCart } from '@/context/CartContext';
import useLocalList from '@/hooks/useLocalList';
import { formatINR } from '@/utils/format';
import Gallery from './Gallery';
import Price from './Price';
import WishlistButton from './WishlistButton';
import PincodeCheck from './PincodeCheck';

const firstAvailable = (variants) => variants.find((v) => v.stock > 0) || variants[0] || null;

export default function ProductPurchase({ product, variants = [], settings }) {
  const router = useRouter();
  const { add } = useCart();
  const recent = useLocalList('bb_recently_viewed', 12);
  const [selected, setSelected] = useState(() => (product.hasVariants ? (firstAvailable(variants) || {}).options || {} : {}));
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const buyRef = useRef(null);

  useEffect(() => {
    recent.add(product._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id]);

  // Sticky bar appears on mobile once the main buttons scroll out of view.
  useEffect(() => {
    if (!buyRef.current) return undefined;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(buyRef.current);
    return () => io.disconnect();
  }, []);

  const options = product.variantOptions || [];
  const variant = useMemo(() => (product.hasVariants ? variants.find((v) => options.every((o) => v.options[o.name] === selected[o.name])) || null : null), [product.hasVariants, variants, options, selected]);
  const active = product.hasVariants ? variant : product;
  const price = active ? active.price : product.price;
  const mrp = active ? active.mrp : product.mrp;
  const stock = active ? active.stock : 0;
  const unavailable = product.hasVariants && !variant;
  const inStock = !unavailable && stock > 0;
  const maxQty = Math.max(1, Math.min(20, stock));

  useEffect(() => {
    setQty((q) => Math.min(q, maxQty));
  }, [maxQty]);

  // Is this option value purchasable given the other selected options?
  const valueState = (name, value) => {
    const matches = variants.filter((v) => v.options[name] === value && options.every((o) => o.name === name || v.options[o.name] === selected[o.name]));
    if (!matches.length) return 'missing';
    return matches.some((v) => v.stock > 0) ? 'ok' : 'out';
  };
  const choose = (name, value) => {
    const next = { ...selected, [name]: value };
    // If the combination does not exist, fall back to any variant with the chosen value.
    if (!variants.some((v) => options.every((o) => v.options[o.name] === next[o.name]))) {
      const alt = firstAvailable(variants.filter((v) => v.options[name] === value));
      if (alt) return setSelected(alt.options);
    }
    return setSelected(next);
  };

  const addToCart = async () => {
    setAdding(true);
    await add(product._id, variant ? variant._id : null, qty);
    setAdding(false);
  };
  const buyNow = () => router.push(`/checkout?buy=${product._id}:${variant ? variant._id : ''}:${qty}`);
  const threshold = settings.shipping.freeShippingThreshold;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Gallery images={product.images} name={product.name} activeUrl={variant && variant.image} />
      </div>

      <div>
        {product.brand && (
          <Link href={`/shop?brand=${product.brand.slug}`} className="text-sm font-semibold text-mute hover:text-black hover:underline">
            {product.brand.name}
          </Link>
        )}
        <h1 className="display mt-1 text-5xl sm:text-6xl">{product.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {product.ratingCount > 0 ? (
            <a href="#reviews" className="hover:underline">
              <Stars value={product.ratingAverage} count={product.ratingCount} size={16} showValue />
            </a>
          ) : (
            <a href="#reviews" className="link text-sm text-mute">
              No reviews yet
            </a>
          )}
          <span className="text-sm text-mute">SKU {variant ? variant.sku : product.sku}</span>
        </div>
        {product.shortDescription && <p className="mt-4 max-w-xl text-lg leading-relaxed">{product.shortDescription}</p>}

        <div className="mt-6 border-t-2 border-black pt-5">
          <Price price={price} mrp={mrp} size="lg" showSaving />
          <p className="mt-1.5 text-sm text-mute">{settings.tax.inclusive !== false ? 'Inclusive of all taxes' : 'Taxes are added at checkout'}</p>
        </div>

        {options.map((opt) => (
          <fieldset key={opt.name} className="mt-6">
            <legend className="mb-2 text-sm font-semibold">
              {opt.name}: <span className="font-normal text-mute">{selected[opt.name]}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {opt.values.map((value) => {
                const st = valueState(opt.name, value);
                const on = selected[opt.name] === value;
                return (
                  <button key={value} type="button" onClick={() => choose(opt.name, value)} aria-pressed={on} title={st === 'out' ? 'Out of stock' : undefined} className={`min-h-11 cursor-pointer border px-4 py-2 text-[15px] font-semibold transition-colors ${on ? 'border-black bg-black text-white' : 'border-line bg-white hover:border-black'} ${st !== 'ok' && !on ? 'text-mute line-through decoration-1' : ''}`}>
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <p className={`mt-6 text-[15px] font-semibold ${inStock ? (stock <= 5 ? 'text-danger' : 'text-lime-deep') : 'text-danger'}`} aria-live="polite">
          {unavailable ? 'This combination is not available' : inStock ? (stock <= 5 ? `Only ${stock} left in stock` : 'In stock, ships in 24 to 48 hours') : 'Out of stock'}
        </p>

        <div ref={buyRef} className="mt-4 flex flex-wrap items-stretch gap-3">
          <QuantityInput value={qty} onChange={setQty} max={maxQty} disabled={!inStock} />
          <Button variant="black" className="min-w-40 flex-1" onClick={addToCart} loading={adding} disabled={!inStock}>
            Add to cart
          </Button>
          <Button variant="lime" className="min-w-40 flex-1" onClick={buyNow} disabled={!inStock}>
            Buy now
          </Button>
        </div>
        <WishlistButton productId={product._id} name={product.name} withLabel className="mt-4 text-[15px] font-semibold underline-offset-4 hover:underline" />

        <div className="mt-8 border-t border-line pt-6">
          <h2 className="mb-2 text-sm font-semibold">Check delivery to your pincode</h2>
          <PincodeCheck />
        </div>

        <ul className="mt-6 grid gap-3 border-t border-line pt-6 text-[15px] sm:grid-cols-3">
          <li className="flex items-start gap-2.5">
            <Truck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>{threshold ? `Free shipping above ${formatINR(threshold)}` : 'Fast shipping across India'}</span>
          </li>
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>Authentic, batch-tested product</span>
          </li>
          <li className="flex items-start gap-2.5">
            <RotateCcw className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>7-day returns on sealed items</span>
          </li>
        </ul>
      </div>

      {/* mobile sticky purchase bar */}
      {showBar && inStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-black bg-white px-4 py-3 lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="font-bold">{formatINR(price)}</p>
          </div>
          <Button variant="black" size="sm" onClick={addToCart} loading={adding}>
            Add
          </Button>
          <Button variant="lime" size="sm" onClick={buyNow}>
            Buy now
          </Button>
        </div>
      )}
    </div>
  );
}
