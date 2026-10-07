'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { Guard } from '@/components/admin/AdminShell';
import { Btn, DataTable, OrderBadge, PageTitle, PayBadge, SearchBox, Select, Tabs } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import { adminApi, exportUrl } from '@/services/admin';
import { formatDateTime, formatINR } from '@/utils/format';

const STATUS_TABS = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded', 'Failed'];
const NEXT = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

function Orders() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { can } = useAdmin();
  const status = params.get('status') || '';
  const refunds = params.get('refunds') === 'true';
  const customer = params.get('customer') || '';
  const list = useAdminList('/orders', { status, refunds: refunds ? 'true' : '', customer });
  const counts = list.extra.counts || {};
  const [selected, setSelected] = useState([]);
  const [bulk, setBulk] = useState('');
  const [working, setWorking] = useState(false);

  const go = (v) => router.push(v === 'refunds' ? '/admin/orders?refunds=true' : v ? `/admin/orders?status=${encodeURIComponent(v)}` : '/admin/orders');
  const applyBulk = async () => {
    setWorking(true);
    try {
      const res = await adminApi('/orders/bulk-status', { method: 'POST', body: { ids: selected, action: 'status', value: bulk } });
      const failed = res.data.results.filter((r) => !r.ok);
      if (failed.length) toast.error(`${res.message}. ${failed[0].message}`);
      else toast.success(`${res.message}. Customers were emailed.`);
      setSelected([]);
      setBulk('');
      list.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
    }
  };

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (r) => (<span><Link href={`/admin/orders/${r._id}`} className="font-bold hover:underline">{r.orderNumber}</Link><span className="block text-xs text-mute">{formatDateTime(r.placedAt || r.createdAt)}</span></span>) },
    { key: 'customer', label: 'Customer', render: (r) => (<span><span className="font-semibold">{r.customer.name}</span>{r.isGuest && <span className="text-xs text-mute"> (guest)</span>}<span className="block text-xs text-mute">{r.customer.phone || r.customer.email}</span></span>) },
    { key: 'itemCount', label: 'Items', align: 'right' },
    { key: 'total', label: 'Total', align: 'right', render: (r) => <span className="font-semibold">{formatINR(r.pricing.total)}</span> },
    { key: 'paymentStatus', label: 'Payment', render: (r) => <PayBadge status={r.paymentStatus} /> },
    { key: 'status', label: 'Status', render: (r) => <OrderBadge status={r.status} /> },
    { key: 'tracking', label: 'Tracking', render: (r) => (r.tracking && r.tracking.trackingNumber ? <span className="text-xs">{r.tracking.carrier} {r.tracking.trackingNumber}</span> : '') },
    { key: '_a', label: '', align: 'right', render: (r) => <Link href={`/admin/orders/${r._id}`} className="abtn abtn-ghost abtn-sm">Open</Link> },
  ];
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <>
      <PageTitle title={refunds ? 'Refunds' : 'Orders'} crumbs={[{ label: 'Orders' }]}>
        <a href={exportUrl('/orders', list.query)} className="abtn abtn-ghost"><Download className="size-4" aria-hidden />Export CSV</a>
      </PageTitle>
      <Tabs className="mb-3" value={refunds ? 'refunds' : status} onChange={go} tabs={[{ value: '', label: 'All', count: total }, ...STATUS_TABS.map((s) => ({ value: s, label: s === 'Confirmed' ? 'To process' : s, count: counts[s] || 0 })), { value: 'refunds', label: 'Refunds' }]} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={list.query.q} onChange={(q) => list.setQuery({ q })} placeholder="Order number, name, email, phone, tracking" className="w-full sm:w-80" />
        {!refunds && <Select label="Payment" placeholder="Any payment" value={list.query.paymentStatus} onChange={(v) => list.setQuery({ paymentStatus: v })} options={[{ value: 'paid', label: 'Paid' }, { value: 'failed', label: 'Failed' }, { value: 'refund_initiated', label: 'Refund started' }, { value: 'refunded', label: 'Refunded' }]} />}
        <label className="flex items-center gap-1.5 text-[13px] text-mute">From<input type="date" className="ainput w-auto" value={list.query.from || ''} onChange={(e) => list.setQuery({ from: e.target.value })} /></label>
        <label className="flex items-center gap-1.5 text-[13px] text-mute">To<input type="date" className="ainput w-auto" value={list.query.to || ''} onChange={(e) => list.setQuery({ to: e.target.value })} /></label>
        {customer && <Link href="/admin/orders" className="text-[13px] font-semibold underline">Showing one customer. Show all</Link>}
      </div>
      {can('orders.manage') && selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 bg-black px-3 py-2 text-white">
          <span className="text-sm font-semibold">{selected.length} selected</span>
          <Select label="Move to status" placeholder="Move to status" value={bulk} onChange={setBulk} options={NEXT} className="h-8 text-black" />
          <Btn variant="lime" size="sm" disabled={!bulk} loading={working} onClick={applyBulk}>Apply and email customers</Btn>
          <button type="button" onClick={() => setSelected([])} className="ml-auto cursor-pointer text-sm underline">Clear selection</button>
        </div>
      )}
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} selection={can('orders.manage') ? { ids: selected, onChange: setSelected } : undefined} minWidth={960} empty="No orders match." />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['orders.view', 'orders.manage']}>
      <Orders />
    </Guard>
  );
}
