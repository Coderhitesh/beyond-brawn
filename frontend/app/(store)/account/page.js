'use client';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { EmptyState, ErrorState, Lines } from '@/components/ui/States';
import { StatusBadge } from '@/components/account/OrderView';
import useFetch from '@/hooks/useFetch';
import { dashboard } from '@/services/account';
import { formatDate, formatINR } from '@/utils/format';

export default function AccountDashboard() {
  const { data, loading, error, reload } = useFetch(dashboard);
  if (loading) return <Lines rows={4} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const c = data.counts;
  const tiles = [
    ['Orders', c.orders, '/account/orders'],
    ['In progress', c.activeOrders, '/account/orders'],
    ['Wishlist', c.wishlist, '/account/wishlist'],
    ['Addresses', c.addresses, '/account/addresses'],
  ];
  return (
    <>
      <h1 className="display text-5xl sm:text-6xl">Dashboard</h1>
      <ul className="mt-6 grid grid-cols-2 border-l-2 border-t-2 border-black md:grid-cols-4">
        {tiles.map(([label, value, href]) => (
          <li key={label} className="border-b-2 border-r-2 border-black">
            <Link href={href} className="flex flex-col p-4 hover:bg-lime">
              <span className="font-display text-6xl font-black leading-none">{value}</span>
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 mb-3 flex items-end justify-between border-b-2 border-black pb-2">
        <h2 className="font-display text-3xl font-black uppercase leading-none">Recent orders</h2>
        {data.recentOrders.length > 0 && (
          <Link href="/account/orders" className="link text-sm font-semibold">
            All orders
          </Link>
        )}
      </div>
      {data.recentOrders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" text="When you place an order it appears here with live status." action="Start shopping" href="/shop" />
      ) : (
        <ul className="divide-y divide-line">
          {data.recentOrders.map((o) => (
            <li key={o.orderNumber}>
              <Link href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 py-3.5 hover:bg-bone">
                <span>
                  <span className="block font-bold">{o.orderNumber}</span>
                  <span className="text-sm text-mute">
                    {formatDate(o.createdAt)}, {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <StatusBadge status={o.status} />
                  <span className="font-bold">{formatINR(o.pricing.total)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
