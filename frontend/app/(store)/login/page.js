import { Suspense } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/account/AuthShell';
import { LoginForm } from '@/components/account/AuthForms';
import { getSettings } from '@/lib/server-api';

export const metadata = { title: 'Log in', robots: { index: false } };

export default async function Page() {
  const settings = await getSettings();
  return (
    <AuthShell title="Log in" text="Welcome back. Your orders, addresses and wishlist are waiting." logoDarkUrl={settings.general.logoDarkUrl} footer={<p>New here? <Link href="/register" className="link font-semibold">Create an account</Link></p>}>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
