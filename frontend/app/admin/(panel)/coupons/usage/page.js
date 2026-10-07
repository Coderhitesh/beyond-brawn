'use client';
import { useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { Guard } from '@/components/admin/AdminShell';
import { ActiveBadge, Btn, DataTable, ErrorBox, Loading, PageTitle, Stat } from '@/components/admin/ui';
import useAdminList from '@/hooks/useAdminList';
import useFetch from '@/hooks/useFetch';
import { adminApi } from '@/services/admin';
import { formatDateTime, formatINR } from '@/utils/format';

function UsageList({ coupon }) {
  const list = useAdminList(`/coupon-stats/${coupon._id}/usage`, {}, { limit: 15 });
  return (
    <DataTable
      minWidth={420} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} empty="This coupon has not been used yet."
      columns={[
        { key: 'order', label: 'Order', render: (r) => (r.order ? <Link href={`/admin/orders/${r.order._id}`} className="font-semibold underline">{r.order.orderNumber}</Link> : '') },
        { key: 'user', label: 'Customer', render: (r) => (r.user ? r.user.name : r.email) },
        { key: 'discount', label: 'Discount', align: 'right', render: (r) => formatINR(r.discount) },
        { key: 'createdAt', label: 'Used', render: (r) => formatDateTime(r.createdAt) },
      ]}
    />
  );
}

function Usage() {
  const { data, loading, error, reload } = useFetch(() => adminApi('/coupon-stats'));
  const [open, setOpen] = useState(null);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const items = data.items;
  const uses = items.reduce((s, c) => s + c.uses, 0);
  const given = items.reduce((s, c) => s + c.totalDiscount, 0);
  return (
    <>
      <PageTitle title="Coupon usage" crumbs={[{ label: 'Coupons', href: '/admin/coupons' }, { label: 'Usage statistics' }]} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Coupons" value={items.length} />
        <Stat label="Orders with a coupon" value={uses} />
        <Stat label="Discount given" value={formatINR(Math.round(given))} />
        <Stat label="Average discount" value={formatINR(uses ? Math.round(given / uses) : 0)} />
      </div>
      <DataTable
        rows={items} empty="No coupons yet."
        columns={[
          { key: 'code', label: 'Code', render: (r) => <span className="font-bold">{r.code}</span> },
          { key: 'value', label: 'Discount', render: (r) => (r.discountType === 'percentage' ? `${r.value}%` : formatINR(r.value)) },
          { key: 'uses', label: 'Orders', align: 'right', render: (r) => `${r.uses}${r.usageLimit ? ` / ${r.usageLimit}` : ''}` },
          { key: 'totalDiscount', label: 'Discount given', align: 'right', render: (r) => formatINR(r.totalDiscount) },
          { key: 'lastUsedAt', label: 'Last used', render: (r) => (r.lastUsedAt ? formatDateTime(r.lastUsedAt) : 'Never') },
          { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} /> },
          { key: '_a', label: '', align: 'right', render: (r) => <Btn variant="ghost" size="sm" disabled={!r.uses} onClick={() => setOpen(r)}>See orders</Btn> },
        ]}
      />
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.code} usage` : ''} width="max-w-2xl">
        {open && <UsageList coupon={open} />}
      </Modal>
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['coupons.manage']}>
      <Usage />
    </Guard>
  );
}
