import { formatINR } from '@/utils/format';

// The order's maths, set like the totals block on a label panel.
export default function PriceSummary({ pricing, coupon, itemCount, title = 'Order summary', children }) {
  if (!pricing) return null;
  const row = (label, value, cls = '') => (
    <div className={`facts-row ${cls}`}>
      <dt>{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
  return (
    <div className="facts">
      <div className="facts-title">{title}</div>
      <dl>
        {pricing.mrpTotal > pricing.subtotal && row(`MRP total${itemCount ? ` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})` : ''}`, formatINR(pricing.mrpTotal))}
        {pricing.productDiscount > 0 && row('Discount on MRP', `- ${formatINR(pricing.productDiscount)}`)}
        {row('Subtotal', formatINR(pricing.subtotal))}
        {pricing.couponDiscount > 0 && row(`Coupon${coupon && coupon.code ? ` (${coupon.code})` : ''}`, `- ${formatINR(pricing.couponDiscount)}`)}
        {row('Shipping', pricing.shipping > 0 ? formatINR(pricing.shipping) : 'Free')}
        {pricing.tax > 0 && row(pricing.taxInclusive ? 'GST (included)' : 'GST', formatINR(pricing.tax), pricing.taxInclusive ? 'text-mute' : '')}
        <div className="flex items-baseline justify-between gap-4 border-t-4 border-black px-4 py-3">
          <dt className="font-bold">Total</dt>
          <dd className="font-display text-4xl font-black leading-none tabular-nums">{formatINR(pricing.total)}</dd>
        </div>
      </dl>
      {children && <div className="border-t border-black/80 p-4">{children}</div>}
    </div>
  );
}
