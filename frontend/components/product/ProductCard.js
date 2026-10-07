'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Img from '@/components/ui/Img';
import Stars from '@/components/ui/Stars';
import { useCart } from '@/context/CartContext';
import Price from './Price';
import WishlistButton from './WishlistButton';

export default function ProductCard({ product, priority = false }) {
  const router = useRouter();
  const { add } = useCart();
  const [adding, setAdding] = useState(false);
  const href = `/products/${product.slug}`;
  const inStock = product.stock > 0;
  // Variant products add their cheapest in-stock option; with no default they send the shopper to choose.
  const canQuickAdd = inStock && (!product.hasVariants || product.defaultVariantId);
  const hover = product.images && product.images[1] ? product.images[1].url : null;

  const quickAdd = async () => {
    setAdding(true);
    await add(product._id, product.defaultVariantId || null, 1);
    setAdding(false);
  };
  const buyNow = () => router.push(`/checkout?buy=${product._id}:${product.defaultVariantId || ''}:1`);

  return (
    <article className="group @container relative flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden bg-bone">
        <Link href={href} tabIndex={-1} aria-hidden className="relative block size-full">
          <Img src={product.thumbnail} alt="" fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" priority={priority} className={`object-cover transition-transform duration-300 group-hover:scale-[1.04] ${hover ? 'group-hover:opacity-0' : ''} ${inStock ? '' : 'opacity-50 grayscale'}`} />
          {hover && <Img src={hover} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
        </Link>
        <div className="pointer-events-none absolute left-0 top-3 flex flex-col items-start gap-1">
          {!inStock && <span className="tag bg-black text-white">Sold out</span>}
          {inStock && product.isNewArrival && <span className="tag bg-black text-white">New</span>}
          {inStock && product.isBestSeller && <span className="tag bg-lime text-black">Best seller</span>}
        </div>
        <WishlistButton productId={product._id} name={product.name} className="absolute right-2 top-2 z-10 size-10 bg-white hover:bg-black hover:text-white" />
      </div>

      <div className="flex flex-1 flex-col pt-3">
        {product.brand && <p className="text-xs font-semibold text-mute">{product.brand.name}</p>}
        <h3 className="mt-0.5 text-[1.0625rem] font-bold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:z-0 hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <div className="hidden @[190px]:block">
            <p className="mt-1 line-clamp-2 text-sm text-mute">{product.shortDescription}</p>
          </div>
        )}
        <div className="mt-2">{product.ratingCount > 0 ? <Stars value={product.ratingAverage} count={product.ratingCount} /> : <span className="text-sm text-mute">No reviews yet</span>}</div>
        <div className="mt-2">
          <Price price={product.price} mrp={product.mrp} />
          {product.hasVariants && product.defaultVariantLabel && <p className="mt-0.5 text-xs text-mute">{product.defaultVariantLabel}</p>}
        </div>
        <p className={`mt-1 text-xs font-semibold ${inStock ? (product.stock <= 5 ? 'text-danger' : 'text-lime-deep') : 'text-mute'}`}>{inStock ? (product.stock <= 5 ? `Only ${product.stock} left` : 'In stock') : 'Out of stock'}</p>

        <div className="relative z-10 mt-auto grid grid-cols-1 gap-2 pt-4 @[190px]:grid-cols-2">
          {canQuickAdd ? (
            <>
              <button type="button" onClick={quickAdd} disabled={adding} className="btn btn-sm btn-black px-2 whitespace-nowrap">
                {adding ? <LoaderCircle className="size-4 animate-spin" aria-label="Adding" /> : 'Add to cart'}
              </button>
              <button type="button" onClick={buyNow} className="btn btn-sm btn-lime px-2 whitespace-nowrap">
                Buy now
              </button>
            </>
          ) : (
            <Link href={href} className="btn btn-sm btn-outline @[190px]:col-span-2">
              {inStock ? 'Choose options' : 'View product'}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
