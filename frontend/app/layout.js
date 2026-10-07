import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/hanken-grotesk';
import './globals.css';
import Ready from '@/components/ui/Ready';
import { getSettings } from '@/lib/server-api';
import { SITE_URL } from '@/lib/config';

export async function generateMetadata() {
  const { seo, general } = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.defaultTitle, template: seo.titleTemplate || '%s | Beyond Brawn' },
    description: seo.defaultDescription,
    keywords: seo.keywords,
    applicationName: general.siteName,
    openGraph: { siteName: general.siteName, type: 'website', locale: 'en_IN', images: seo.ogImage ? [seo.ogImage] : undefined },
    verification: seo.googleSiteVerification ? { google: seo.googleSiteVerification } : undefined,
    formatDetection: { telephone: false },
  };
}

export const viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1 };

/*
 * Runs before React loads. Two safety nets for the gap between "HTML is visible" and "JavaScript is ready":
 *  1. A form submitted in that gap would do a plain browser submit (page reloads to "/login?" and nothing happens).
 *     Until the app marks itself ready, submits are swallowed instead.
 *  2. If a script file fails to load (stale tab after a new build or deploy), reload once to pick up the current files.
 */
const BOOT_SCRIPT = `(function(){
  document.addEventListener('submit',function(e){if(!window.__bbReady){e.preventDefault();}},true);
  var k='bb_chunk_reload';
  window.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='SCRIPT'&&t.src&&t.src.indexOf('/_next/')>-1){try{if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,'1');location.reload();}}catch(_){}}},true);
  window.addEventListener('load',function(){setTimeout(function(){try{if(window.__bbReady)sessionStorage.removeItem(k);}catch(_){}} ,5000);});
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        {children}
        <Ready />
      </body>
    </html>
  );
}
