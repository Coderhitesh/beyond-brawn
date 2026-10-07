'use client';
import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Guard } from '@/components/admin/AdminShell';
import { ActiveBadge, Confirm, DataTable, PageTitle, SearchBox } from '@/components/admin/ui';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import { adminApi, exportUrl } from '@/services/admin';
import { formatDate } from '@/utils/format';

function Newsletter() {
  const toast = useToast();
  const list = useAdminList('/newsletter', {}, { limit: 30 });
  const [removing, setRemoving] = useState(null);
  const remove = async () => {
    try {
      const res = await adminApi(`/newsletter/${removing._id}`, { method: 'DELETE' });
      toast.success(res.message);
      setRemoving(null);
      list.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <>
      <PageTitle title="Newsletter" text={`${list.meta ? list.meta.total : 0} subscribers. Export the list to send campaigns from your email tool.`} crumbs={[{ label: 'Marketing' }, { label: 'Newsletter' }]}>
        <a href={exportUrl('/newsletter', list.query)} className="abtn abtn-lime"><Download className="size-4" aria-hidden />Export CSV</a>
      </PageTitle>
      <div className="mb-3">
        <SearchBox value={list.query.q} onChange={(q) => list.setQuery({ q })} placeholder="Search email" className="w-full sm:w-72" />
      </div>
      <DataTable
        minWidth={480} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} empty="No subscribers yet. The sign-up form is on the homepage."
        columns={[
          { key: 'email', label: 'Email', render: (r) => <span className="font-semibold">{r.email}</span> },
          { key: 'createdAt', label: 'Subscribed', render: (r) => formatDate(r.createdAt) },
          { key: 'isSubscribed', label: 'Status', render: (r) => <ActiveBadge on={r.isSubscribed} yes="Subscribed" no="Unsubscribed" /> },
          { key: '_a', label: '', align: 'right', render: (r) => <button type="button" onClick={() => setRemoving(r)} aria-label={`Remove ${r.email}`} className="flex size-8 cursor-pointer items-center justify-center text-mute hover:text-danger"><Trash2 className="size-4" /></button> },
        ]}
      />
      <Confirm open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} title="Remove this subscriber?" text={removing ? `${removing.email} will be removed from the list.` : ''} action="Remove" />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['marketing.manage']}>
      <Newsletter />
    </Guard>
  );
}
