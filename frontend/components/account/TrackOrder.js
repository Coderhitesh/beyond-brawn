'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Field from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { trackOrder } from '@/services/orders';
import OrderView from './OrderView';

export default function TrackOrder() {
  const params = useSearchParams();
  const [form, setForm] = useState({ orderNumber: params.get('order') || '', email: '' });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      setOrder((await trackOrder(form)).data.order);
    } catch (err) {
      setOrder(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-site py-10">
      <form onSubmit={submit} className="grid max-w-3xl items-start gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Order number" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value.toUpperCase() })} placeholder="BB-2026-000001" required />
        <Field label="Email used at checkout" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
        <Button type="submit" variant="black" loading={loading} className="sm:mt-[26px]">
          Track order
        </Button>
      </form>
      {error && (
        <p className="field-error mt-3 text-base" role="alert">
          {error}
        </p>
      )}
      {order && (
        <div className="mt-10">
          <OrderView order={order} />
        </div>
      )}
    </div>
  );
}
