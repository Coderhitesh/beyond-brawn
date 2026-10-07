'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, LoaderCircle, Search, X } from 'lucide-react';
import Img from '@/components/ui/Img';
import useDebounce from '@/hooks/useDebounce';
import useLocalList from '@/hooks/useLocalList';
import useLockScroll from '@/hooks/useLockScroll';
import { suggest, popularSearches } from '@/services/catalog';
import { formatINR } from '@/utils/format';

export default function SearchOverlay({ open, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popular, setPopular] = useState([]);
  const recent = useLocalList('bb_recent_searches', 6);
  const term = useDebounce(q.trim(), 250);
  useLockScroll(open);

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    setResults(null);
    const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    popularSearches().then((r) => setPopular(r.data.terms)).catch(() => null);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return undefined;
    }
    const ctrl = new AbortController();
    setLoading(true);
    suggest(term, ctrl.signal)
      .then((r) => setResults(r.data))
      .catch((e) => e.name !== 'AbortError' && setResults({ products: [], categories: [], brands: [] }))
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [term]);

  if (!open) return null;

  const go = (value) => {
    const v = value.trim();
    if (!v) return;
    recent.add(v);
    onClose();
    router.push(`/search?q=${encodeURIComponent(v)}`);
  };
  const empty = results && !results.products.length && !results.categories.length && !results.brands.length;
  const chips = (title, items, icon) =>
    items.length > 0 && (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-mute">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {items.map((t) => (
            <button key={t} type="button" onClick={() => go(t)} className="flex cursor-pointer items-center gap-1.5 border border-line px-3 py-1.5 text-sm hover:border-black">
              {icon}
              {t}
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Search products">
      <button type="button" aria-label="Close search" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-black/60" />
      <div className="relative max-h-dvh overflow-y-auto border-b-2 border-black bg-white [animation:fade-in_.15s_ease-out]">
        <div className="container-site py-4">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              go(q);
            }}
            className="flex items-center gap-3 border-b-2 border-black"
          >
            <Search className="size-6 shrink-0" aria-hidden />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} type="search" enterKeyHint="search" placeholder="Search whey, creatine, SKU..." aria-label="Search products" className="h-14 w-full bg-transparent text-xl font-medium outline-none placeholder:text-mute/60 [&::-webkit-search-cancel-button]:hidden" />
            {loading && <LoaderCircle className="size-5 shrink-0 animate-spin text-mute" aria-hidden />}
            <button type="button" onClick={onClose} aria-label="Close search" className="flex size-11 shrink-0 cursor-pointer items-center justify-center hover:bg-bone">
              <X className="size-6" />
            </button>
          </form>

          <div className="py-6">
            {!results && (
              <div className="space-y-6">
                {recent.list.length > 0 && (
                  <div>
                    {chips('Recent searches', recent.list, <Clock className="size-3.5 text-mute" aria-hidden />)}
                    <button type="button" onClick={recent.clear} className="link mt-2 cursor-pointer text-sm text-mute">
                      Clear recent searches
                    </button>
                  </div>
                )}
                {chips('Popular searches', popular.length ? popular : ['whey protein', 'creatine', 'pre workout', 'omega 3'])}
              </div>
            )}

            {empty && (
              <p className="py-6 text-lg">
                Nothing matches <strong>&ldquo;{term}&rdquo;</strong>. Check the spelling or try a broader word like &ldquo;protein&rdquo;.
              </p>
            )}

            {results && !empty && (
              <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-mute">Products</h3>
                  <ul className="divide-y divide-line">
                    {results.products.map((p) => (
                      <li key={p._id}>
                        <Link href={`/products/${p.slug}`} onClick={() => recent.add(term)} className="flex items-center gap-4 py-2.5 hover:bg-bone">
                          <Img src={p.thumbnail} alt="" width={56} height={56} className="size-14 bg-bone object-cover" />
                          <span className="flex-1 font-semibold">{p.name}</span>
                          <span className="font-bold">{formatINR(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => go(q)} className="btn btn-black btn-sm mt-4">
                    See all results
                  </button>
                </div>
                {(results.categories.length > 0 || results.brands.length > 0) && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-mute">Categories and brands</h3>
                    <ul>
                      {[...results.categories, ...results.brands].map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block border-b border-line py-2 hover:font-semibold">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
