'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useAdmin } from '@/context/AdminAuthContext';
import { Btn } from '@/components/admin/ui';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { admin, loading, login } = useAdmin();
  const raw = params.get('next') || '';
  const next = raw.startsWith('/admin') && !raw.startsWith('/admin/login') ? raw : '/admin';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && admin) router.replace(next);
  }, [loading, admin, router, next]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      router.replace(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p className="border-2 border-danger px-3 py-2.5 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="admin-email" className="alabel">Email</label>
        <input id="admin-email" type="email" autoComplete="username" required className="ainput h-11" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div>
        <label htmlFor="admin-password" className="alabel">Password</label>
        <input id="admin-password" type="password" autoComplete="current-password" required className="ainput h-11" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <Btn type="submit" variant="lime" loading={busy} className="h-11 w-full">
        <Lock className="size-4" aria-hidden />
        Log in to admin
      </Btn>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="on-dark flex min-h-dvh items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">
        <p className="mb-6 flex items-center gap-2 font-display text-4xl font-black uppercase leading-none text-white">
          <span className="h-9 w-2 bg-lime" aria-hidden />
          Beyond Brawn
        </p>
        <div className="border-t-[6px] border-lime bg-white p-6">
          <h1 className="font-display text-3xl font-black uppercase leading-none">Admin login</h1>
          <p className="mb-5 mt-1 text-sm text-mute">Staff only. Customers log in from the store.</p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
