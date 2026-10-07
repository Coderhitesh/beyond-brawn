import CmsPage, { cmsMetadata } from '@/components/layout/CmsPage';

export const generateMetadata = () => cmsMetadata('privacy-policy', 'Privacy Policy');

export default function Page() {
  return <CmsPage slug="privacy-policy" fallbackTitle="Privacy Policy" />;
}
