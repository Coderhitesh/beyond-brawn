import { Suspense } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/account/AuthShell';
import { VerifyEmailForm } from '@/components/account/AuthForms';
import { getSettings } from '@/lib/server-api';

export const metadata = { title: 'Verify your email', robots: { index: false } };

export default async function Page() {
  const settings = await getSettings();
  return (
    <AuthShell title="Verify your email" text="" logoDarkUrl={settings.general.logoDarkUrl} footer={<p>Check your spam folder if the email has not arrived in a minute.</p>}>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
