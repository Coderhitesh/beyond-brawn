import Link from 'next/link';
import { Lock, Mail, MapPin, Phone } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { POLICY_LINKS } from '@/lib/config';

const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', x: 'X', linkedin: 'LinkedIn' };

function Column({ title, links }) {
  return (
    <div>
      <h2 className="mb-3 border-b border-white/25 pb-2 font-display text-xl font-black uppercase leading-none">{title}</h2>
      <ul className="space-y-2 text-[15px] text-white/80">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-lime">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer({ settings, categories = [] }) {
  const { general, contact = {}, social = {}, footer = {} } = settings;
  const socials = Object.entries(social).filter(([, url]) => url);
  return (
    <footer className="on-dark bg-black text-white">
      <div className="container-site grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <Logo src={general.logoDarkUrl} dark />
          {general.tagline && <p className="mt-3 font-display text-xl font-bold uppercase tracking-wide text-lime">{general.tagline}</p>}
          {footer.about && <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/75">{footer.about}</p>}
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-lime">
                    {SOCIAL_LABELS[key] || key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Column title="Shop" links={[...categories.slice(0, 5).map((c) => ({ href: `/category/${c.slug}`, label: c.name })), { href: '/shop?offers=1', label: 'Offers' }]} />
        <Column
          title="Help"
          links={[
            { href: '/track-order', label: 'Track your order' },
            { href: '/faq', label: 'FAQ' },
            { href: '/contact', label: 'Contact us' },
            ...POLICY_LINKS.slice(0, 3),
          ]}
        />
        <Column
          title="Company"
          links={[
            { href: '/about', label: 'About us' },
            { href: '/blog', label: 'Blog' },
            ...POLICY_LINKS.slice(3),
          ]}
        />
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <h2 className="mb-3 border-b border-white/25 pb-2 font-display text-xl font-black uppercase leading-none">Contact</h2>
          <ul className="space-y-2.5 text-[15px] text-white/80">
            {contact.email && (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-lime">
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-lime">
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden />
                <span>{contact.address}</span>
              </li>
            )}
            {contact.hours && <li className="pl-[26px]">{contact.hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-site flex flex-col gap-2 py-5 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {footer.copyright || 'Beyond Brawn. All rights reserved.'}
          </p>
          <p className="flex items-center gap-2">
            <Lock className="size-3.5" aria-hidden />
            Secure payments by Razorpay: UPI, cards, net banking and wallets
          </p>
        </div>
        {(contact.fssai || contact.gstin) && (
          <div className="container-site pb-5 text-xs text-white/45">
            {contact.fssai && <span>FSSAI Lic. No. {contact.fssai}</span>}
            {contact.fssai && contact.gstin && <span> | </span>}
            {contact.gstin && <span>GSTIN {contact.gstin}</span>}
          </div>
        )}
      </div>
    </footer>
  );
}
