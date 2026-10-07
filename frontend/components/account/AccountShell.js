'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, KeyRound, LayoutDashboard, LogOut, MapPin, Package, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const NAV = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/account/orders', label: 'My orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/change-password', label: 'Change password', icon: KeyRound },
];

// Guards every /account page: guests are sent to log in and returned afterwards.
export default function AccountShell({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="container-site py-12">
        <div className="skeleton h-96" />
      </div>
    );
  }

  const signOut = async () => {
    await logout();
    toast.success('Logged out');
    router.replace('/');
  };

  return (
    <div className="container-site py-8 sm:py-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <aside className="min-w-0">
          <p className="text-sm text-mute">Signed in as</p>
          <p className="truncate font-display text-3xl font-black uppercase leading-none">{user.name}</p>
          <nav aria-label="Account" className="scrollbar-none -mx-4 mt-5 flex gap-1 overflow-x-auto border-y-2 border-black px-4 lg:mx-0 lg:block lg:border-b-0 lg:px-0">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap px-3 py-3 text-[15px] font-semibold lg:border-b lg:border-line ${active ? 'bg-black text-white' : 'hover:bg-bone'}`}>
                  <Icon className="size-[18px]" aria-hidden />
                  {label}
                </Link>
              );
            })}
            <button type="button" onClick={signOut} className="flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap px-3 py-3 text-[15px] font-semibold hover:bg-bone lg:w-full">
              <LogOut className="size-[18px]" aria-hidden />
              Log out
            </button>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
