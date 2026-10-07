import CmsPage, { cmsMetadata } from '@/components/layout/CmsPage';

export const generateMetadata = () => cmsMetadata('terms-and-conditions', 'Terms & Conditions');

export default function Page() {
  return <CmsPage slug="terms-and-conditions" fallbackTitle="Terms & Conditions" />;
}
