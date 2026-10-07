import NewsletterForm from '@/components/layout/NewsletterForm';

export default function Newsletter() {
  return (
    <section className="border-t-2 border-black bg-lime text-black">
      <div className="container-site grid items-center gap-6 py-12 lg:grid-cols-2">
        <div>
          <h2 className="display text-5xl sm:text-6xl">Offers and training notes, twice a month</h2>
          <p className="mt-2 max-w-md font-medium">New launches, restocks and a short, useful read. Unsubscribe any time.</p>
        </div>
        <NewsletterForm />
      </div>
    </section>
  );
}
