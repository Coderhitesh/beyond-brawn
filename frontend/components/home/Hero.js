import Link from 'next/link';
import Img from '@/components/ui/Img';

const FACTS = [
  ['Protein per scoop', '24 g'],
  ['Added sugar', '0 g'],
  ['Proprietary blends', '0'],
  ['Batches lab tested', '100%'],
];

// The hero pairs the headline with the brand's promises set as a supplement-facts panel: the label is the pitch.
export default function Hero({ hero, banner }) {
  const headline = (banner && banner.title) || hero.headline;
  const sub = (banner && banner.subtitle) || hero.subheading;
  const primary = banner && banner.link ? { href: banner.link, label: banner.buttonText || 'Shop now' } : hero.primaryCta;
  const image = (banner && banner.image) || hero.image;
  return (
    <section className="on-dark relative overflow-hidden bg-black text-white">
      {image && <Img src={image} alt="" fill priority sizes="100vw" className="object-cover opacity-45" />}
      <div className="container-site relative grid items-end gap-10 py-14 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:py-24">
        <div>
          <h1 className="display text-[clamp(4rem,13vw,8.5rem)] leading-[0.82]">{headline}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primary.href} className="btn btn-lime h-14 px-9 text-xl">
              {primary.label}
            </Link>
            {hero.secondaryCta && (
              <Link href={hero.secondaryCta.href} className="btn btn-outline h-14 px-9 text-xl">
                {hero.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        <div className="bg-lime text-black lg:mb-2 lg:max-w-md lg:justify-self-end">
          <div className="border-b-[8px] border-black px-5 pb-2 pt-4">
            <p className="font-display text-4xl font-black uppercase leading-none">Brawn facts</p>
            <p className="mt-1 text-sm font-medium">What goes into every tub we sell</p>
          </div>
          <dl>
            {FACTS.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 border-b border-black px-5 py-3 last:border-b-0">
                <dt className="font-semibold">{label}</dt>
                <dd className="font-display text-4xl font-black leading-none">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t-4 border-black px-5 py-2.5 text-xs font-medium">Figures for Brawn Whey Protein. Every label lists each ingredient and its dose.</p>
        </div>
      </div>
    </section>
  );
}
