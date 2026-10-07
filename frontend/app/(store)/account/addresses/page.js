'use client';
import { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, Lines } from '@/components/ui/States';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import AddressForm, { EMPTY_ADDRESS, validateAddress } from '@/components/checkout/AddressForm';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import { fieldErrors } from '@/lib/api';
import { createAddress, deleteAddress, listAddresses, updateAddress } from '@/services/account';

export default function AddressesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(listAddresses);
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [meta, setMeta] = useState({ label: 'Home', isDefault: false });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  const open = (a) => {
    setErrors({});
    setEditing(a || 'new');
    setForm(a ? { fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode, country: a.country || 'India' } : EMPTY_ADDRESS);
    setMeta({ label: (a && a.label) || 'Home', isDefault: Boolean(a && a.isDefault) });
  };

  const save = async (e) => {
    e.preventDefault();
    const v = validateAddress(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true);
    try {
      const body = { ...form, ...meta };
      const res = editing === 'new' ? await createAddress(body) : await updateAddress(editing._id, body);
      toast.success(res.message);
      setEditing(null);
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      const res = await deleteAddress(removing._id);
      toast.success(res.message);
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="display text-5xl sm:text-6xl">Addresses</h1>
        <button type="button" className="btn btn-sm btn-black" onClick={() => open(null)}>
          <Plus className="size-4" aria-hidden />
          Add address
        </button>
      </div>
      {loading && <Lines rows={2} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.addresses.length === 0 && <EmptyState icon={MapPin} title="No saved addresses" text="Save an address to check out faster next time." action="Add address" onAction={() => open(null)} />}
      {data && data.addresses.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.addresses.map((a) => (
            <li key={a._id} className={`flex flex-col border p-4 ${a.isDefault ? 'border-2 border-black' : 'border-line'}`}>
              <p className="mb-2 flex items-center gap-2">
                <span className="tag bg-bone">{a.label}</span>
                {a.isDefault && <span className="tag bg-lime">Default</span>}
              </p>
              <address className="flex-1 text-[15px] not-italic leading-relaxed">
                <span className="font-bold">{a.fullName}</span>
                <br />
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone}
              </address>
              <div className="mt-3 flex gap-4 border-t border-line pt-3 text-sm font-semibold">
                <button type="button" onClick={() => open(a)} className="flex cursor-pointer items-center gap-1.5 hover:underline">
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </button>
                <button type="button" onClick={() => setRemoving(a)} className="flex cursor-pointer items-center gap-1.5 text-mute hover:text-danger">
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add address' : 'Edit address'} width="max-w-2xl">
        <form onSubmit={save} className="space-y-5" noValidate>
          <AddressForm value={form} onChange={setForm} errors={errors} />
          <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <legend className="label">Address type</legend>
            {['Home', 'Work', 'Other'].map((l) => (
              <label key={l} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="label" checked={meta.label === l} onChange={() => setMeta({ ...meta, label: l })} className="size-[18px] accent-black" />
                {l}
              </label>
            ))}
          </fieldset>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={meta.isDefault} onChange={(e) => setMeta({ ...meta, isDefault: e.target.checked })} className="size-[18px] accent-black" />
            Use as my default address
          </label>
          <Button type="submit" variant="lime" loading={saving} className="w-full sm:w-auto">
            Save address
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Delete this address?"
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setRemoving(null)}>
              Keep address
            </button>
            <button type="button" className="btn btn-sm btn-black" onClick={remove}>
              Delete address
            </button>
          </div>
        }
      >
        {removing && (
          <p>
            {removing.fullName}, {removing.line1}, {removing.city} {removing.pincode}
          </p>
        )}
      </Modal>
    </>
  );
}
