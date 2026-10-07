'use client';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import { fieldErrors } from '@/lib/api';
import { adminApi } from '@/services/admin';
import { Guard } from './AdminShell';
import FormFields, { clearOptionCache } from './FormFields';
import { toForm, toPayload, validate } from './form-utils';
import { Btn, Confirm, DataTable, PageTitle, SearchBox, Select } from './ui';

/*
 * Config-driven list + create / edit drawer + delete for simple resources.
 * One component runs categories, brands, coupons, banners, FAQ, blog, pages and more.
 */
export default function ResourceManager({ title, text, crumbs, endpoint, perm, readPerms, columns, fields, defaults = {}, filters = [], searchable = true, singular = 'item', width = 'max-w-2xl', limit = 20, describe = (row) => row.name || row.title || row.code || row.question, extraActions }) {
  const toast = useToast();
  const { can } = useAdmin();
  const canManage = can(perm);
  const list = useAdminList(endpoint, {}, { limit });
  const [editing, setEditing] = useState(null); // null | { item? }
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const open = (item) => {
    setErrors({});
    setForm(toForm(fields, item || {}, defaults));
    setEditing({ item });
  };

  const save = async (e) => {
    e.preventDefault();
    const v = validate(fields.filter((f) => !f.showIf || f.showIf(form)), form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true);
    try {
      const body = toPayload(fields, form);
      const res = editing.item ? await adminApi(`${endpoint}/${editing.item._id}`, { method: 'PUT', body }) : await adminApi(endpoint, { method: 'POST', body });
      toast.success(res.message);
      clearOptionCache(endpoint);
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
    setDeleting(true);
    try {
      const res = await adminApi(`${endpoint}/${removing._id}`, { method: 'DELETE' });
      toast.success(res.message);
      clearOptionCache(endpoint);
      setRemoving(null);
      list.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const cols = [
    ...columns,
    {
      key: '_actions', label: '', align: 'right',
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          {extraActions && extraActions(row)}
          {canManage && (
            <>
              <button type="button" onClick={() => open(row)} aria-label={`Edit ${describe(row)}`} title="Edit" className="flex size-8 cursor-pointer items-center justify-center hover:bg-bone">
                <Pencil className="size-4" />
              </button>
              <button type="button" onClick={() => setRemoving(row)} aria-label={`Delete ${describe(row)}`} title="Delete" className="flex size-8 cursor-pointer items-center justify-center text-mute hover:text-danger">
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </span>
      ),
    },
  ];

  return (
    <Guard perms={readPerms || [perm]}>
      <PageTitle title={title} text={text} crumbs={crumbs}>
        {canManage && (
          <Btn variant="lime" onClick={() => open(null)}>
            <Plus className="size-4" aria-hidden />
            Add {singular}
          </Btn>
        )}
      </PageTitle>
      {(searchable || filters.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {searchable && <SearchBox value={list.query.q} onChange={(q) => list.setQuery({ q })} placeholder={`Search ${title.toLowerCase()}`} className="w-full sm:w-72" />}
          {filters.map((f) => (
            <Select key={f.key} label={f.label} placeholder={f.label} value={list.query[f.key]} onChange={(v) => list.setQuery({ [f.key]: v })} options={f.options} />
          ))}
        </div>
      )}
      <DataTable columns={cols} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} empty={`No ${title.toLowerCase()} yet.${canManage ? ` Use "Add ${singular}" to create the first one.` : ''}`} />

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing && editing.item ? `Edit ${singular}` : `Add ${singular}`} side="right" width={width}
        footer={
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn variant="lime" loading={saving} onClick={save}>Save {singular}</Btn>
          </div>
        }>
        <form onSubmit={save} noValidate>
          <FormFields fields={fields} form={form} onChange={setForm} errors={errors} />
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      <Confirm open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={remove} loading={deleting} title={`Delete this ${singular}?`} text={removing ? `"${describe(removing)}" will be removed permanently. This cannot be undone.` : ''} action={`Delete ${singular}`} />
    </Guard>
  );
}
