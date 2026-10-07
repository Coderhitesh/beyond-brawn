'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, LoaderCircle, Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import useDebounce from '@/hooks/useDebounce';

export function PageTitle({ title, text, crumbs = [], children }) {
  return (
    <div className="mb-5">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1 text-[13px] text-mute">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/admin" className="hover:text-black hover:underline">
                Admin
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                {c.href ? (
                  <Link href={c.href} className="hover:text-black hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-black uppercase leading-none">{title}</h1>
          {text && <p className="mt-1 text-sm text-mute">{text}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

export function Btn({ variant = 'primary', size, loading, className = '', children, type = 'button', disabled, ...props }) {
  return (
    <button type={type} disabled={disabled || loading} className={`abtn abtn-${variant} ${size === 'sm' ? 'abtn-sm' : ''} ${className}`} {...props}>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search', className = '' }) {
  const [text, setText] = useState(value || '');
  const debounced = useDebounce(text, 350);
  useEffect(() => {
    if (debounced !== (value || '')) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  useEffect(() => {
    setText(value || '');
  }, [value]);
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" aria-hidden />
      <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="ainput pl-9" />
    </div>
  );
}

export function Select({ value, onChange, options, label, className = '', placeholder }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-label={label} className={`ainput w-auto cursor-pointer pr-8 ${className}`}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

const TONES = {
  green: 'bg-lime text-black',
  black: 'bg-black text-white',
  grey: 'bg-bone text-mute',
  red: 'bg-danger/10 text-danger',
  amber: 'bg-[#fff1c2] text-[#6b4e00]',
  outline: 'border border-line text-ink',
};
export const Badge = ({ tone = 'grey', children }) => <span className={`abadge ${TONES[tone] || TONES.grey}`}>{children}</span>;

const ORDER_TONE = { Pending: 'grey', Confirmed: 'amber', Processing: 'amber', Packed: 'amber', Shipped: 'black', 'Out for Delivery': 'black', Delivered: 'green', Cancelled: 'red', Failed: 'red', Refunded: 'grey' };
const PAY_TONE = { pending: 'grey', paid: 'green', failed: 'red', refund_initiated: 'amber', refunded: 'grey' };
const PAY_TEXT = { pending: 'Unpaid', paid: 'Paid', failed: 'Failed', refund_initiated: 'Refund started', refunded: 'Refunded' };
export const OrderBadge = ({ status }) => <Badge tone={ORDER_TONE[status]}>{status === 'Confirmed' ? 'To process' : status}</Badge>;
export const PayBadge = ({ status }) => <Badge tone={PAY_TONE[status]}>{PAY_TEXT[status] || status}</Badge>;
export const ActiveBadge = ({ on, yes = 'Active', no = 'Inactive' }) => <Badge tone={on ? 'green' : 'grey'}>{on ? yes : no}</Badge>;

export function Pager({ meta, onPage }) {
  if (!meta || meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.total, meta.page * meta.limit);
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px] text-mute">
      <span>
        {from} to {to} of {meta.total}
      </span>
      {meta.pages > 1 && (
        <span className="flex items-center gap-1.5">
          <button type="button" className="abtn abtn-ghost abtn-sm px-2" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page">
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-1 text-ink">
            Page {meta.page} of {meta.pages}
          </span>
          <button type="button" className="abtn abtn-ghost abtn-sm px-2" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)} aria-label="Next page">
            <ChevronRight className="size-4" />
          </button>
        </span>
      )}
    </div>
  );
}

/*
 * columns: [{ key, label, render?(row), align?, className? }]
 * selection: { ids: [], onChange } enables row checkboxes for bulk actions.
 */
export function DataTable({ columns, rows, rowKey = '_id', loading, error, onRetry, empty = 'Nothing here yet.', selection, meta, onPage, minWidth = 720 }) {
  const ids = rows.map((r) => r[rowKey]);
  const allSelected = selection && ids.length > 0 && ids.every((id) => selection.ids.includes(id));
  const toggleAll = () => selection.onChange(allSelected ? selection.ids.filter((id) => !ids.includes(id)) : [...new Set([...selection.ids, ...ids])]);
  const toggle = (id) => selection.onChange(selection.ids.includes(id) ? selection.ids.filter((x) => x !== id) : [...selection.ids, id]);
  const span = columns.length + (selection ? 1 : 0);
  const isBlank = (v) => v === '' || v === null || v === undefined || v === false;
  const cell = (c, row) => (c.render ? c.render(row) : row[c.key]);
  // Phone layout: first column is the card title, "_" columns are actions, the rest become label / value pairs.
  const [lead, ...rest] = columns;
  const actions = rest.filter((c) => c.key.startsWith('_'));
  const fields = rest.filter((c) => !c.key.startsWith('_'));
  const state = !rows.length && (
    loading ? (
      <LoaderCircle className="mx-auto size-5 animate-spin" aria-label="Loading" />
    ) : error ? (
      <span role="alert">
        <span className="font-semibold text-danger">{error}</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="ml-3 cursor-pointer underline">
            Try again
          </button>
        )}
      </span>
    ) : (
      empty
    )
  );
  return (
    <div className="acard">
      {/* phones */}
      <div className={`md:hidden ${loading && rows.length ? 'opacity-50' : ''}`}>
        {selection && rows.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2.5 border-b-2 border-black px-3 py-2.5 text-[13px] font-semibold text-mute">
            <input type="checkbox" checked={Boolean(allSelected)} onChange={toggleAll} className="size-4 accent-black" />
            Select all on this page
          </label>
        )}
        <ul>
          {rows.map((row) => (
            <li key={row[rowKey]} className="border-b border-line p-3 last:border-b-0">
              <div className="flex items-start gap-3">
                {selection && <input type="checkbox" checked={selection.ids.includes(row[rowKey])} onChange={() => toggle(row[rowKey])} aria-label="Select row" className="mt-1 size-4 shrink-0 accent-black" />}
                <div className="min-w-0 flex-1 text-sm">{cell(lead, row)}</div>
              </div>
              <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                {fields.map((c) => {
                  const v = cell(c, row);
                  if (isBlank(v)) return null;
                  return (
                    <div key={c.key} className={`min-w-0 ${c.className && c.className.includes('max-w') ? 'col-span-2' : ''}`}>
                      {c.label && <dt className="text-xs text-mute">{c.label}</dt>}
                      <dd className="break-words">{v}</dd>
                    </div>
                  );
                })}
              </dl>
              {actions.length > 0 && <div className="mt-2.5 flex flex-wrap justify-end gap-1">{actions.map((c) => <span key={c.key}>{cell(c, row)}</span>)}</div>}
            </li>
          ))}
        </ul>
        {state && <div className="px-3 py-12 text-center text-sm text-mute">{state}</div>}
      </div>

      {/* tablets and up */}
      <div className="hidden overflow-x-auto md:block">
        <table className="atable" style={{ minWidth }}>
          <thead>
            <tr>
              {selection && (
                <th className="w-9">
                  <input type="checkbox" checked={Boolean(allSelected)} onChange={toggleAll} aria-label="Select all rows on this page" className="size-4 cursor-pointer accent-black" />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} scope="col" className={c.align === 'right' ? 'text-right!' : ''}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={loading && rows.length ? 'opacity-50' : ''}>
            {rows.map((row) => (
              <tr key={row[rowKey]}>
                {selection && (
                  <td>
                    <input type="checkbox" checked={selection.ids.includes(row[rowKey])} onChange={() => toggle(row[rowKey])} aria-label="Select row" className="size-4 cursor-pointer accent-black" />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={`${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.className || ''}`}>
                    {cell(c, row)}
                  </td>
                ))}
              </tr>
            ))}
            {state && (
              <tr>
                <td colSpan={span} className="py-12! text-center text-mute">
                  {state}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {meta && onPage && <Pager meta={meta} onPage={onPage} />}
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, text, action = 'Delete', loading, danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {action}
          </Btn>
        </div>
      }
    >
      <p className="text-[15px] leading-relaxed">{text}</p>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div role="tablist" className={`scrollbar-none flex gap-1 overflow-x-auto border-b-2 border-black ${className}`}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button key={t.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(t.value)} className={`flex shrink-0 cursor-pointer items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap ${active ? 'bg-black text-white' : 'hover:bg-bone'}`}>
            {t.label}
            {t.count !== undefined && <span className={`px-1.5 text-xs ${active ? 'bg-lime text-black' : 'bg-bone text-mute'}`}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Stat({ label, value, sub, href, tone }) {
  const body = (
    <>
      <p className="text-[13px] font-semibold text-mute">{label}</p>
      <p className={`mt-1 font-display text-4xl font-black leading-none ${tone === 'alert' ? 'text-danger' : ''}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-mute">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="acard block p-4 hover:border-black">
      {body}
    </Link>
  ) : (
    <div className="acard p-4">{body}</div>
  );
}

export const Card = ({ title, action, children, className = '', pad = true }) => (
  <section className={`acard ${className}`}>
    {title && (
      <div className="acard-head">
        <h2 className="acard-title">{title}</h2>
        {action}
      </div>
    )}
    <div className={pad ? 'p-4' : ''}>{children}</div>
  </section>
);

export const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-2.5 text-sm">
    <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 cursor-pointer accent-black" />
    <span>
      <span className="font-semibold">{label}</span>
      {hint && <span className="block text-xs text-mute">{hint}</span>}
    </span>
  </label>
);

export const Loading = () => (
  <div className="flex justify-center py-20" role="status" aria-label="Loading">
    <LoaderCircle className="size-6 animate-spin text-mute" />
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="acard p-6 text-center" role="alert">
    <p className="font-semibold text-danger">{message}</p>
    {onRetry && (
      <Btn variant="ghost" className="mt-3" onClick={onRetry}>
        Try again
      </Btn>
    )}
  </div>
);
