import { Suspense } from 'react';
import CheckoutView from '@/components/checkout/CheckoutView';

export const metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container-site py-12"><div className="skeleton h-96" /></div>}>
      <CheckoutView />
    </Suspense>
  );
}
