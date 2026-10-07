const ROWS = [
  ['Quality ingredients', 'Whey, creatine and actives sourced from audited suppliers. Nothing we would not take ourselves.'],
  ['Tested products', 'Every batch is checked for protein content and heavy metals before it ships.'],
  ['Authentic products', 'Sold directly by us. Each tub carries a batch number you can verify.'],
  ['Secure payments', 'UPI, cards, net banking and wallets through Razorpay. We never see your card details.'],
  ['Fast shipping', 'Orders leave our warehouse in 24 to 48 hours with tracking sent by email.'],
  ['Customer support', 'Real people, Monday to Saturday. Most questions are answered the same day.'],
];

// Reasons to trust the brand, set as a label panel instead of six icon cards.
export default function WhyUs() {
  return (
    <section className="container-site py-12 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <h2 className="display text-6xl sm:text-7xl">Why Beyond Brawn</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-mute">Supplements are easy to oversell. We would rather show you what is in the tub and let your training log do the talking.</p>
        </div>
        <dl className="facts">
          <div className="facts-title">The standard</div>
          {ROWS.map(([term, text]) => (
            <div key={term} className="grid gap-1 border-b border-black/80 px-4 py-3.5 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="font-bold">{term}</dt>
              <dd className="text-[15px] leading-relaxed text-ink/85">{text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
