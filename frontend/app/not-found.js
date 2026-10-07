import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="on-dark flex min-h-dvh flex-col items-start justify-center bg-black px-6 py-16 text-white sm:px-12">
      <p className="font-display text-[clamp(7rem,30vw,20rem)] font-black leading-[0.8] text-lime">404</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">This page skipped leg day</h1>
      <p className="mt-4 max-w-lg text-lg text-white/80">The link is broken or the page has moved. The products are still where you left them.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-lime">
          Go to homepage
        </Link>
        <Link href="/shop" className="btn btn-outline">
          Shop products
        </Link>
      </div>
    </main>
  );
}
