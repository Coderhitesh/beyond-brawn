import Link from 'next/link';
import Img from '@/components/ui/Img';

export default function PromoBanner({ promo, banner }) {
  const headline = (banner && banner.title) || promo.headline;
  const text = (banner && banner.subtitle) || promo.text;
  const cta = banner && banner.link ? { href: banner.link, label: banner.buttonText || 'Shop now' } : promo.cta;
  const image = (banner && banner.image) || promo.image;
  if (!headline) return null;
  return (
    <section className="bg-lime text-black">
      <div className="container-site grid items-center gap-8 py-12 md:grid-cols-[1fr_auto] md:py-16">
        <div>
          <h2 className="display text-5xl sm:text-8xl">{headline}</h2>
          {text && <p className="mt-3 max-w-xl text-lg font-medium">{text}</p>}
          {cta && (
            <Link href={cta.href} className="btn btn-black mt-6 h-14 px-9 text-xl hover:bg-white hover:text-black">
              {cta.label}
            </Link>
          )}
        </div>
        {image && (
          <div className="relative hidden aspect-square w-72 md:block">
            <Img src={image} alt="" fill sizes="288px" className="object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}
