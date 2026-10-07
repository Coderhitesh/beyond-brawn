import CmsPage, { cmsMetadata } from '@/components/layout/CmsPage';

export const generateMetadata = () => cmsMetadata('return-policy', 'Return Policy');

export default function Page() {
  return <CmsPage slug="return-policy" fallbackTitle="Return Policy" />;
}
