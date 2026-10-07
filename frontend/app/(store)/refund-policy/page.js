import CmsPage, { cmsMetadata } from '@/components/layout/CmsPage';

export const generateMetadata = () => cmsMetadata('refund-policy', 'Refund Policy');

export default function Page() {
  return <CmsPage slug="refund-policy" fallbackTitle="Refund Policy" />;
}
