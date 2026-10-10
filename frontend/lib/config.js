export const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.beyondbrawn.store').replace(/\/$/, '');
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'Beyond Brawn';

export const GOALS = [
  { slug: 'muscle-gain', name: 'Muscle gain', blurb: 'Protein and creatine to grow' },
  { slug: 'strength', name: 'Strength', blurb: 'Lift heavier, session after session' },
  { slug: 'recovery', name: 'Recovery', blurb: 'Come back ready for the next one' },
  { slug: 'energy', name: 'Energy', blurb: 'Focus and drive before training' },
  { slug: 'weight-management', name: 'Weight management', blurb: 'Support while you cut' },
  { slug: 'general-wellness', name: 'General wellness', blurb: 'Daily vitamins and essentials' },
];

export const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'best-selling', label: 'Best selling' },
  { value: 'rating', label: 'Highest rated' },
];

export const POLICY_LINKS = [
  { href: '/shipping-policy', label: 'Shipping policy' },
  { href: '/return-policy', label: 'Return policy' },
  { href: '/refund-policy', label: 'Refund policy' },
  { href: '/privacy-policy', label: 'Privacy policy' },
  { href: '/terms-and-conditions', label: 'Terms & conditions' },
];
