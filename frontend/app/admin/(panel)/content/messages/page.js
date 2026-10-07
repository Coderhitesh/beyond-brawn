'use client';
import { useState } from 'react';
import { Mail, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Guard } from '@/components/admin/AdminShell';
import { Badge, Btn, Confirm, DataTable, PageTitle, Tabs } from '@/components/admin/ui';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import { adminApi } from '@/services/admin';
import { formatDateTime } from '@/utils/format';

const TONE = { new: 'green', read: 'grey', replied: 'outline' };
const TEXT = { new: 'New', read: 'Read', replied: 'Replied' };

function Messages() {
  const toast = useToast();
  const list = useAdminList('/messages');
  const [open, setOpen] = useState(null);
  const [removing, setRemoving] = useState(null);

  const setStatus = async (m, status, quiet) => {
    try {
      const res = await adminApi(`/messages/${m._id}`, { method: 'PATCH', body: { status } });
      if (!quiet) toast.success(res.message);
      setOpen((cur) => (cur && cur._id === m._id ? res.data.item : cur));
      list.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const view = (m) => {
    setOpen(m);
    if (m.status === 'new') setStatus(m, 'read', true);
  };
  const remove = async () => {
    try {
      const res = await adminApi(`/messages/${removing._id}`, { method: 'DELETE' });
      toast.success(res.message);
      setRemoving(null);
      setOpen(null);
      list.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { key: 'name', label: 'From', render: (r) => (<span><span className={r.status === 'new' ? 'font-bold' : 'font-semibold'}>{r.name}</span><span className="block text-xs text-mute">{r.email}</span></span>) },
    { key: 'message', label: 'Message', className: 'max-w-lg', render: (r) => (<button type="button" onClick={() => view(r)} className="cursor-pointer text-left">{r.subject && <span className="block font-semibold">{r.subject}</span>}<span className="line-clamp-2 text-ink/85">{r.message}</span></button>) },
    { key: 'createdAt', label: 'Received', render: (r) => formatDateTime(r.createdAt) },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={TONE[r.status]}>{TEXT[r.status]}</Badge> },
    { key: '_a', label: '', align: 'right', render: (r) => <Btn variant="ghost" size="sm" onClick={() => view(r)}>Open</Btn> },
  ];
  return (
    <>
      <PageTitle title="Messages" text="Sent from the contact form on the store." crumbs={[{ label: 'Content' }, { label: 'Messages' }]} />
      <Tabs className="mb-3" value={list.query.status || ''} onChange={(v) => list.setQuery({ status: v })} tabs={[{ value: '', label: 'All' }, { value: 'new', label: 'New', count: list.extra.unread }, { value: 'read', label: 'Read' }, { value: 'replied', label: 'Replied' }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} empty="No messages." />
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open ? open.subject || `Message from ${open.name}` : ''} width="max-w-xl"
        footer={open && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setRemoving(open)} className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-danger"><Trash2 className="size-4" aria-hidden />Delete</button>
            <span className="flex gap-2">
              {open.status !== 'replied' && <Btn variant="ghost" onClick={() => setStatus(open, 'replied')}>Mark as replied</Btn>}
              <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || 'Your message to Beyond Brawn'}`)}`} className="abtn abtn-lime"><Mail className="size-4" aria-hidden />Reply by email</a>
            </span>
          </div>
        )}>
        {open && (
          <>
            <p className="text-sm text-mute">
              <span className="font-semibold text-ink">{open.name}</span>, <a href={`mailto:${open.email}`} className="underline">{open.email}</a>{open.phone ? `, ${open.phone}` : ''}<br />
              {formatDateTime(open.createdAt)}
            </p>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">{open.message}</p>
          </>
        )}
      </Modal>
      <Confirm open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} title="Delete this message?" text="The message is removed permanently." action="Delete message" />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['messages.manage']}>
      <Messages />
    </Guard>
  );
}
