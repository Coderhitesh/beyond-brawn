'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import PasswordField from '@/components/account/PasswordField';
import { useToast } from '@/context/ToastContext';
import { fieldErrors } from '@/lib/api';
import { changePassword } from '@/services/auth';

export default function ChangePasswordPage() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await changePassword(form);
      toast.success(res.message);
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(Object.keys(fe).length ? fe : { currentPassword: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="display mb-2 text-5xl sm:text-6xl">Change password</h1>
      <p className="mb-6 text-mute">Changing your password signs you out on your other devices.</p>
      <form onSubmit={save} className="max-w-lg space-y-4" noValidate>
        <PasswordField label="Current password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} error={errors.currentPassword} required />
        <PasswordField label="New password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} error={errors.newPassword} hint="At least 8 characters with a letter and a number" required />
        <Button type="submit" variant="lime" loading={saving}>
          Change password
        </Button>
      </form>
    </>
  );
}
