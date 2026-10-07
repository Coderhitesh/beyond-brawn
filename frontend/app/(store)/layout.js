import Script from 'next/script';
import Providers from '@/context/Providers';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import JsonLd from '@/components/ui/JsonLd';
import { getCategories, getSettings } from '@/lib/server-api';
import { organizationLd, websiteLd } from '@/lib/seo';

export default async function StoreLayout({ children }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const ga = /^G-[A-Z0-9]+$/.test(settings.seo.gaMeasurementId || '') ? settings.seo.gaMeasurementId : null;
  return (
    <Providers>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:bg-lime focus:px-4 focus:py-2 focus:font-semibold">
        Skip to content
      </a>
      <AnnouncementBar messages={settings.general.announcements} />
      <Header categories={categories} logoUrl={settings.general.logoUrl} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer />
      <JsonLd data={organizationLd(settings)} />
      <JsonLd data={websiteLd()} />
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}</Script>
        </>
      )}
    </Providers>
  );
}
