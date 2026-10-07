import { SITE_URL, SITE_NAME } from './config';

export const abs = (path = '') => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

export function buildMetadata({ title, description, path = '/', image, type = 'website', noindex = false, keywords } = {}) {
  const images = image ? [{ url: abs(image) }] : undefined;
  const text = title && typeof title === 'object' ? title.absolute : title;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: abs(path) },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: { title: text, description, url: abs(path), siteName: SITE_NAME, type, locale: 'en_IN', images },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: text, description, images: image ? [abs(image)] : undefined },
  };
}

export const organizationLd = (settings) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: settings.general.siteName,
  url: SITE_URL,
  logo: abs(settings.general.logoUrl || '/brand/logo.svg'),
  slogan: settings.general.tagline,
  contactPoint: settings.contact && settings.contact.phone ? [{ '@type': 'ContactPoint', telephone: settings.contact.phone, email: settings.contact.email, contactType: 'customer service', areaServed: 'IN' }] : undefined,
  sameAs: Object.values(settings.social || {}).filter(Boolean),
});

export const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
});

export const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.href ? abs(it.href) : undefined })),
});

export function productLd(product, variants = []) {
  const prices = variants.length ? variants.map((v) => v.price) : [product.price];
  const offerBase = { priceCurrency: 'INR', availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: abs(`/products/${product.slug}`), itemCondition: 'https://schema.org/NewCondition' };
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    image: (product.images || []).map((i) => abs(i.url)),
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    category: product.category ? product.category.name : undefined,
    aggregateRating: product.ratingCount > 0 ? { '@type': 'AggregateRating', ratingValue: product.ratingAverage, reviewCount: product.ratingCount } : undefined,
    offers: variants.length > 1 ? { '@type': 'AggregateOffer', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: variants.length, ...offerBase } : { '@type': 'Offer', price: prices[0], ...offerBase },
  };
}

export const articleLd = (blog) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: blog.title,
  description: blog.excerpt,
  image: blog.coverImage ? [abs(blog.coverImage)] : undefined,
  datePublished: blog.publishedAt,
  dateModified: blog.updatedAt,
  author: { '@type': 'Organization', name: blog.author || SITE_NAME },
  publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: abs('/brand/logo.svg') } },
  mainEntityOfPage: abs(`/blog/${blog.slug}`),
});

export const faqLd = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
});
