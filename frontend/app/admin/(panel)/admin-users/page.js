'use client';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Guard } from '@/components/admin/AdminShell';
import FormFields from '@/components/admin/FormFields';
import { ActiveBadge, Badge, Btn, Confirm, DataTable, PageTitle } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import { fieldErrors } from '@/lib/api';
import { adminApi } from '@/services/admin';
import { formatDateTime } from '@/utils/format';

function Admins() {
  const toast = useToast();
  const { admin: me } = useAdmin();
  const list = useAdminList('/admins');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  const isNew = editing === 'new';
  const fields = [
    { name: 'name', label: 'Full name', required: true },
    { name: 'email', label: 'Email (used to log in)', type: 'email', required: true },
    { name: 'role', label: 'Role', type: 'asyncSelect', endpoint: '/roles', placeholder: 'Choose role', required: true },
    { name: 'password', label: isNew ? 'Password' : 'New password', type: 'password', required: isNew, hint: isNew ? 'At least 8 characters with a letter and a number' : 'Leave empty to keep the current password' },
    { name: 'isActive', label: 'Can log in', type: 'checkbox', full: true },
  ];
  const open = (a) => {
    setErrors({});
    setEditing(a || 'new');
    setForm(a ? { name: a.name, email: a.email, role: a.role ? a.role._id : '', password: '', isActive: a.isActive } : { name: '', email: '', role: '', password: '', isActive: true });
  };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      const res = isNew ? await adminApi('/admins', { method: 'POST', body }) : await adminApi(`/admins/${editing._id}`, { method: 'PUT', body });
      toast.success(res.message);
      setEditing(null);
      list.reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    try {
      const res = await adminApi(`/admins/${removing._id}`, { method: 'DELETE' });
      toast.success(res.message);
      setRemoving(null);
      list.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'name', label: 'Admin', render: (r) => (<span><span className="font-semibold">{r.name}</span>{r._id === me.id && <span className="text-xs text-mute"> (you)</span>}<span className="block text-xs text-mute">{r.email}</span></span>) },
    { key: 'role', label: 'Role', render: (r) => <Badge tone={r.isSuperAdmin ? 'black' : 'outline'}>{r.role ? r.role.name : 'No role'}</Badge> },
    { key: 'lastLoginAt', label: 'Last login', render: (r) => (r.lastLoginAt ? formatDateTime(r.lastLoginAt) : 'Never') },
    { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} no="Disabled" /> },
    {
      key: '_a', label: '', align: 'right',
      render: (r) => (
        <span className="inline-flex gap-1">
          <button type="button" onClick={() => open(r)} aria-label={`Edit ${r.name}`} className="flex size-8 cursor-pointer items-center justify-center hover:bg-bone"><Pencil className="size-4" /></button>
          {r._id !== me.id && <button type="button" onClick={() => setRemoving(r)} aria-label={`Delete ${r.name}`} className="flex size-8 cursor-pointer items-center justify-center text-mute hover:text-danger"><Trash2 className="size-4" /></button>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageTitle title="Admin users" text="People who can log in to this panel. What each person can do is set by their role." crumbs={[{ label: 'Admin users' }]}>
        <Btn variant="lime" onClick={() => open(null)}><Plus className="size-4" aria-hidden />Add admin</Btn>
      </PageTitle>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={isNew ? 'Add admin' : 'Edit admin'} width="max-w-xl">
        <form onSubmit={save} noValidate>
          <FormFields fields={fields} form={form} onChange={setForm} errors={errors} />
          <Btn type="submit" variant="lime" loading={saving} className="mt-5">{isNew ? 'Create admin' : 'Save changes'}</Btn>
        </form>
      </Modal>
      <Confirm open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} title="Delete this admin?" text={removing ? `${removing.name} (${removing.email}) will lose access immediately.` : ''} action="Delete admin" />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['admins.manage']}>
      <Admins />
    </Guard>
  );
}
