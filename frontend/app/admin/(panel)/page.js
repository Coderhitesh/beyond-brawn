'use client';
import Link from 'next/link';
import Chart from '@/components/admin/Charts';
import { Guard } from '@/components/admin/AdminShell';
import { Card, ErrorBox, Loading, OrderBadge, PageTitle, Stat } from '@/components/admin/ui';
import useFetch from '@/hooks/useFetch';
import { adminApi } from '@/services/admin';
import { formatDateTime, formatINR } from '@/utils/format';

const dayLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => adminApi('/dashboard'));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const s = data.stats;
  const revenue = data.chart.map((d) => ({ label: dayLabel(d.date), value: d.revenue }));
  const orders = data.chart.map((d) => ({ label: dayLabel(d.date), value: d.orders }));
  return (
    <>
      <PageTitle title="Dashboard" text="Sales count paid orders. Times are India Standard Time." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Today's sales" value={formatINR(Math.round(s.todaySales))} sub={`${s.todayOrders} ${s.todayOrders === 1 ? 'order' : 'orders'}`} />
        <Stat label="This month" value={formatINR(Math.round(s.monthlySales))} sub={`${s.monthlyOrders} ${s.monthlyOrders === 1 ? 'order' : 'orders'}`} />
        <Stat label="Total sales" value={formatINR(Math.round(s.totalSales))} sub={`${s.totalOrders} ${s.totalOrders === 1 ? 'order' : 'orders'}`} />
        <Stat label="To fulfil" value={s.pendingOrders} sub="Confirmed, processing, packed" href="/admin/orders?status=Confirmed" tone={s.pendingOrders ? 'alert' : undefined} />
        <Stat label="In transit" value={s.shippedOrders} href="/admin/orders?status=Shipped" />
        <Stat label="Delivered" value={s.completedOrders} href="/admin/orders?status=Delivered" />
        <Stat label="Cancelled" value={s.cancelledOrders} href="/admin/orders?status=Cancelled" />
        <Stat label="Customers" value={s.totalCustomers} href="/admin/customers" />
        <Stat label="Products" value={s.totalProducts} href="/admin/products" />
        <Stat label="Low stock" value={s.lowStockProducts} href="/admin/products/inventory?filter=restock" tone={s.lowStockProducts ? 'alert' : undefined} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Revenue, last 30 days">
          <Chart data={revenue} type="area" format={formatINR} label="Daily revenue for the last 30 days" />
        </Card>
        <Card title="Orders, last 30 days">
          <Chart data={orders} type="bars" format={(v) => `${v} ${v === 1 ? 'order' : 'orders'}`} label="Daily orders for the last 30 days" />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Recent orders" pad={false} action={<Link href="/admin/orders" className="text-[13px] font-semibold underline">All orders</Link>}>
          <div className="overflow-x-auto">
            <table className="atable">
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <Link href={`/admin/orders/${o._id}`} className="font-semibold underline-offset-2 hover:underline">
                        {o.orderNumber}
                      </Link>
                      <span className="block text-xs text-mute">{formatDateTime(o.placedAt)}</span>
                    </td>
                    <td className="hidden sm:table-cell">{o.customer && o.customer.name}</td>
                    <td><OrderBadge status={o.status} /></td>
                    <td className="text-right font-semibold tabular-nums">{formatINR(o.pricing.total)}</td>
                  </tr>
                ))}
                {!data.recentOrders.length && (
                  <tr>
                    <td className="py-10! text-center text-mute">No paid orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Needs restocking" pad={false} action={<Link href="/admin/products/inventory?filter=restock" className="text-[13px] font-semibold underline">Inventory</Link>}>
            <ul>
              {data.lowStock.map((p) => (
                <li key={`${p._id}-${p.sku}`} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-b-0">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="text-xs text-mute">{p.sku}</span>
                  </span>
                  <span className={`shrink-0 font-bold ${p.stock === 0 ? 'text-danger' : ''}`}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span>
                </li>
              ))}
              {!data.lowStock.length && <li className="px-4 py-8 text-center text-sm text-mute">Stock levels are healthy.</li>}
            </ul>
          </Card>
          <Card title="Top-selling products" pad={false}>
            <ol>
              {data.topProducts.map((p, i) => (
                <li key={p._id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-sm last:border-b-0">
                  <span className="w-5 font-display text-xl font-black text-mute">{i + 1}</span>
                  <Link href={`/admin/products/${p._id}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">
                    {p.name}
                  </Link>
                  <span className="shrink-0 tabular-nums text-mute">{p.soldCount} sold</span>
                </li>
              ))}
              {!data.topProducts.length && <li className="px-4 py-8 text-center text-sm text-mute">No sales yet.</li>}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['dashboard.view']}>
      <Dashboard />
    </Guard>
  );
}
