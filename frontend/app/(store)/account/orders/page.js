'use client';
import { useState } from 'react';
import { Package } from 'lucide-react';
import { EmptyState, ErrorState, Lines } from '@/components/ui/States';
import OrderList from '@/components/account/OrderList';
import useFetch from '@/hooks/useFetch';
import { listOrders } from '@/services/orders';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch(() => listOrders(page), [page]);
  return (
    <>
      <h1 className="display mb-6 text-5xl sm:text-6xl">My orders</h1>
      {loading && <Lines rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.orders.length === 0 && <EmptyState icon={Package} title="No orders yet" text="When you place an order it appears here with live status, tracking and your invoice." action="Start shopping" href="/shop" />}
      {data && data.orders.length > 0 && (
        <>
          <OrderList orders={data.orders} />
          {meta && meta.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button type="button" className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Newer
              </button>
              <span className="text-sm text-mute">
                Page {meta.page} of {meta.pages}
              </span>
              <button type="button" className="btn btn-sm btn-outline" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>
                Older
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
