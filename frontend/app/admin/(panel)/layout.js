import { Suspense } from 'react';
import AdminShell from '@/components/admin/AdminShell';

export default function PanelLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
