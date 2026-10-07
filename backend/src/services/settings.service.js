const { Setting } = require('../models');

// Defaults are merged under whatever the admin saved, so new keys never break older installs.
const DEFAULTS = {
  general: {
    siteName: 'Beyond Brawn',
    tagline: 'Results That Speak Through',
    logoUrl: '', // empty = text wordmark. Upload the real logo in Admin > Settings > General
    logoDarkUrl: '', // version for black backgrounds (header bar, footer, emails)
    faviconUrl: '/favicon.ico',
    currency: 'INR',
    announcements: ['Free shipping on orders above ₹999', 'Authentic products, secure payments, fast delivery'],
    orderPrefix: 'BB',
  },
  contact: {
    email: 'support@beyondbrawn.in',
    phone: '+91 90000 00000',
    whatsapp: '',
    address: 'Beyond Brawn Nutrition, Delhi NCR, India',
    hours: 'Mon to Sat, 10 am to 7 pm',
    gstin: '',
    fssai: '',
  },
  social: { instagram: '', facebook: '', youtube: '', x: '', linkedin: '' },
  shipping: {
    freeShippingThreshold: 999,
    methods: [
      { code: 'standard', name: 'Standard delivery', charge: 79, minDays: 3, maxDays: 6, freeEligible: true, isActive: true },
      { code: 'express', name: 'Express delivery', charge: 149, minDays: 1, maxDays: 3, freeEligible: false, isActive: true },
    ],
    pincodeMode: 'all', // 'all' | 'allowlist'
    allowedPincodes: [],
    blockedPincodes: [],
    provider: 'flat', // extension point: add a provider in services/shipping.service.js
  },
  tax: { inclusive: true, defaultGstRate: 18, showTaxLine: true },
  payment: { razorpayEnabled: true, pendingOrderExpiryMinutes: 30 },
  seo: {
    defaultTitle: 'Beyond Brawn | Premium Sports Nutrition',
    titleTemplate: '%s | Beyond Brawn',
    defaultDescription: 'Whey protein, creatine, pre-workout and daily wellness supplements. Lab-tested, authentic and delivered across India.',
    keywords: 'whey protein, creatine, pre workout, supplements india, beyond brawn',
    ogImage: '/brand/og.jpg',
    googleSiteVerification: '',
    gaMeasurementId: '',
  },
  homepage: {
    hero: {
      headline: 'Build beyond limits',
      subheading: 'Premium sports nutrition built for strength, performance and results.',
      primaryCta: { label: 'Shop now', href: '/shop' },
      secondaryCta: { label: 'Explore products', href: '/category/protein' },
      image: '',
    },
    promo: { headline: 'Fuel your performance', text: 'Stack creatine with whey and save more on every order.', cta: { label: 'Shop the stack', href: '/shop?tag=stack' }, image: '' },
    showInstagram: false,
  },
  footer: {
    about: 'Beyond Brawn makes straightforward sports nutrition: clear labels, tested batches and doses that match the research.',
    copyright: 'Beyond Brawn. All rights reserved.',
  },
  emailTemplates: {}, // { [templateKey]: { subject } } subject overrides
};

const PUBLIC_GROUPS = ['general', 'contact', 'social', 'shipping', 'tax', 'payment', 'seo', 'homepage', 'footer'];
const GROUPS = Object.keys(DEFAULTS);
const TTL = 60 * 1000;
let cache = { at: 0, data: null };

const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, over) {
  if (!isPlain(base) || !isPlain(over)) return over === undefined ? base : over;
  const out = { ...base };
  Object.keys(over).forEach((k) => {
    out[k] = merge(base[k], over[k]);
  });
  return out;
}

async function getAll() {
  if (cache.data && Date.now() - cache.at < TTL) return cache.data;
  const docs = await Setting.find({ key: { $in: GROUPS } }).lean();
  const stored = Object.fromEntries(docs.map((d) => [d.key, d.value]));
  const data = {};
  GROUPS.forEach((g) => {
    data[g] = merge(DEFAULTS[g], stored[g] || {});
  });
  cache = { at: Date.now(), data };
  return data;
}
const get = async (group) => (await getAll())[group];

async function getPublic() {
  const all = await getAll();
  const out = {};
  PUBLIC_GROUPS.forEach((g) => {
    out[g] = all[g];
  });
  // Pincode lists can be large and are not needed by the storefront.
  const { allowedPincodes, blockedPincodes, ...shipping } = out.shipping;
  out.shipping = shipping;
  return out;
}

async function set(group, value) {
  if (!GROUPS.includes(group)) throw new Error(`Unknown settings group: ${group}`);
  await Setting.findOneAndUpdate({ key: group }, { value }, { upsert: true, new: true });
  cache = { at: 0, data: null };
  return get(group);
}

module.exports = { DEFAULTS, GROUPS, getAll, get, getPublic, set };
