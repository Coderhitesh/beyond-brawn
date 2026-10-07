import CmsPage, { cmsMetadata } from '@/components/layout/CmsPage';

export const generateMetadata = () => cmsMetadata('shipping-policy', 'Shipping Policy');

export default function Page() {
  return <CmsPage slug="shipping-policy" fallbackTitle="Shipping Policy" />;
}
