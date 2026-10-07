'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ErrorState, Lines } from '@/components/ui/States';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import OrderView from '@/components/account/OrderView';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import { cancelOrder, getOrder } from '@/services/orders';

export default function OrderDetailPage({ params }) {
  const { orderNumber } = use(params);
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => getOrder(orderNumber), [orderNumber]);
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const doCancel = async () => {
    setCancelling(true);
    try {
      const res = await cancelOrder(orderNumber, reason.trim() || undefined);
      toast.success(res.message);
      setConfirm(false);
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Link href="/account/orders" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold hover:underline">
        <ChevronLeft className="size-4" aria-hidden />
        All orders
      </Link>
      {loading && <Lines rows={4} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <OrderView
          order={data.order}
          reviewLinks
          actions={
            <>
              {data.order.placedAt && (
                <a href={`/api/orders/${encodeURIComponent(orderNumber)}/invoice`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                  Download invoice
                </a>
              )}
              {data.order.canCancel && (
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setConfirm(true)}>
                  Cancel order
                </button>
              )}
            </>
          }
        />
      )}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Cancel this order?"
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setConfirm(false)}>
              Keep order
            </button>
            <Button size="sm" variant="black" loading={cancelling} onClick={doCancel}>
              Cancel order
            </Button>
          </div>
        }
      >
        <p className="mb-4">Your payment is refunded to the original method, usually within 5 to 7 working days. This cannot be undone.</p>
        <Field as="textarea" rows={3} label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
      </Modal>
    </>
  );
}
