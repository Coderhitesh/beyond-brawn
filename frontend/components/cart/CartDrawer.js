'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Img from '@/components/ui/Img';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/utils/format';
import QuantityInput from './QuantityInput';
import FreeShippingBar from './FreeShippingBar';

export default function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, setQuantity, remove, busy } = useCart();
  const pathname = usePathname();
  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const footer = cart.lines.length > 0 && (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">Subtotal</span>
        <span className="font-display text-3xl font-black">{formatINR(cart.pricing.subtotal)}</span>
      </div>
      <p className="mt-0.5 text-sm text-mute">Shipping and coupons are applied at checkout.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/cart" className="btn btn-outline">
          View cart
        </Link>
        <Link href="/checkout" className="btn btn-lime">
          Checkout
        </Link>
      </div>
    </div>
  );

  return (
    <Modal open={drawerOpen} onClose={closeDrawer} title={`Your cart${cart.itemCount ? ` (${cart.itemCount})` : ''}`} side="right" width="max-w-md" footer={footer}>
      {cart.lines.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ShoppingBag className="mb-4 size-10 text-mute" strokeWidth={1.5} aria-hidden />
          <p className="font-display text-3xl font-black uppercase leading-none">Your cart is empty</p>
          <p className="mt-2 text-mute">Add a product and it shows up here.</p>
          <Link href="/shop" className="btn btn-lime mt-6">
            Shop products
          </Link>
        </div>
      ) : (
        <div className="-mx-5 -mt-5">
          <FreeShippingBar pricing={cart.pricing} />
          <ul className="divide-y divide-line px-5">
            {cart.lines.map((line) => (
              <li key={line.key} className="flex gap-4 py-4">
                <Link href={`/products/${line.slug}`} className="shrink-0">
                  <Img src={line.image} alt="" width={80} height={80} className="size-20 bg-bone object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${line.slug}`} className="block font-semibold leading-snug hover:underline">
                    {line.name}
                  </Link>
                  {line.variantLabel && <p className="text-sm text-mute">{line.variantLabel}</p>}
                  {line.issue && <p className="text-sm font-semibold text-danger">{line.issueText}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QuantityInput size="sm" value={line.quantity} max={Math.min(20, line.stock || 1)} disabled={busy} onChange={(q) => setQuantity(line, q)} />
                    <span className="font-bold">{formatINR(line.lineTotal)}</span>
                  </div>
                </div>
                <button type="button" onClick={() => remove(line)} disabled={busy} aria-label={`Remove ${line.name}`} className="flex size-9 shrink-0 cursor-pointer items-center justify-center self-start text-mute hover:bg-bone hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
