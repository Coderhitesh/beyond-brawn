'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import OrderView from '@/components/account/OrderView';
import { Lines } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { getOrder } from '@/services/orders';

export default function SuccessView() {
  const params = useSearchParams();
  const orderNumber = params.get('order');
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem('bb_last_order') || 'null');
      if (saved && saved.orderNumber === orderNumber) {
        setOrder(saved);
        setLoading(false);
        return;
      }
    } catch (e) {
      /* ignore */
    }
    if (user && orderNumber) {
      getOrder(orderNumber)
        .then((res) => setOrder(res.data.order))
        .catch(() => null)
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, [authLoading, user, orderNumber]);

  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mb-10 flex flex-col gap-4 bg-lime p-6 text-black sm:flex-row sm:items-center sm:p-8">
        <PackageCheck className="size-12 shrink-0" strokeWidth={1.5} aria-hidden />
        <div>
          <h1 className="display text-5xl sm:text-6xl">Order confirmed</h1>
          <p className="mt-1 text-lg font-medium">
            Thank you. Your payment is verified and we are getting {orderNumber || 'your order'} ready. A confirmation email is on its way{order && order.customer ? ` to ${order.customer.email}` : ''}.
          </p>
        </div>
      </div>
      {loading ? (
        <Lines rows={3} />
      ) : order ? (
        <OrderView
          order={order}
          actions={
            <>
              <Link href={order.isGuest ? `/track-order?order=${order.orderNumber}` : `/account/orders/${order.orderNumber}`} className="btn btn-sm btn-outline">
                {order.isGuest ? 'Track this order' : 'View in my orders'}
              </Link>
              <Link href="/shop" className="btn btn-sm btn-black">
                Continue shopping
              </Link>
            </>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link href={orderNumber ? `/track-order?order=${orderNumber}` : '/track-order'} className="btn btn-outline">
            Track your order
          </Link>
          <Link href="/shop" className="btn btn-black">
            Continue shopping
          </Link>
        </div>
      )}
    </div>
  );
}
