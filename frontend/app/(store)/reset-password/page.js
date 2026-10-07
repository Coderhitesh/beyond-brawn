import { Suspense } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/account/AuthShell';
import { ResetPasswordForm } from '@/components/account/AuthForms';
import { getSettings } from '@/lib/server-api';

export const metadata = { title: 'Reset password', robots: { index: false } };

export default async function Page() {
  const settings = await getSettings();
  return (
    <AuthShell title="Reset password" text="" logoDarkUrl={settings.general.logoDarkUrl} footer={<p><Link href="/login" className="link font-semibold">Back to log in</Link></p>}>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
