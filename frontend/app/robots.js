import { SITE_URL } from '@/lib/config';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/account/', '/cart', '/checkout', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/wishlist', '/search'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
