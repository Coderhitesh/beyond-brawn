'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import Img from '@/components/ui/Img';
import { Guard } from '@/components/admin/AdminShell';
import { Btn, Card, Confirm, ErrorBox, Loading, OrderBadge, PageTitle, PayBadge, Toggle } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import { adminApi } from '@/services/admin';
import { formatDateTime, formatINR } from '@/utils/format';

const EMAILED = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
const label = (s) => (s === 'Confirmed' ? 'To process' : s);

function UpdateCard({ order, allowed, onSaved }) {
  const toast = useToast();
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' });
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    setStatus(order.status);
    setTracking({ carrier: '', trackingNumber: '', trackingUrl: '', ...(order.tracking || {}) });
    setNote('');
  }, [order]);

  const changed = status !== order.status;
  const save = async () => {
    setSaving(true);
    try {
      const res = await adminApi(`/orders/${order._id}/status`, { method: 'PATCH', body: { status, note: note.trim() || undefined, notifyCustomer: notify, tracking } });
      toast.success(changed ? `${res.message}${notify && EMAILED.includes(status) ? '. Customer emailed.' : ''}` : 'Tracking saved');
      setConfirmCancel(false);
      onSaved(res.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  const submit = () => (status === 'Cancelled' && changed ? setConfirmCancel(true) : save());
  const showTracking = ['Shipped', 'Out for Delivery', 'Delivered'].includes(status) || ['Packed', 'Shipped', 'Out for Delivery'].includes(order.status);

  if (!allowed.length && !showTracking) return <Card title="Update order"><p className="text-sm text-mute">This order is {order.status.toLowerCase()}. No further status changes are possible.</p></Card>;
  return (
    <Card title="Update order">
      <div className="space-y-3">
        {allowed.length > 0 && (
          <div>
            <label htmlFor="o-status" className="alabel">Status</label>
            <select id="o-status" className="ainput cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value={order.status}>{label(order.status)} (current)</option>
              {allowed.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
        )}
        {showTracking && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="o-carrier" className="alabel">Courier</label>
                <input id="o-carrier" className="ainput" placeholder="Delhivery" value={tracking.carrier || ''} onChange={(e) => setTracking({ ...tracking, carrier: e.target.value })} />
              </div>
              <div>
                <label htmlFor="o-awb" className="alabel">Tracking number</label>
                <input id="o-awb" className="ainput" value={tracking.trackingNumber || ''} onChange={(e) => setTracking({ ...tracking, trackingNumber: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="o-url" className="alabel">Tracking link (optional)</label>
              <input id="o-url" className="ainput" placeholder="https://" value={tracking.trackingUrl || ''} onChange={(e) => setTracking({ ...tracking, trackingUrl: e.target.value })} />
            </div>
          </>
        )}
        {changed && (
          <>
            <div>
              <label htmlFor="o-note" className="alabel">{status === 'Cancelled' ? 'Reason (shown to the customer)' : 'Internal note (optional)'}</label>
              <input id="o-note" className="ainput" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            </div>
            {EMAILED.includes(status) && status !== 'Cancelled' && <Toggle checked={notify} onChange={setNotify} label="Email the customer" hint={`Sends the "${status}" email with tracking details`} />}
          </>
        )}
        <Btn variant="lime" className="w-full" loading={saving} onClick={submit} disabled={!changed && !showTracking}>
          {changed ? `Save and mark ${label(status).toLowerCase()}` : showTracking ? 'Save tracking' : 'Choose the next status above'}
        </Btn>
      </div>
      <Confirm open={confirmCancel} onClose={() => setConfirmCancel(false)} onConfirm={save} loading={saving} title="Cancel this order?" action="Cancel order" text={`Stock goes back on sale and the customer is emailed.${order.paymentStatus === 'paid' ? ` A full refund of ${formatINR(order.pricing.total)} is started automatically through Razorpay.` : ''} This cannot be undone.`} />
    </Card>
  );
}

function RefundCard({ order, payment, onSaved }) {
  const toast = useToast();
  const refunded = ((payment && payment.refunds) || []).filter((r) => r.status !== 'failed').reduce((s, r) => s + r.amount, 0);
  const refundable = payment ? Math.round((payment.amount - refunded) * 100) / 100 : 0;
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [working, setWorking] = useState(false);
  if (!payment || !['paid', 'refund_initiated', 'refunded'].includes(payment.status)) return null;
  const value = amount === '' ? refundable : Number(amount);

  const run = async (path, body) => {
    setWorking(true);
    try {
      const res = await adminApi(`/orders/${order._id}${path}`, { method: 'POST', body });
      toast.success(res.message);
      setConfirm(false);
      setAmount('');
      onSaved();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card title="Refund">
      {payment.refunds.length > 0 && (
        <ul className="mb-3 space-y-1 text-sm">
          {payment.refunds.map((r) => (
            <li key={r.refundId} className="flex justify-between gap-3">
              <span>{formatINR(r.amount)} <span className="text-mute">{formatDateTime(r.at)}</span></span>
              <span className="font-semibold">{r.status === 'processed' ? 'Completed' : r.status === 'initiated' ? 'In progress' : r.status}</span>
            </li>
          ))}
        </ul>
      )}
      {refundable > 0 ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="r-amount" className="alabel">Amount (₹)</label>
            <input id="r-amount" type="number" min="1" max={refundable} className="ainput" placeholder={String(refundable)} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="ahint">Up to {formatINR(refundable)}. Leave empty for the full amount.</p>
          </div>
          <div>
            <label htmlFor="r-note" className="alabel">Reason (optional)</label>
            <input id="r-note" className="ainput" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          </div>
          <Btn variant="danger" className="w-full" disabled={!(value > 0) || value > refundable} onClick={() => setConfirm(true)}>Refund {formatINR(value)}</Btn>
        </div>
      ) : (
        <p className="text-sm text-mute">Fully refunded.</p>
      )}
      {payment.status === 'refund_initiated' && (
        <Btn variant="ghost" size="sm" className="mt-3 w-full" loading={working} onClick={() => run('/refund/complete')}>Mark refund as completed</Btn>
      )}
      <Confirm open={confirm} onClose={() => setConfirm(false)} loading={working} onConfirm={() => run('/refund', { ...(amount !== '' ? { amount: Number(amount) } : {}), note: note.trim() || undefined })} title={`Refund ${formatINR(value)}?`} action="Send refund" text="The money is returned to the customer's original payment method through Razorpay and they are emailed. This cannot be reversed." />
    </Card>
  );
}

function OrderDetail({ id }) {
  const { can } = useAdmin();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = () => adminApi(`/orders/${id}`).then((r) => { setData(r.data); setError(null); }).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <Loading />;
  const { order, payment, allowedStatuses } = data;
  const a = order.shippingAddress || {};
  const p = order.pricing;
  const line = (k, v, bold) => (<div className={`flex justify-between gap-4 py-1 ${bold ? 'border-t border-black pt-2 text-base font-bold' : ''}`}><dt className={bold ? '' : 'text-mute'}>{k}</dt><dd className="tabular-nums">{v}</dd></div>);

  return (
    <>
      <PageTitle title={order.orderNumber} text={`Placed ${formatDateTime(order.placedAt || order.createdAt)}`} crumbs={[{ label: 'Orders', href: '/admin/orders' }, { label: order.orderNumber }]}>
        <OrderBadge status={order.status} />
        <PayBadge status={order.paymentStatus} />
        {order.placedAt && <a href={`/api/admin/orders/${order._id}/invoice`} target="_blank" rel="noopener noreferrer" className="abtn abtn-ghost"><FileText className="size-4" aria-hidden />Invoice</a>}
      </PageTitle>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <Card title={`Items (${order.itemCount})`} pad={false}>
            <div className="overflow-x-auto">
              <table className="atable">
                <thead><tr><th>Product</th><th className="hidden sm:table-cell">SKU</th><th className="hidden text-right! sm:table-cell">Price</th><th className="text-right!">Qty</th><th className="text-right!">Total</th></tr></thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it._id}>
                      <td><span className="flex items-center gap-3"><Img src={it.image} alt="" width={40} height={40} className="size-10 shrink-0 bg-bone object-cover" /><span><Link href={`/admin/products/${it.product}`} className="font-semibold hover:underline">{it.name}</Link>{it.variantLabel && <span className="block text-xs text-mute">{it.variantLabel}</span>}<span className="block text-xs text-mute sm:hidden">{it.sku}, {formatINR(it.price)} each</span></span></span></td>
                      <td className="hidden text-mute sm:table-cell">{it.sku}</td>
                      <td className="hidden text-right tabular-nums sm:table-cell">{formatINR(it.price)}</td>
                      <td className="text-right font-bold tabular-nums">{it.quantity}</td>
                      <td className="text-right font-semibold tabular-nums">{formatINR(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto max-w-xs p-4 text-sm">
              {line('Subtotal', formatINR(p.subtotal))}
              {p.couponDiscount > 0 && line(`Coupon ${order.coupon && order.coupon.code ? order.coupon.code : ''}`, `- ${formatINR(p.couponDiscount)}`)}
              {line(`Shipping${order.shippingMethod ? ` (${order.shippingMethod.name})` : ''}`, p.shipping ? formatINR(p.shipping) : 'Free')}
              {line(p.taxInclusive ? 'GST (included)' : 'GST', formatINR(p.tax))}
              {line('Total', formatINR(p.total), true)}
            </dl>
          </Card>

          <Card title="History">
            <ol className="space-y-3">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className={`mt-1.5 size-2.5 shrink-0 ${i === 0 ? 'bg-lime outline-1 outline-black' : 'bg-line'}`} aria-hidden />
                  <span>
                    <span className="font-semibold">{label(h.status)}</span>
                    {h.note && <span className="text-ink/80">: {h.note}</span>}
                    <span className="block text-xs text-mute">{formatDateTime(h.at)}{h.by ? `, ${h.by}` : ''}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          {order.notes && <Card title="Delivery note from customer"><p className="text-sm">{order.notes}</p></Card>}
        </div>

        <div className="space-y-4">
          {can('orders.manage') && <UpdateCard order={order} allowed={allowedStatuses} onSaved={load} />}
          {can('refunds.manage') && <RefundCard order={order} payment={payment} onSaved={load} />}
          <Card title="Customer">
            <p className="text-sm leading-relaxed">
              <span className="font-bold">{order.customer.name}</span>{order.isGuest ? ' (guest checkout)' : ''}<br />
              <a href={`mailto:${order.customer.email}`} className="underline">{order.customer.email}</a><br />
              <a href={`tel:${order.customer.phone}`} className="underline">{order.customer.phone}</a>
            </p>
            {order.user && can('customers.view', 'customers.manage') && <Link href={`/admin/customers/${order.user._id}`} className="mt-2 inline-block text-[13px] font-semibold underline">View customer</Link>}
          </Card>
          <Card title="Ship to">
            <address className="text-sm not-italic leading-relaxed">
              <span className="font-bold">{a.fullName}</span>, {a.phone}<br />
              {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
              {a.city}, {a.state} {a.pincode}<br />
              {a.country}
            </address>
          </Card>
          {payment && (
            <Card title="Payment">
              <dl className="space-y-1 text-sm">
                {line('Method', (payment.method || 'Razorpay').toUpperCase())}
                {line('Amount', formatINR(payment.amount))}
                {payment.paidAt && line('Paid', formatDateTime(payment.paidAt))}
              </dl>
              <p className="mt-2 break-all text-xs text-mute">Razorpay order {payment.razorpayOrderId}{payment.razorpayPaymentId ? `, payment ${payment.razorpayPaymentId}` : ''}</p>
              {payment.failureReason && <p className="mt-1 text-xs text-danger">Last failure: {payment.failureReason}</p>}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

export default function Page({ params }) {
  const { id } = use(params);
  return (
    <Guard perms={['orders.view', 'orders.manage']}>
      <OrderDetail id={id} />
    </Guard>
  );
}
