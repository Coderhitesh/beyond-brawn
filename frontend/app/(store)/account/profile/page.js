'use client';
import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import Field from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fieldErrors } from '@/lib/api';
import { updateProfile } from '@/services/account';
import { formatDate } from '@/utils/format';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await updateProfile(form);
      setUser(res.data.user);
      toast.success(res.message);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="display mb-6 text-5xl sm:text-6xl">Profile</h1>
      <form onSubmit={save} className="max-w-lg space-y-4" noValidate>
        <Field label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" error={errors.name} required />
        <Field label="Mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" autoComplete="tel-national" error={errors.phone} />
        <div>
          <Field label="Email" value={user.email} disabled readOnly />
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-lime-deep">
            <BadgeCheck className="size-4" aria-hidden />
            Email verified
          </p>
        </div>
        <Button type="submit" variant="lime" loading={saving}>
          Save changes
        </Button>
      </form>
      <p className="mt-8 text-sm text-mute">Customer since {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}. To change your email, contact support.</p>
    </>
  );
}
