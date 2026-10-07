import { Suspense } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import TrackOrder from '@/components/account/TrackOrder';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Track your order', description: 'Enter your Beyond Brawn order number and email to see where your order is.', path: '/track-order' });

export default function TrackOrderPage() {
  return (
    <>
      <PageHeader title="Track your order" text="Enter your order number and the email you used at checkout. Have an account? Your orders are under My Account." crumbs={[{ name: 'Track order' }]} />
      <Suspense fallback={null}>
        <TrackOrder />
      </Suspense>
    </>
  );
}
