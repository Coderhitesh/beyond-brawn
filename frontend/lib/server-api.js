import { API_URL } from './config';

const BUILDING = process.env.NEXT_PHASE === 'phase-production-build';

/*
 * Server-side GET against the Express API with ISR caching.
 * Returns the parsed envelope ({ data, meta }) or null for 404.
 * During `next build` an unreachable API yields null so the build still completes; pages regenerate on first request.
 */
export async function apiGet(path, { revalidate = 60, tags } = {}) {
  try {
    const res = await fetch(`${API_URL}/api${path}`, { next: { revalidate, ...(tags ? { tags } : {}) } });
    if (res.status === 404) return null;
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `API ${res.status}`);
    return json;
  } catch (e) {
    if (BUILDING) return null;
    throw e;
  }
}

const FALLBACK_SETTINGS = {
  general: { siteName: 'Beyond Brawn', tagline: 'Results That Speak Through', logoUrl: '', announcements: [] },
  contact: {},
  social: {},
  shipping: { freeShippingThreshold: 999, methods: [] },
  tax: { inclusive: true },
  seo: { defaultTitle: 'Beyond Brawn | Premium Sports Nutrition', titleTemplate: '%s | Beyond Brawn', defaultDescription: 'Whey protein, creatine, pre-workout and daily wellness supplements. Lab-tested, authentic and delivered across India.' },
  homepage: { hero: { headline: 'Build beyond limits', subheading: 'Premium sports nutrition built for strength, performance and results.', primaryCta: { label: 'Shop now', href: '/shop' }, secondaryCta: { label: 'Explore products', href: '/category/protein' } }, promo: { headline: 'Fuel your performance', text: '', cta: { label: 'Shop now', href: '/shop' } } },
  footer: { about: '', copyright: 'Beyond Brawn. All rights reserved.' },
};

export async function getSettings() {
  const res = await apiGet('/settings', { revalidate: 120, tags: ['settings'] }).catch(() => null);
  return (res && res.data.settings) || FALLBACK_SETTINGS;
}

export async function getCategories() {
  const res = await apiGet('/categories', { revalidate: 120, tags: ['categories'] }).catch(() => null);
  return (res && res.data.categories) || [];
}
