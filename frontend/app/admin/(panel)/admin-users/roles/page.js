'use client';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Guard } from '@/components/admin/AdminShell';
import { clearOptionCache } from '@/components/admin/FormFields';
import { Badge, Btn, Confirm, DataTable, PageTitle } from '@/components/admin/ui';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import useFetch from '@/hooks/useFetch';
import { adminApi } from '@/services/admin';

function Roles() {
  const toast = useToast();
  const list = useAdminList('/roles');
  const perms = useFetch(() => adminApi('/permissions'));
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const groups = perms.data ? perms.data.groups : {};
  const total = perms.data ? perms.data.items.length : 0;
  const isNew = editing === 'new';
  const locked = editing && editing !== 'new' && editing.slug === 'super-admin';

  const open = (r) => {
    setEditing(r || 'new');
    setForm(r ? { name: r.name, description: r.description || '', permissions: [...r.permissions] } : { name: '', description: '', permissions: ['dashboard.view'] });
  };
  const toggle = (key) => setForm((f) => ({ ...f, permissions: f.permissions.includes(key) ? f.permissions.filter((k) => k !== key) : [...f.permissions, key] }));
  const toggleGroup = (keys) => setForm((f) => ({ ...f, permissions: keys.every((k) => f.permissions.includes(k)) ? f.permissions.filter((k) => !keys.includes(k)) : [...new Set([...f.permissions, ...keys])] }));

  const save = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Enter a role name');
    setSaving(true);
    try {
      const res = isNew ? await adminApi('/roles', { method: 'POST', body: form }) : await adminApi(`/roles/${editing._id}`, { method: 'PUT', body: form });
      toast.success(res.message);
      clearOptionCache('/roles');
      setEditing(null);
      list.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
    return null;
  };
  const remove = async () => {
    try {
      const res = await adminApi(`/roles/${removing._id}`, { method: 'DELETE' });
      toast.success(res.message);
      clearOptionCache('/roles');
      setRemoving(null);
      list.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'name', label: 'Role', render: (r) => (<span><span className="font-semibold">{r.name}</span><span className="block text-xs text-mute">{r.description}</span></span>) },
    { key: 'permissions', label: 'Access', render: (r) => (r.slug === 'super-admin' ? 'Everything' : `${r.permissions.length} of ${total} permissions`) },
    { key: 'admins', label: 'Admins', align: 'right' },
    { key: 'isSystem', label: 'Type', render: (r) => <Badge tone={r.isSystem ? 'grey' : 'outline'}>{r.isSystem ? 'Built in' : 'Custom'}</Badge> },
    {
      key: '_a', label: '', align: 'right',
      render: (r) => (
        <span className="inline-flex gap-1">
          <button type="button" onClick={() => open(r)} aria-label={`Edit ${r.name}`} className="flex size-8 cursor-pointer items-center justify-center hover:bg-bone"><Pencil className="size-4" /></button>
          {!r.isSystem && <button type="button" onClick={() => setRemoving(r)} aria-label={`Delete ${r.name}`} className="flex size-8 cursor-pointer items-center justify-center text-mute hover:text-danger"><Trash2 className="size-4" /></button>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageTitle title="Roles and permissions" text="A role is a set of permissions. Give each admin the role that matches their job." crumbs={[{ label: 'Admin users', href: '/admin/admin-users' }, { label: 'Roles' }]}>
        <Btn variant="lime" onClick={() => open(null)}><Plus className="size-4" aria-hidden />Add role</Btn>
      </PageTitle>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={isNew ? 'Add role' : `Edit ${form.name}`} side="right" width="max-w-2xl"
        footer={!locked && <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn><Btn variant="lime" loading={saving} onClick={save}>Save role</Btn></div>}>
        <form onSubmit={save} className="space-y-4">
          {locked && <p className="bg-bone px-3 py-2 text-sm">Super Admin always has every permission and cannot be changed.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="role-name" className="alabel">Role name</label>
              <input id="role-name" className="ainput" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={locked || (editing && editing !== 'new' && editing.isSystem)} />
            </div>
            <div>
              <label htmlFor="role-desc" className="alabel">Description</label>
              <input id="role-desc" className="ainput" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={locked} />
            </div>
          </div>
          {Object.entries(groups).map(([group, items]) => {
            const keys = items.map((i) => i.key);
            const all = keys.every((k) => form.permissions.includes(k));
            return (
              <fieldset key={group} className="border border-line" disabled={locked}>
                <legend className="sr-only">{group}</legend>
                <label className="flex cursor-pointer items-center gap-2.5 border-b border-line bg-bone px-3 py-2 text-sm font-bold">
                  <input type="checkbox" className="size-4 accent-black" checked={locked || all} onChange={() => toggleGroup(keys)} />
                  {group}
                </label>
                <div className="grid gap-x-4 gap-y-2 p-3 sm:grid-cols-2">
                  {items.map((p) => (
                    <label key={p.key} className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <input type="checkbox" className="size-4 accent-black" checked={locked || form.permissions.includes(p.key)} onChange={() => toggle(p.key)} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>
      </Modal>
      <Confirm open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} title="Delete this role?" text={removing ? `"${removing.name}" will be deleted. Roles that still have admins cannot be deleted.` : ''} action="Delete role" />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['admins.manage']}>
      <Roles />
    </Guard>
  );
}
