'use client';
import Link from 'next/link';

export default function GlobalError({ reset }) {
  return (
    <main className="flex min-h-[70dvh] flex-col items-start justify-center px-6 py-16 sm:px-12">
      <h1 className="display text-6xl sm:text-8xl">Something broke on our side</h1>
      <p className="mt-4 max-w-lg text-lg text-mute">The page could not load. Your cart and account are safe. Try again, and if it keeps happening, tell us at the contact page.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={() => reset()} className="btn btn-lime">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
