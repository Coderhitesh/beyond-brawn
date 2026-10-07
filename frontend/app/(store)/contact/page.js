import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import ContactForm from '@/components/layout/ContactForm';
import { getSettings } from '@/lib/server-api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Contact us', description: 'Questions about an order or a product? Write to Beyond Brawn support. We reply within one working day.', path: '/contact' });

export default async function ContactPage() {
  const { contact = {} } = await getSettings();
  const rows = [
    contact.email && ['Email', <a key="e" href={`mailto:${contact.email}`} className="link break-all">{contact.email}</a>],
    contact.phone && ['Phone', <a key="p" href={`tel:${contact.phone.replace(/\s/g, '')}`} className="link">{contact.phone}</a>],
    contact.whatsapp && ['WhatsApp', <a key="w" href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="link">{contact.whatsapp}</a>],
    contact.hours && ['Hours', contact.hours],
    contact.address && ['Address', contact.address],
  ].filter(Boolean);
  return (
    <>
      <PageHeader title="Contact us" text="We reply within one working day. For the fastest answer, include your order number." crumbs={[{ name: 'Contact' }]} />
      <div className="container-site grid gap-10 py-10 sm:py-14 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <ContactForm />
        <div>
          <dl className="facts">
            <div className="facts-title">Reach us</div>
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[90px_1fr] gap-4 border-b border-black/80 px-4 py-3 text-[15px] last:border-b-0">
                <dt className="font-bold">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[15px] text-mute">
            Looking for delivery times, returns or payments? The{' '}
            <Link href="/faq" className="link font-semibold text-ink">
              FAQ
            </Link>{' '}
            answers most questions, or{' '}
            <Link href="/track-order" className="link font-semibold text-ink">
              track your order
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
