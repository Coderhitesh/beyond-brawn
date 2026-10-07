'use client';
import Link from 'next/link';
import { Heart, Lock, ShoppingBag, Trash2 } from 'lucide-react';
import Img from '@/components/ui/Img';
import { EmptyState, Lines } from '@/components/ui/States';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/utils/format';
import QuantityInput from './QuantityInput';
import FreeShippingBar from './FreeShippingBar';
import CouponBox from './CouponBox';
import PriceSummary from './PriceSummary';

export default function CartView() {
  const { cart, loading, busy, setQuantity, remove, saveForLater, isGuest } = useCart();

  return (
    <div className="container-site py-8 sm:py-12">
      <h1 className="display text-5xl sm:text-7xl">Your cart</h1>
      {loading ? (
        <div className="mt-8 max-w-3xl">
          <Lines rows={3} />
        </div>
      ) : cart.lines.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Add a product and it shows up here, ready for checkout." action="Shop products" href="/shop" />
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <FreeShippingBar pricing={cart.pricing} />
            <ul className="divide-y divide-line border-b border-line">
              {cart.lines.map((line) => (
                <li key={line.key} className="flex gap-4 py-5 sm:gap-6">
                  <Link href={`/products/${line.slug}`} className="shrink-0">
                    <Img src={line.image} alt="" width={120} height={120} className="size-24 bg-bone object-cover sm:size-28" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={`/products/${line.slug}`} className="text-lg font-bold leading-snug hover:underline">
                          {line.name}
                        </Link>
                        {line.variantLabel && <p className="text-[15px] text-mute">{line.variantLabel}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold">{formatINR(line.lineTotal)}</p>
                        {line.lineMrp > line.lineTotal && <p className="text-sm text-mute line-through">{formatINR(line.lineMrp)}</p>}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-mute">
                      {formatINR(line.price)} each
                      {line.mrp > line.price ? `, ${Math.round(((line.mrp - line.price) / line.mrp) * 100)}% off MRP` : ''}
                    </p>
                    {line.issue && (
                      <p className="mt-1 text-sm font-semibold text-danger" role="alert">
                        {line.issueText}
                        {line.issue === 'insufficient_stock' ? `. Only ${line.stock} available.` : ''}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <QuantityInput size="sm" value={line.quantity} max={Math.min(20, line.stock || 1)} disabled={busy} onChange={(q) => setQuantity(line, q)} label={`Quantity of ${line.name}`} />
                      <button type="button" onClick={() => remove(line)} disabled={busy} className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-mute hover:text-danger">
                        <Trash2 className="size-4" aria-hidden />
                        Remove
                      </button>
                      {!isGuest && (
                        <button type="button" onClick={() => saveForLater(line)} disabled={busy} className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-mute hover:text-black">
                          <Heart className="size-4" aria-hidden />
                          Move to wishlist
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/shop" className="link mt-5 inline-block font-semibold">
              Continue shopping
            </Link>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <CouponBox coupon={cart.coupon} />
            <PriceSummary pricing={cart.pricing} coupon={cart.coupon} itemCount={cart.itemCount}>
              {cart.hasIssues ? (
                <p className="text-sm font-semibold text-danger">Fix the highlighted items to continue.</p>
              ) : (
                <Link href="/checkout" className="btn btn-lime h-14 w-full text-xl">
                  Proceed to checkout
                </Link>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-mute">
                <Lock className="size-3.5" aria-hidden />
                Secure payment with Razorpay
              </p>
            </PriceSummary>
          </div>
        </div>
      )}
    </div>
  );
}
