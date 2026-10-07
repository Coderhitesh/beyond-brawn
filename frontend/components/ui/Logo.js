import Link from 'next/link';

/*
 * Renders the uploaded logo when one is set in Admin > Settings > General.
 * Until then it falls back to a type-set wordmark so nothing looks broken.
 */
export default function Logo({ src, dark = false, className = '', height = 36, href = '/' }) {
  const content = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Beyond Brawn" height={height} style={{ height, width: 'auto' }} />
  ) : (
    <span className={`flex items-stretch gap-2 font-display text-[1.7rem] font-black uppercase leading-none tracking-wide ${dark ? 'text-white' : 'text-black'}`}>
      <span className="w-1.5 bg-lime" aria-hidden />
      <span>Beyond Brawn</span>
    </span>
  );
  return (
    <Link href={href} aria-label="Beyond Brawn home" className={`inline-flex shrink-0 items-center ${className}`}>
      {content}
    </Link>
  );
}
