import Link from 'next/link';
import { Check } from 'lucide-react';
import Img from '@/components/ui/Img';
import PriceSummary from '@/components/cart/PriceSummary';
import { formatDate, formatDateTime, formatINR } from '@/utils/format';

const FLOW = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const PAYMENT_TEXT = { pending: 'Awaiting payment', paid: 'Paid', failed: 'Payment failed', refund_initiated: 'Refund in progress', refunded: 'Refunded' };

export function StatusBadge({ status }) {
  const tone = status === 'Delivered' ? 'bg-lime text-black' : ['Cancelled', 'Failed', 'Refunded'].includes(status) ? 'bg-bone text-mute line-through' : 'bg-black text-white';
  return <span className={`tag ${tone}`}>{status}</span>;
}

function Timeline({ order }) {
  if (!FLOW.includes(order.status)) {
    const text = { Cancelled: `This order was cancelled${order.cancelledAt ? ` on ${formatDate(order.cancelledAt)}` : ''}.`, Refunded: 'This order was refunded to your original payment method.', Failed: 'Payment was not completed, so this order was not placed.', Pending: 'Waiting for payment.' }[order.status];
    return <p className="border-2 border-black px-4 py-3 font-semibold">{text}{order.paymentStatus === 'refund_initiated' ? ' Your refund is on its way and usually takes 5 to 7 working days.' : ''}</p>;
  }
  const current = FLOW.indexOf(order.status);
  const when = (s) => {
    const h = [...(order.statusHistory || [])].reverse().find((x) => x.status === s);
    return h ? formatDateTime(h.at) : '';
  };
  return (
    <ol className="grid gap-0 sm:grid-cols-6">
      {FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="relative flex gap-3 pb-5 sm:block sm:pb-0 sm:pr-2" aria-current={i === current ? 'step' : undefined}>
            <span className={`absolute left-[11px] top-6 h-full w-0.5 sm:left-6 sm:top-[11px] sm:h-0.5 sm:w-full ${i < current ? 'bg-black' : 'bg-line'} ${i === FLOW.length - 1 ? 'hidden' : ''}`} aria-hidden />
            <span className={`relative z-10 flex size-6 shrink-0 items-center justify-center ${done ? 'bg-black text-lime' : 'border-2 border-line bg-white'}`}>{done && <Check className="size-4" strokeWidth={3} aria-hidden />}</span>
            <span className="sm:mt-2 sm:block">
              <span className={`block text-[15px] leading-tight ${done ? 'font-bold' : 'text-mute'}`}>{s}</span>
              {done && when(s) && <span className="block text-xs text-mute">{when(s)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Shared by My Orders, guest order tracking and the order confirmation page.
export default function OrderView({ order, actions, reviewLinks = false }) {
  const a = order.shippingAddress || {};
  const t = order.tracking || {};
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <p className="text-sm text-mute">Order number</p>
          <p className="font-display text-4xl font-black leading-none sm:text-5xl">{order.orderNumber}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-mute">
            Placed {formatDateTime(order.placedAt || order.createdAt)}
            <StatusBadge status={order.status} />
            <span className="tag border border-line">{PAYMENT_TEXT[order.paymentStatus] || order.paymentStatus}</span>
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <Timeline order={order} />

      {t.trackingNumber && (
        <div className="bg-bone px-4 py-3 text-[15px]">
          <span className="font-bold">Tracking:</span> {t.carrier || 'Courier'} {t.trackingNumber}
          {t.trackingUrl && (
            <a href={t.trackingUrl} target="_blank" rel="noopener noreferrer" className="link ml-3 font-semibold">
              Track on courier site
            </a>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-2 font-display text-2xl font-black uppercase leading-none">Items</h2>
          <ul className="divide-y divide-line border-y border-line">
            {order.items.map((it) => (
              <li key={it.id || it.sku} className="flex gap-4 py-4">
                <Img src={it.image} alt="" width={72} height={72} className="size-[72px] shrink-0 bg-bone object-cover" />
                <div className="min-w-0 flex-1">
                  {it.slug ? (
                    <Link href={`/products/${it.slug}`} className="font-bold hover:underline">
                      {it.name}
                    </Link>
                  ) : (
                    <span className="font-bold">{it.name}</span>
                  )}
                  <p className="text-sm text-mute">
                    {it.variantLabel ? `${it.variantLabel}, ` : ''}Qty {it.quantity}, {formatINR(it.price)} each
                  </p>
                  {reviewLinks && order.status === 'Delivered' && it.slug && (
                    <Link href={`/products/${it.slug}#reviews`} className="link mt-1 inline-block text-sm font-semibold">
                      Write a review
                    </Link>
                  )}
                </div>
                <span className="font-bold">{formatINR(it.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-2 font-display text-2xl font-black uppercase leading-none">Delivering to</h2>
              <address className="text-[15px] not-italic leading-relaxed">
                <span className="font-bold">{a.fullName}</span>
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone}
              </address>
            </div>
            <div>
              <h2 className="mb-2 font-display text-2xl font-black uppercase leading-none">Shipping and payment</h2>
              <p className="text-[15px] leading-relaxed">
                {order.shippingMethod && order.shippingMethod.name}
                <br />
                {order.paymentMethod ? `Paid by ${order.paymentMethod.toUpperCase()} via Razorpay` : 'Razorpay'}
                <br />
                {order.customer && order.customer.email}
              </p>
            </div>
          </div>
        </div>
        <PriceSummary pricing={order.pricing} coupon={order.coupon} itemCount={order.itemCount} title="Payment summary" />
      </div>
    </div>
  );
}
