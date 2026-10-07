import AccountShell from '@/components/account/AccountShell';

export const metadata = { title: 'My account', robots: { index: false } };

export default function AccountLayout({ children }) {
  return <AccountShell>{children}</AccountShell>;
}
