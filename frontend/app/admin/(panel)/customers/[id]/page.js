'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { Guard } from '@/components/admin/AdminShell';
import { ActiveBadge, Btn, Card, Confirm, ErrorBox, Loading, OrderBadge, PageTitle, Stat } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import { adminApi } from '@/services/admin';
import { formatDate, formatDateTime, formatINR } from '@/utils/format';

function Customer({ id }) {
  const toast = useToast();
  const { can } = useAdmin();
  const { data, loading, error, reload } = useFetch(() => adminApi(`/customers/${id}`), [id]);
  const [confirm, setConfirm] = useState(false);
  const [working, setWorking] = useState(false);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { customer: c, addresses, orders, stats } = data;

  const setActive = async (isActive) => {
    setWorking(true);
    try {
      const res = await adminApi(`/customers/${id}/active`, { method: 'PATCH', body: { isActive } });
      toast.success(res.message);
      setConfirm(false);
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <PageTitle title={c.name} text={`Customer since ${formatDate(c.createdAt)}`} crumbs={[{ label: 'Customers', href: '/admin/customers' }, { label: c.name }]}>
        <ActiveBadge on={c.isActive} no="Blocked" />
        {can('customers.manage') && (c.isActive ? <Btn variant="danger" onClick={() => setConfirm(true)}>Block customer</Btn> : <Btn loading={working} onClick={() => setActive(true)}>Unblock customer</Btn>)}
      </PageTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Paid orders" value={stats.orders} />
        <Stat label="Total spent" value={formatINR(Math.round(stats.spent))} />
        <Stat label="Average order" value={formatINR(stats.orders ? Math.round(stats.spent / stats.orders) : 0)} />
        <Stat label="Last login" value={c.lastLoginAt ? formatDate(c.lastLoginAt, { day: 'numeric', month: 'short' }) : 'Never'} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card title="Orders" pad={false} action={<Link href={`/admin/orders?customer=${c._id}`} className="text-[13px] font-semibold underline">Open in orders</Link>}>
          <div className="overflow-x-auto">
            <table className="atable">
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td><Link href={`/admin/orders/${o._id}`} className="font-semibold hover:underline">{o.orderNumber}</Link><span className="block text-xs text-mute">{formatDateTime(o.placedAt || o.createdAt)}</span></td>
                    <td className="hidden sm:table-cell">{o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}</td>
                    <td><OrderBadge status={o.status} /></td>
                    <td className="text-right font-semibold tabular-nums">{formatINR(o.pricing.total)}</td>
                  </tr>
                ))}
                {!orders.length && <tr><td className="py-10! text-center text-mute">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="Contact">
            <p className="text-sm leading-relaxed">
              <a href={`mailto:${c.email}`} className="underline">{c.email}</a> {c.isEmailVerified ? '(verified)' : '(not verified)'}<br />
              {c.phone ? <a href={`tel:${c.phone}`} className="underline">{c.phone}</a> : 'No phone number'}
            </p>
          </Card>
          <Card title={`Addresses (${addresses.length})`}>
            {addresses.length ? (
              <ul className="space-y-3 text-sm">
                {addresses.map((a) => (
                  <li key={a._id} className="leading-relaxed">
                    <span className="font-semibold">{a.fullName}</span>{a.isDefault ? ' (default)' : ''}<br />
                    {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-mute">No saved addresses.</p>}
          </Card>
        </div>
      </div>
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={() => setActive(false)} loading={working} title="Block this customer?" action="Block customer" text={`${c.name} is signed out everywhere and cannot log in or place orders until you unblock them. Existing orders are not affected.`} />
    </>
  );
}

export default function Page({ params }) {
  const { id } = use(params);
  return (
    <Guard perms={['customers.view', 'customers.manage']}>
      <Customer id={id} />
    </Guard>
  );
}
