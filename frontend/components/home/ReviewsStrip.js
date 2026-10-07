import Link from 'next/link';
import Stars from '@/components/ui/Stars';

export default function ReviewsStrip({ reviews = [] }) {
  if (!reviews.length) return null;
  return (
    <section className="on-dark bg-black text-white">
      <div className="container-site py-12 sm:py-16">
        <h2 className="h-section">What lifters say</h2>
        <ul className="mt-8 grid gap-px bg-white/20 md:grid-cols-3">
          {reviews.slice(0, 3).map((r) => (
            <li key={r.id} className="flex flex-col bg-black py-6 md:px-6 md:first:pl-0 md:last:pr-0">
              <span className="[&_.text-black]:text-lime [&_.text-line]:text-white/25">
                <Stars value={r.rating} size={16} />
              </span>
              <blockquote className="mt-3 flex-1 text-lg leading-relaxed">
                {r.title && <strong className="block">{r.title}</strong>}
                {r.comment.length > 220 ? `${r.comment.slice(0, 220)}...` : r.comment}
              </blockquote>
              <p className="mt-4 text-sm text-white/65">
                {r.name}, on{' '}
                <Link href={`/products/${r.product.slug}`} className="text-white underline underline-offset-4 hover:text-lime">
                  {r.product.name}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
