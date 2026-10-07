'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Trash2, X } from 'lucide-react';
import Stars from '@/components/ui/Stars';
import { Guard } from '@/components/admin/AdminShell';
import { Badge, Btn, Confirm, DataTable, PageTitle, Select, Tabs } from '@/components/admin/ui';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import { adminApi } from '@/services/admin';
import { formatDate } from '@/utils/format';

const TONE = { pending: 'amber', approved: 'green', rejected: 'red' };

function Reviews() {
  const params = useSearchParams();
  const toast = useToast();
  const list = useAdminList('/reviews', { status: params.get('status') || '' });
  const [selected, setSelected] = useState([]);
  const [removing, setRemoving] = useState(null);
  const [working, setWorking] = useState(false);

  const act = async (fn, clear = true) => {
    setWorking(true);
    try {
      const res = await fn();
      toast.success(res.message);
      if (clear) setSelected([]);
      setRemoving(null);
      list.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
    }
  };
  const setStatus = (id, status) => act(() => adminApi(`/reviews/${id}/status`, { method: 'PATCH', body: { status } }), false);
  const bulk = (action) => act(() => adminApi('/reviews/bulk', { method: 'POST', body: { ids: selected, action } }));

  const columns = [
    { key: 'product', label: 'Product', render: (r) => (<span><span className="font-semibold">{r.product ? r.product.name : 'Deleted product'}</span><span className="block text-xs text-mute">{r.user ? r.user.name : 'Deleted customer'}, {formatDate(r.createdAt)}</span></span>) },
    { key: 'rating', label: 'Rating', render: (r) => <Stars value={r.rating} /> },
    { key: 'comment', label: 'Review', className: 'max-w-md', render: (r) => (<span>{r.title && <span className="block font-semibold">{r.title}</span>}<span className="line-clamp-3 text-ink/85">{r.comment}</span>{r.images && r.images[0] && <a href={r.images[0]} target="_blank" rel="noopener noreferrer" className="text-xs underline">View photo</a>}</span>) },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Badge> },
    {
      key: '_a', label: '', align: 'right',
      render: (r) => (
        <span className="inline-flex gap-1">
          {r.status !== 'approved' && <Btn variant="ghost" size="sm" onClick={() => setStatus(r._id, 'approved')}><Check className="size-3.5" aria-hidden />Approve</Btn>}
          {r.status !== 'rejected' && <Btn variant="ghost" size="sm" onClick={() => setStatus(r._id, 'rejected')}><X className="size-3.5" aria-hidden />Reject</Btn>}
          <button type="button" onClick={() => setRemoving(r)} aria-label="Delete review" className="flex size-8 cursor-pointer items-center justify-center text-mute hover:text-danger"><Trash2 className="size-4" /></button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageTitle title="Reviews" text="Only customers who received the product can review it. Approved reviews show on the product page and count towards its rating." crumbs={[{ label: 'Reviews' }]} />
      <Tabs className="mb-3" value={list.query.status || ''} onChange={(v) => list.setQuery({ status: v })} tabs={[{ value: '', label: 'All' }, { value: 'pending', label: 'Waiting for approval', count: list.extra.pending }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select label="Rating" placeholder="Any rating" value={list.query.rating} onChange={(v) => list.setQuery({ rating: v })} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star` }))} />
        {selected.length > 0 && (
          <span className="flex flex-wrap items-center gap-2 bg-black px-3 py-1.5 text-white">
            <span className="text-sm font-semibold">{selected.length} selected</span>
            <Btn variant="lime" size="sm" loading={working} onClick={() => bulk('approved')}>Approve</Btn>
            <Btn variant="ghost" size="sm" onClick={() => bulk('rejected')}>Reject</Btn>
            <Btn variant="ghost" size="sm" onClick={() => bulk('delete')}>Delete</Btn>
          </span>
        )}
      </div>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} selection={{ ids: selected, onChange: setSelected }} minWidth={900} empty="No reviews here." />
      <Confirm open={Boolean(removing)} onClose={() => setRemoving(null)} loading={working} onConfirm={() => act(() => adminApi(`/reviews/${removing._id}`, { method: 'DELETE' }))} title="Delete this review?" text="The review is removed permanently and the product rating is recalculated. To hide it without deleting, reject it instead." action="Delete review" />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['reviews.manage']}>
      <Reviews />
    </Guard>
  );
}
