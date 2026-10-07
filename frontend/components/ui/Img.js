import Image from 'next/image';

const FALLBACK = '/placeholders/product.svg';

// next/image with two escape hatches: SVGs and local-development uploads are served as-is.
export default function Img({ src, alt = '', ...props }) {
  const s = src || FALLBACK;
  const unoptimized = s.endsWith('.svg') || /\/\/(localhost|127\.0\.0\.1)/.test(s);
  return <Image src={s} alt={alt} unoptimized={unoptimized} {...props} />;
}
