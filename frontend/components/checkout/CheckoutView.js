'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Lock, ShoppingBag } from 'lucide-react';
import Img from '@/components/ui/Img';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import { EmptyState, Lines } from '@/components/ui/States';
import CouponBox from '@/components/cart/CouponBox';
import PriceSummary from '@/components/cart/PriceSummary';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { fieldErrors } from '@/lib/api';
import { loadRazorpay, openRazorpay } from '@/lib/razorpay';
import { priceItems } from '@/services/cart';
import { listAddresses } from '@/services/account';
import { checkout, reportPaymentFailure, verifyPayment } from '@/services/orders';
import { formatINR } from '@/utils/format';
import AddressForm, { EMPTY_ADDRESS, validateAddress } from './AddressForm';

function Step({ n, title, children, aside }) {
  return (
    <section className="border-t-2 border-black pt-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="flex items-baseline gap-3 font-display text-3xl font-black uppercase leading-none">
          <span className="flex size-8 shrink-0 items-center justify-center self-center bg-black text-xl text-white">{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

const parseBuy = (raw) => {
  if (!raw) return null;
  const [productId, variantId, qty] = raw.split(':');
  if (!/^[a-f\d]{24}$/i.test(productId || '')) return null;
  return { productId, variantId: /^[a-f\d]{24}$/i.test(variantId || '') ? variantId : null, quantity: Math.max(1, Math.min(20, parseInt(qty, 10) || 1)) };
};

export default function CheckoutView() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const cartCtx = useCart();
  const buyNow = useMemo(() => parseBuy(params.get('buy')), [params]);

  const [guest, setGuest] = useState({ name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('new');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [method, setMethod] = useState('standard');
  const [notes, setNotes] = useState('');
  const [buyCoupon, setBuyCoupon] = useState(null);
  const [priced, setPriced] = useState(null);
  const [pricing, setPricing] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [paying, setPaying] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const items = useMemo(() => (buyNow ? [buyNow] : cartCtx.cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity }))), [buyNow, cartCtx.cart.lines]);
  const couponCode = buyNow ? buyCoupon : cartCtx.cart.coupon ? cartCtx.cart.coupon.code : null;
  const itemsKey = JSON.stringify(items);

  // Saved addresses for logged-in customers.
  useEffect(() => {
    if (!user) return;
    listAddresses()
      .then((res) => {
        setAddresses(res.data.addresses);
        const def = res.data.addresses.find((a) => a.isDefault) || res.data.addresses[0];
        if (def) setAddressId(def._id);
      })
      .catch(() => null);
  }, [user]);

  // Totals always come from the server, for the chosen shipping method.
  useEffect(() => {
    if (cartCtx.loading && !buyNow) return undefined;
    if (!items.length) {
      setPriced(null);
      setPricing(false);
      return undefined;
    }
    let cancelled = false;
    setPricing(true);
    priceItems({ items, couponCode, shippingMethod: method })
      .then((res) => !cancelled && setPriced(res.data.cart))
      .catch((e) => !cancelled && setFormError(e.message))
      .finally(() => !cancelled && setPricing(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, couponCode, method, cartCtx.loading, buyNow]);

  const applyBuyCoupon = useCallback(
    async (code) => {
      try {
        const res = await priceItems({ items, couponCode: code, shippingMethod: method });
        if (res.data.cart.couponError) return res.data.cart.couponError;
        setBuyCoupon(code.toUpperCase());
        toast.success('Coupon applied');
        return null;
      } catch (e) {
        return e.message;
      }
    },
    [items, method, toast]
  );

  const pay = async () => {
    setFormError('');
    const e = {};
    if (!user) {
      if (guest.name.trim().length < 2) e['guest.name'] = 'Enter your name';
      if (!/^\S+@\S+\.\S+$/.test(guest.email)) e['guest.email'] = 'Enter a valid email address';
      if (!/^[6-9]\d{9}$/.test(guest.phone)) e['guest.phone'] = 'Enter a valid 10-digit mobile number';
    }
    const usingSaved = user && addressId !== 'new';
    if (!usingSaved) Object.entries(validateAddress(address)).forEach(([k, v]) => (e[`address.${k}`] = v));
    setErrors(e);
    if (Object.keys(e).length) {
      setFormError('Check the highlighted fields and try again.');
      const first = document.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }

    setPaying(true);
    try {
      const body = { shippingMethod: method, couponCode: couponCode || null, ...(notes.trim() ? { notes: notes.trim() } : {}) };
      if (usingSaved) body.addressId = addressId;
      else body.address = { ...address, line2: address.line2 || '' };
      if (!user) body.guest = { name: guest.name.trim(), email: guest.email.trim(), phone: guest.phone };
      if (buyNow) body.buyNow = buyNow;
      else if (!user) body.items = items;

      const order = (await checkout(body)).data;
      if (!(await loadRazorpay())) throw new Error('Could not load the payment window. Check your connection or disable ad blockers, then try again.');

      let payment;
      try {
        payment = await openRazorpay(order.razorpay);
      } catch (err) {
        reportPaymentFailure({ razorpay_order_id: order.razorpay.orderId, reason: err.message }).catch(() => null);
        setFormError(err.message === 'dismissed' ? 'Payment was not completed. Your items are held for a short while, so you can pay again when ready.' : `${err.message}. No order was placed. You can try again.`);
        return;
      }

      try {
        const verified = (await verifyPayment(payment)).data.order;
        try {
          sessionStorage.setItem('bb_last_order', JSON.stringify(verified));
        } catch (err) {
          /* storage unavailable */
        }
        if (!buyNow) cartCtx.reset();
        router.replace(`/checkout/success?order=${encodeURIComponent(verified.orderNumber)}`);
      } catch (err) {
        // Money may have moved. The webhook will confirm the order even if this call failed.
        setFormError(`We could not confirm your payment yet (${err.message}). If money was deducted, your order ${order.orderNumber} will be confirmed automatically and emailed to you. Please do not pay again.`);
      }
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) setErrors(fe);
      if (err.code === 'CART_ISSUES') {
        setFormError('Some items are no longer available in the quantity you chose. Review your cart to continue.');
        if (!buyNow) cartCtx.reload();
      } else setFormError(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (authLoading || (cartCtx.loading && !buyNow)) {
    return (
      <div className="container-site max-w-3xl py-12">
        <Lines rows={4} />
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="container-site py-12">
        <EmptyState icon={ShoppingBag} title="Nothing to check out" text="Your cart is empty. Add a product to continue." action="Shop products" href="/shop" />
      </div>
    );
  }

  const lines = priced ? priced.lines : [];
  const methods = priced ? priced.shippingMethods : [];
  const blocked = priced && priced.hasIssues;

  return (
    <div className="container-site py-8 sm:py-12">
      <h1 className="display text-5xl sm:text-7xl">Checkout</h1>
      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10">
        <div className="space-y-10">
          <Step n={1} title="Contact" aside={!user && <Link href={`/login?next=${encodeURIComponent(`/checkout${buyNow ? `?buy=${params.get('buy')}` : ''}`)}`} className="link text-sm font-semibold">Have an account? Log in</Link>}>
            {user ? (
              <p className="text-[1.0625rem]">
                <span className="font-semibold">{user.name}</span>
                <span className="block text-mute">{user.email}</span>
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} autoComplete="name" error={errors['guest.name']} required />
                <Field label="Mobile number" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" autoComplete="tel-national" error={errors['guest.phone']} required />
                <Field className="sm:col-span-2" label="Email" type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} autoComplete="email" error={errors['guest.email']} hint="Your order confirmation and tracking go here" required />
              </div>
            )}
          </Step>

          <Step n={2} title="Delivery address">
            {user && addresses.length > 0 && (
              <fieldset className="mb-4 space-y-2">
                <legend className="sr-only">Choose a saved address</legend>
                {addresses.map((a) => (
                  <label key={a._id} className={`flex cursor-pointer gap-3 border p-4 ${addressId === a._id ? 'border-2 border-black' : 'border-line hover:border-black'}`}>
                    <input type="radio" name="address" checked={addressId === a._id} onChange={() => setAddressId(a._id)} className="mt-1 size-[18px] accent-black" />
                    <span className="text-[15px] leading-relaxed">
                      <span className="font-bold">{a.fullName}</span>, {a.phone}
                      <span className="block text-mute">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                      </span>
                    </span>
                  </label>
                ))}
                <label className={`flex cursor-pointer items-center gap-3 border p-4 font-semibold ${addressId === 'new' ? 'border-2 border-black' : 'border-line hover:border-black'}`}>
                  <input type="radio" name="address" checked={addressId === 'new'} onChange={() => setAddressId('new')} className="size-[18px] accent-black" />
                  Use a different address
                </label>
              </fieldset>
            )}
            {(!user || addressId === 'new') && <AddressForm value={address} onChange={setAddress} errors={errors} prefix="address." />}
          </Step>

          <Step n={3} title="Shipping">
            <fieldset className="space-y-2">
              <legend className="sr-only">Shipping method</legend>
              {methods.map((m) => (
                <label key={m.code} className={`flex cursor-pointer items-center gap-3 border p-4 ${method === m.code ? 'border-2 border-black' : 'border-line hover:border-black'}`}>
                  <input type="radio" name="shipping" checked={method === m.code} onChange={() => setMethod(m.code)} className="size-[18px] accent-black" />
                  <span className="flex-1">
                    <span className="block font-bold">{m.name}</span>
                    <span className="block text-sm text-mute">
                      Arrives in {m.minDays} to {m.maxDays} working days
                    </span>
                  </span>
                  <span className="font-bold">{m.charge > 0 ? formatINR(m.charge) : 'Free'}</span>
                </label>
              ))}
              {!methods.length && <div className="skeleton h-16" />}
            </fieldset>
            <Field as="textarea" rows={2} className="mt-4" label="Delivery note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Gate code, landmark, preferred time" />
          </Step>

          <Step n={4} title="Payment">
            <p className="max-w-prose text-[15px] leading-relaxed text-mute">You pay on Razorpay's secure window with UPI, credit or debit card, net banking or a wallet. Your order is confirmed as soon as the payment is verified.</p>
            {formError && (
              <p className="mt-4 border-2 border-danger px-4 py-3 text-[15px] font-semibold text-danger" role="alert">
                {formError}{' '}
                {blocked && !buyNow && (
                  <Link href="/cart" className="underline">
                    Review cart
                  </Link>
                )}
              </p>
            )}
            <Button variant="lime" className="mt-5 h-14 w-full text-xl sm:w-auto sm:min-w-80" onClick={pay} loading={paying} disabled={pricing || !priced || blocked}>
              <Lock className="size-5" aria-hidden />
              {priced ? `Pay ${formatINR(priced.pricing.total)}` : 'Pay now'}
            </Button>
            <p className="mt-3 text-sm text-mute">
              By paying you agree to our{' '}
              <Link href="/terms-and-conditions" className="underline">
                terms
              </Link>{' '}
              and{' '}
              <Link href="/refund-policy" className="underline">
                refund policy
              </Link>
              .
            </p>
          </Step>
        </div>

        {/* On phones the summary sits above the form, collapsed to one line with the total, so it is seen before paying. */}
        <aside aria-label="Order summary" className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start">
          <button type="button" onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} aria-controls="checkout-summary" className="flex w-full cursor-pointer items-center justify-between gap-3 border-2 border-black bg-bone px-4 py-3 lg:hidden">
            <span className="flex items-center gap-2 font-semibold">
              {summaryOpen ? 'Hide' : 'Show'} summary, add coupon
              <ChevronDown className={`size-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} aria-hidden />
            </span>
            <span className="font-display text-2xl font-black leading-none">{priced ? formatINR(priced.pricing.total) : ''}</span>
          </button>
          <div id="checkout-summary" className={`space-y-4 ${summaryOpen ? 'mt-4' : 'hidden'} lg:mt-0 lg:block`}>
          <ul className="divide-y divide-line border border-line">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3 p-3">
                <span className="relative shrink-0">
                  <Img src={l.image} alt="" width={64} height={64} className="size-16 bg-bone object-cover" />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center bg-black text-xs font-bold text-white">{l.quantity}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{l.name}</span>
                  {l.variantLabel && <span className="block text-sm text-mute">{l.variantLabel}</span>}
                  {l.issue && <span className="block text-sm font-semibold text-danger">{l.issueText}</span>}
                </span>
                <span className="font-bold">{formatINR(l.lineTotal)}</span>
              </li>
            ))}
            {!priced && (
              <li className="p-3">
                <div className="skeleton h-16" />
              </li>
            )}
          </ul>
          <CouponBox coupon={priced && priced.coupon} onApply={buyNow ? applyBuyCoupon : undefined} onRemove={buyNow ? () => setBuyCoupon(null) : undefined} />
          {priced && <div className={pricing ? 'opacity-60' : ''}><PriceSummary pricing={priced.pricing} coupon={priced.coupon} itemCount={priced.itemCount} /></div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
