import { ToastProvider } from '@/context/ToastContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

export const metadata = { title: { default: 'Admin', template: '%s | Beyond Brawn Admin' }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }) {
  return (
    <ToastProvider>
      <AdminAuthProvider>{children}</AdminAuthProvider>
    </ToastProvider>
  );
}
