import { Suspense } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/account/AuthShell';
import { RegisterForm } from '@/components/account/AuthForms';
import { getSettings } from '@/lib/server-api';

export const metadata = { title: 'Create account', robots: { index: false } };

export default async function Page() {
  const settings = await getSettings();
  return (
    <AuthShell title="Create account" text="One account for faster checkout, order tracking and reviews." logoDarkUrl={settings.general.logoDarkUrl} footer={<p>Already registered? <Link href="/login" className="link font-semibold">Log in</Link></p>}>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
