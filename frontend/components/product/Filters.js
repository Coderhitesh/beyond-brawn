'use client';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Stars from '@/components/ui/Stars';
import { SORTS } from '@/lib/config';

const MULTI = ['brand', 'type', 'dietary'];
const FILTER_KEYS = ['subcategory', 'brand', 'type', 'dietary', 'minPrice', 'maxPrice', 'rating', 'inStock'];

function Group({ title, children }) {
  return (
    <fieldset className="border-t border-black py-4 first:border-t-0 first:pt-0">
      <legend className="float-left mb-3 w-full font-display text-xl font-black uppercase leading-none">{title}</legend>
      <div className="clear-both space-y-2">{children}</div>
    </fieldset>
  );
}

function Check({ type = 'checkbox', name, checked, onChange, children, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
      <input type={type} name={name} checked={checked} onChange={onChange} className="size-[18px] shrink-0 cursor-pointer accent-black" />
      <span className="flex-1">{children}</span>
      {count !== undefined && <span className="text-sm text-mute">{count}</span>}
    </label>
  );
}

export default function Filters({ facets, showSubCategories = false, total }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });

  useEffect(() => {
    setPrice({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });
  }, [params]);

  const push = (next) => {
    next.delete('page');
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '' || value === undefined) next.delete(key);
    else next.set(key, value);
    push(next);
  };
  const values = (key) => (params.get(key) || '').split(',').filter(Boolean);
  const toggleMulti = (key, value) => {
    const cur = values(key);
    setParam(key, (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]).join(','));
  };
  const applyPrice = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    ['min', 'max'].forEach((k) => (price[k] ? next.set(`${k}Price`, price[k]) : next.delete(`${k}Price`)));
    push(next);
  };
  const clearAll = () => {
    const next = new URLSearchParams(params);
    FILTER_KEYS.forEach((k) => next.delete(k));
    push(next);
  };
  const activeCount = FILTER_KEYS.reduce((n, k) => n + (MULTI.includes(k) ? values(k).length : params.get(k) ? 1 : 0), 0) - (params.get('minPrice') && params.get('maxPrice') ? 1 : 0);

  const body = facets && (
    <div className={pending ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {showSubCategories && facets.subCategories.length > 0 && (
        <Group title="Type">
          <Check type="radio" name="sub" checked={!params.get('subcategory')} onChange={() => setParam('subcategory', null)}>
            All
          </Check>
          {facets.subCategories.map((s) => (
            <Check key={s.slug} type="radio" name="sub" checked={params.get('subcategory') === s.slug} onChange={() => setParam('subcategory', s.slug)} count={s.count}>
              {s.name}
            </Check>
          ))}
        </Group>
      )}
      <Group title="Availability">
        <Check checked={params.get('inStock') === '1'} onChange={(e) => setParam('inStock', e.target.checked ? '1' : null)}>
          In stock only
        </Check>
      </Group>
      <Group title="Price">
        <form onSubmit={applyPrice} className="flex items-end gap-2">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-mute">Min ₹</span>
            <input type="number" inputMode="numeric" min="0" value={price.min} onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value }))} placeholder={String(facets.price.min)} className="input h-10 px-2.5" />
          </label>
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-mute">Max ₹</span>
            <input type="number" inputMode="numeric" min="0" value={price.max} onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value }))} placeholder={String(facets.price.max)} className="input h-10 px-2.5" />
          </label>
          <button type="submit" className="btn btn-sm btn-black px-3">
            Go
          </button>
        </form>
      </Group>
      {facets.brands.length > 1 && (
        <Group title="Brand">
          {facets.brands.map((b) => (
            <Check key={b.slug} checked={values('brand').includes(b.slug)} onChange={() => toggleMulti('brand', b.slug)} count={b.count}>
              {b.name}
            </Check>
          ))}
        </Group>
      )}
      <Group title="Rating">
        {[4, 3].map((r) => (
          <Check key={r} type="radio" name="rating" checked={params.get('rating') === String(r)} onChange={() => setParam('rating', String(r))}>
            <span className="flex items-center gap-1.5">
              <Stars value={r} /> and up
            </span>
          </Check>
        ))}
        {params.get('rating') && (
          <button type="button" onClick={() => setParam('rating', null)} className="link cursor-pointer text-sm text-mute">
            Any rating
          </button>
        )}
      </Group>
      {facets.types.length > 1 && (
        <Group title="Product form">
          {facets.types.map((t) => (
            <Check key={t.name} checked={values('type').includes(t.name)} onChange={() => toggleMulti('type', t.name)} count={t.count}>
              {t.name}
            </Check>
          ))}
        </Group>
      )}
      {facets.dietary.length > 0 && (
        <Group title="Dietary preference">
          {facets.dietary.map((t) => (
            <Check key={t.name} checked={values('dietary').includes(t.name)} onChange={() => toggleMulti('dietary', t.name)} count={t.count}>
              {t.name}
            </Check>
          ))}
        </Group>
      )}
      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="btn btn-outline btn-sm mt-2 w-full">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3 lg:col-start-2">
        <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-outline lg:hidden">
          <SlidersHorizontal className="size-4" aria-hidden />
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
        <p className="hidden text-[15px] text-mute lg:block" aria-live="polite">
          {total} {total === 1 ? 'product' : 'products'}
        </p>
        <label className="flex items-center gap-2 text-[15px]">
          <span className="hidden text-mute sm:inline">Sort by</span>
          <select value={params.get('sort') || 'featured'} onChange={(e) => setParam('sort', e.target.value === 'featured' ? null : e.target.value)} aria-label="Sort products" className="h-10 cursor-pointer border border-black bg-white px-3 pr-8 font-semibold">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <aside aria-label="Filters" className="hidden lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block">
        <div className="sticky top-24">{body}</div>
      </aside>
      <Modal open={open} onClose={() => setOpen(false)} title="Filters" side="left" width="max-w-sm" footer={<button type="button" onClick={() => setOpen(false)} className="btn btn-lime w-full">{`Show ${total} ${total === 1 ? 'product' : 'products'}`}</button>}>
        {body}
      </Modal>
    </>
  );
}
