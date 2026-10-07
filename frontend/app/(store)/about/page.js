import Link from 'next/link';
import CmsPage, { cmsMetadata } from '@/components/layout/CmsPage';
import WhyUs from '@/components/home/WhyUs';

export const generateMetadata = () => cmsMetadata('about', 'About Beyond Brawn');

export default function AboutPage() {
  return (
    <>
      <CmsPage slug="about" fallbackTitle="About Beyond Brawn">
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-lime">
            Shop the range
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Talk to us
          </Link>
        </div>
      </CmsPage>
      <div className="border-t-2 border-black bg-bone">
        <WhyUs />
      </div>
    </>
  );
}
