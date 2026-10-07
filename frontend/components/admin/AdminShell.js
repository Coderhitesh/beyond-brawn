'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, ChevronDown, ExternalLink, KeyRound, LogOut, Menu, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import { adminApi } from '@/services/admin';
import { formatDateTime } from '@/utils/format';
import { NAV } from './nav';
import { Btn, Loading } from './ui';

function useActive() {
  const pathname = usePathname();
  const params = useSearchParams();
  return (item) => {
    const [path, query] = item.href.split('?');
    if (query) {
      const want = new URLSearchParams(query);
      return pathname === path && [...want.entries()].every(([k, v]) => params.get(k) === v);
    }
    if (item.exact) return pathname === path && !(path === '/admin/orders' && (params.get('status') || params.get('refunds')));
    return pathname === path || pathname.startsWith(`${path}/`);
  };
}

function Sidebar({ onNavigate }) {
  const { can } = useAdmin();
  const isActive = useActive();
  const visible = useMemo(
    () =>
      NAV.map((g) => {
        if (g.perm && !can(...g.perm)) return null;
        if (!g.children) return g;
        const children = g.children.filter((c) => !c.perm || can(...c.perm));
        return children.length ? { ...g, children } : null;
      }).filter(Boolean),
    [can]
  );
  const activeGroup = visible.find((g) => g.children && g.children.some(isActive));
  const [open, setOpen] = useState(activeGroup ? activeGroup.label : null);
  useEffect(() => {
    if (activeGroup) setOpen(activeGroup.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup && activeGroup.label]);

  const row = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-[14px] font-semibold';
  return (
    <nav aria-label="Admin" className="py-2">
      {visible.map((g) => {
        const Icon = g.icon;
        if (!g.children) {
          const active = isActive(g);
          return (
            <Link key={g.label} href={g.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={`${row} ${active ? 'bg-lime text-black' : 'text-white/85 hover:bg-white/10'}`}>
              <Icon className="size-[18px]" aria-hidden />
              {g.label}
            </Link>
          );
        }
        const expanded = open === g.label;
        return (
          <div key={g.label}>
            <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : g.label)} className={`${row} cursor-pointer text-white/85 hover:bg-white/10`}>
              <Icon className="size-[18px]" aria-hidden />
              <span className="flex-1 text-left">{g.label}</span>
              <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {expanded && (
              <ul className="pb-1">
                {g.children.map((c) => {
                  const active = isActive(c);
                  return (
                    <li key={c.href}>
                      <Link href={c.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={`block border-l-4 py-2 pl-[38px] pr-4 text-[13.5px] ${active ? 'border-lime bg-white/10 font-semibold text-white' : 'border-transparent text-white/65 hover:text-white'}`}>
                        {c.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0 });
  const load = () => adminApi('/notifications?limit=12').then((r) => setData(r.data)).catch(() => null);
  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);
  const markRead = async () => {
    await adminApi('/notifications/read', { method: 'POST', body: {} }).catch(() => null);
    load();
  };
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ''}`} aria-expanded={open} className="relative flex size-10 cursor-pointer items-center justify-center hover:bg-bone">
        <Bell className="size-5" />
        {data.unread > 0 && <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center bg-lime px-1 text-[11px] font-bold">{data.unread > 99 ? '99+' : data.unread}</span>}
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close notifications" tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 w-[min(92vw,360px)] border-2 border-black bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <p className="text-sm font-bold">Notifications</p>
              {data.unread > 0 && (
                <button type="button" onClick={markRead} className="cursor-pointer text-xs font-semibold underline">
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-96 overflow-y-auto">
              {data.items.map((n) => (
                <li key={n._id} className={`border-b border-line last:border-b-0 ${n.isRead ? '' : 'bg-lime/15'}`}>
                  <Link href={n.link || '/admin'} onClick={() => setOpen(false)} className="block px-3 py-2.5 hover:bg-bone">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    <span className="block text-[13px] text-ink/80">{n.message}</span>
                    <span className="block text-xs text-mute">{formatDateTime(n.createdAt)}</span>
                  </Link>
                </li>
              ))}
              {!data.items.length && <li className="px-3 py-8 text-center text-sm text-mute">No notifications yet.</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function ChangePassword({ open, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi('/auth/change-password', { method: 'POST', body: form });
      toast.success(res.message);
      setForm({ currentPassword: '', newPassword: '' });
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Change password" width="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="alabel" htmlFor="acp-current">Current password</label>
          <input id="acp-current" type="password" autoComplete="current-password" required className="ainput" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div>
          <label className="alabel" htmlFor="acp-new">New password</label>
          <input id="acp-new" type="password" autoComplete="new-password" required minLength={8} className="ainput" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          <p className="ahint">At least 8 characters with a letter and a number.</p>
        </div>
        <Btn type="submit" loading={loading}>
          Change password
        </Btn>
      </form>
    </Modal>
  );
}

// Guards every panel page and draws the sidebar + top bar.
export default function AdminShell({ children }) {
  const { admin, loading, error, refresh, logout } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    if (!loading && !admin && !error) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, admin, error, router, pathname]);
  useEffect(() => setDrawer(false), [pathname]);

  // The session could not be checked at all: say so instead of spinning or bouncing to the login page.
  if (!loading && !admin && error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bone p-4">
        <div className="acard max-w-md p-6 text-center" role="alert">
          <p className="font-display text-3xl font-black uppercase leading-none">Cannot reach the server</p>
          <p className="mt-2 text-sm text-ink/80">{error}</p>
          <p className="mt-2 text-xs text-mute">If you run the site yourself: start the backend (npm run dev in the backend folder) and check that MongoDB is reachable.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Btn variant="lime" onClick={refresh}>Try again</Btn>
            <a href="/" className="abtn abtn-ghost">Go to store</a>
          </div>
        </div>
      </main>
    );
  }
  if (loading || !admin) return <Loading />;

  const brand = (
    <Link href="/admin" className="flex h-14 items-center gap-2 border-b border-white/15 px-4 font-display text-2xl font-black uppercase leading-none text-white">
      <span className="h-6 w-1.5 bg-lime" aria-hidden />
      Beyond Brawn
    </Link>
  );

  return (
    <div className="flex min-h-dvh bg-bone">
      <aside className="on-dark sticky top-0 hidden h-dvh w-60 shrink-0 overflow-y-auto bg-black lg:block">
        {brand}
        <Sidebar />
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <aside className="on-dark relative h-full w-64 overflow-y-auto bg-black [animation:drawer-in-left_.2s_ease-out]">
            <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-1 top-2 z-10 flex size-10 cursor-pointer items-center justify-center text-white">
              <X className="size-5" />
            </button>
            {brand}
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b-2 border-black bg-white px-3 sm:px-5">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="flex size-10 cursor-pointer items-center justify-center lg:hidden">
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 px-2 text-sm font-semibold hover:underline sm:flex">
            View store
            <ExternalLink className="size-4" aria-hidden />
          </a>
          <Notifications />
          <div className="hidden border-l border-line pl-3 text-right leading-tight sm:block">
            <p className="text-sm font-bold">{admin.name}</p>
            <p className="text-xs text-mute">{admin.role ? admin.role.name : ''}</p>
          </div>
          <button type="button" onClick={() => setPwOpen(true)} aria-label="Change password" title="Change password" className="flex size-10 cursor-pointer items-center justify-center hover:bg-bone">
            <KeyRound className="size-5" />
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace('/admin/login');
            }}
            aria-label="Log out"
            title="Log out"
            className="flex size-10 cursor-pointer items-center justify-center hover:bg-bone"
          >
            <LogOut className="size-5" />
          </button>
        </header>
        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">{children}</main>
      </div>
      <ChangePassword open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}

// Wrap a page so it only renders for admins holding one of `perms`.
export function Guard({ perms = [], children }) {
  const { can } = useAdmin();
  if (perms.length && !can(...perms)) {
    return (
      <div className="acard p-8 text-center">
        <p className="font-display text-3xl font-black uppercase">No access</p>
        <p className="mt-1 text-sm text-mute">Your role does not include this section. Ask a Super Admin to update your role.</p>
      </div>
    );
  }
  return children;
}
