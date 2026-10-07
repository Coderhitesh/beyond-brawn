import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import JsonLd from '@/components/ui/JsonLd';
import { apiGet } from '@/lib/server-api';
import { buildMetadata, faqLd } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Help and FAQ', description: 'Answers about delivery, payments, returns, refunds and Beyond Brawn products.', path: '/faq' });

export default async function FaqPage() {
  const res = await apiGet('/faqs', { revalidate: 300 });
  const faqs = (res && res.data.faqs) || [];
  const groups = faqs.reduce((acc, f) => ({ ...acc, [f.category]: [...(acc[f.category] || []), f] }), {});
  return (
    <>
      <PageHeader title="Help and FAQ" text="Delivery, payments, returns and products." crumbs={[{ name: 'FAQ' }]} />
      <div className="container-site grid gap-10 py-10 sm:py-14 lg:grid-cols-[220px_1fr] lg:gap-16">
        <nav aria-label="FAQ topics" className="hidden lg:block">
          <ul className="sticky top-24 border-t-2 border-black">
            {Object.keys(groups).map((g) => (
              <li key={g}>
                <a href={`#${encodeURIComponent(g)}`} className="block border-b border-line py-2.5 font-semibold hover:border-black">
                  {g}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-3xl space-y-12">
          {Object.entries(groups).map(([group, items]) => (
            <section key={group} id={encodeURIComponent(group)} className="scroll-mt-28">
              <h2 className="h-section border-b-2 border-black pb-3">{group}</h2>
              {items.map((f) => (
                <details key={f._id} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <span aria-hidden className="relative size-4 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-0.5 before:w-full before:-translate-y-1/2 before:bg-black after:absolute after:left-1/2 after:top-0 after:h-full after:w-0.5 after:-translate-x-1/2 after:bg-black after:transition-transform group-open:after:rotate-90" />
                  </summary>
                  <p className="max-w-prose pb-5 leading-relaxed text-ink/90">{f.answer}</p>
                </details>
              ))}
            </section>
          ))}
          {!faqs.length && <p className="text-mute">No questions have been published yet.</p>}
          <p className="border-2 border-black p-5 text-lg">
            Still stuck?{' '}
            <Link href="/contact" className="link font-bold">
              Contact support
            </Link>{' '}
            and we will sort it out.
          </p>
        </div>
      </div>
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
    </>
  );
}
