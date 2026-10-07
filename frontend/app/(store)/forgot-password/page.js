import { Suspense } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/account/AuthShell';
import { ForgotPasswordForm } from '@/components/account/AuthForms';
import { getSettings } from '@/lib/server-api';

export const metadata = { title: 'Forgot password', robots: { index: false } };

export default async function Page() {
  const settings = await getSettings();
  return (
    <AuthShell title="Forgot password" text="Enter your account email and we will send a code to reset your password." logoDarkUrl={settings.general.logoDarkUrl} footer={<p>Remembered it? <Link href="/login" className="link font-semibold">Back to log in</Link></p>}>
      <Suspense fallback={<div className="skeleton h-64" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
