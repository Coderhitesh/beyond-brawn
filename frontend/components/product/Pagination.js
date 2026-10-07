import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function pages(current, total) {
  const set = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

export default function Pagination({ meta, pathname, searchParams = {} }) {
  if (!meta || meta.pages <= 1) return null;
  const href = (page) => {
    const qs = new URLSearchParams(Object.entries(searchParams).filter(([, v]) => typeof v === 'string' && v !== ''));
    if (page > 1) qs.set('page', String(page));
    else qs.delete('page');
    const s = qs.toString();
    return s ? `${pathname}?${s}` : pathname;
  };
  const cell = 'flex size-11 items-center justify-center border border-black font-semibold';
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {meta.page > 1 && (
        <Link href={href(meta.page - 1)} aria-label="Previous page" rel="prev" className={`${cell} hover:bg-black hover:text-white`}>
          <ChevronLeft className="size-5" />
        </Link>
      )}
      {pages(meta.page, meta.pages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="px-1 text-mute" aria-hidden>
            ...
          </span>
        ) : p === meta.page ? (
          <span key={p} aria-current="page" className={`${cell} bg-black text-white`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} aria-label={`Page ${p}`} className={`${cell} hover:bg-black hover:text-white`}>
            {p}
          </Link>
        )
      )}
      {meta.page < meta.pages && (
        <Link href={href(meta.page + 1)} aria-label="Next page" rel="next" className={`${cell} hover:bg-black hover:text-white`}>
          <ChevronRight className="size-5" />
        </Link>
      )}
    </nav>
  );
}
