import { Suspense } from 'react';
import SuccessView from '@/components/checkout/SuccessView';

export const metadata = { title: 'Order confirmed', robots: { index: false } };

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="container-site py-12"><div className="skeleton h-72" /></div>}>
      <SuccessView />
    </Suspense>
  );
}
