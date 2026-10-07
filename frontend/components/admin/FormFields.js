'use client';
import { useEffect, useId, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/services/admin';
import { getPath, setPath } from './form-utils';
import { SingleImage } from './ImageUpload';
import RichText from './RichText';

const optionCache = new Map();

// Loads { value, label } options from a list endpoint once per page load.
export function useOptions(endpoint, labelKey = 'name') {
  const [options, setOptions] = useState(() => optionCache.get(endpoint) || []);
  useEffect(() => {
    if (!endpoint) return;
    let cancelled = false;
    adminApi(`${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=500`)
      .then((res) => {
        const opts = res.data.items.map((i) => ({ value: i._id, label: i[labelKey] || i.title || i.code, raw: i }));
        optionCache.set(endpoint, opts);
        if (!cancelled) setOptions(opts);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [endpoint, labelKey]);
  return options;
}
export const clearOptionCache = (endpoint) => (endpoint ? optionCache.delete(endpoint) : optionCache.clear());

function MultiPick({ options, value, onChange }) {
  const [q, setQ] = useState('');
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="border border-line">
      {options.length > 8 && <input className="ainput border-0 border-b" placeholder="Filter" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter options" />}
      <ul className="max-h-44 overflow-y-auto p-2">
        {shown.map((o) => (
          <li key={o.value}>
            <label className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input type="checkbox" className="size-4 accent-black" checked={value.includes(o.value)} onChange={() => onChange(value.includes(o.value) ? value.filter((v) => v !== o.value) : [...value, o.value])} />
              {o.label}
            </label>
          </li>
        ))}
        {!shown.length && <li className="py-2 text-center text-xs text-mute">No options</li>}
      </ul>
      {value.length > 0 && <p className="border-t border-line px-2 py-1 text-xs text-mute">{value.length} selected</p>}
    </div>
  );
}

// Repeating rows: [{ ...columns }]. Used for shipping methods, specifications, FAQs, nutrition rows.
export function RowsEditor({ value = [], onChange, columns, addLabel = 'Add row', blank }) {
  const empty = blank || Object.fromEntries(columns.map((c) => [c.name, c.type === 'checkbox' ? true : '']));
  const set = (i, name, v) => onChange(value.map((r, k) => (k === i ? { ...r, [name]: v } : r)));
  const input = (c, row, i) =>
    c.type === 'checkbox' ? (
      <input type="checkbox" className="size-4 accent-black" checked={Boolean(row[c.name])} onChange={(e) => set(i, c.name, e.target.checked)} aria-label={c.label} />
    ) : c.type === 'textarea' ? (
      <textarea rows={2} className="ainput" value={row[c.name] ?? ''} onChange={(e) => set(i, c.name, e.target.value)} aria-label={c.label} />
    ) : (
      <input type={c.type === 'number' ? 'number' : 'text'} min={c.type === 'number' ? 0 : undefined} className="ainput" value={row[c.name] ?? ''} onChange={(e) => set(i, c.name, e.target.value)} placeholder={c.placeholder} aria-label={c.label} />
    );
  const removeBtn = (i, cls = '') => (
    <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove row" className={`flex size-10 cursor-pointer items-center justify-center text-mute hover:text-danger ${cls}`}>
      <Trash2 className="size-4" />
    </button>
  );
  return (
    <div>
      {/* phones: one card per row, label above each input */}
      <ul className="space-y-2 md:hidden">
        {value.map((row, i) => (
          <li key={i} className="border border-line bg-bone/40 p-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {columns.map((c) =>
                c.type === 'checkbox' ? (
                  <label key={c.name} className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
                    {input(c, row, i)}
                    {c.label}
                  </label>
                ) : (
                  <div key={c.name} className={c.type === 'number' ? '' : 'col-span-2'}>
                    <span className="mb-0.5 block text-xs font-semibold text-mute">{c.label}</span>
                    {input(c, row, i)}
                  </div>
                )
              )}
            </div>
            <div className="mt-1 flex justify-end">{removeBtn(i)}</div>
          </li>
        ))}
      </ul>
      {value.length > 0 && (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.name} className="pb-1 pr-2 text-left text-xs font-semibold text-mute" style={c.width ? { width: c.width } : undefined}>
                    {c.label}
                  </th>
                ))}
                <th className="w-9" />
              </tr>
            </thead>
            <tbody>
              {value.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.name} className={`pb-1.5 pr-2 align-top ${c.type === 'checkbox' ? 'pt-3' : ''}`}>
                      {input(c, row, i)}
                    </td>
                  ))}
                  <td className="pb-1.5 align-top">{removeBtn(i)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" onClick={() => onChange([...value, { ...empty }])} className="abtn abtn-ghost abtn-sm mt-1">
        <Plus className="size-3.5" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}

function AsyncField({ field, value, onChange, form, id }) {
  const all = useOptions(field.endpoint, field.labelKey);
  // filterBy: { field: 'category', key: 'category' } keeps only options whose raw[key] matches another form value.
  const options = field.filterBy ? all.filter((o) => String((o.raw[field.filterBy.key] && o.raw[field.filterBy.key]._id) || o.raw[field.filterBy.key]) === String(getPath(form, field.filterBy.field) || '')) : all;
  if (field.type === 'multiAsync') return <MultiPick options={options} value={value || []} onChange={onChange} />;
  return (
    <select id={id} className="ainput cursor-pointer" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{field.placeholder || 'None'}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function FieldControl({ field: f, form, onChange, error }) {
  const id = useId();
  // Headings have no name: they are layout only and never read or write form state.
  const value = f.name ? getPath(form, f.name) : undefined;
  const set = (v) => onChange(setPath(form, f.name, v));
  const span = f.full || ['textarea', 'richtext', 'rows', 'image', 'list', 'multiAsync', 'multiCheck', 'heading'].includes(f.type) ? 'sm:col-span-2' : '';

  if (f.type === 'heading') return <h3 className="border-b border-black pb-1 pt-2 text-sm font-bold sm:col-span-2">{f.label}</h3>;
  if (f.type === 'checkbox') {
    return (
      <label className={`flex cursor-pointer items-start gap-2.5 text-sm ${span} ${f.full ? '' : 'sm:pt-6'}`}>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-black" />
        <span>
          <span className="font-semibold">{f.label}</span>
          {f.hint && <span className="block text-xs text-mute">{f.hint}</span>}
        </span>
      </label>
    );
  }

  let control;
  switch (f.type) {
    case 'textarea': case 'list':
      control = <textarea id={id} rows={f.rows || (f.type === 'list' ? 5 : 3)} className="ainput" value={value ?? ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} maxLength={f.maxLength} />;
      break;
    case 'richtext': control = <RichText value={value || ''} onChange={set} label={f.label} />; break;
    case 'select':
      control = (
        <select id={id} className="ainput cursor-pointer" value={value ?? ''} onChange={(e) => set(e.target.value)}>
          {f.placeholder !== undefined && <option value="">{f.placeholder}</option>}
          {f.options.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      );
      break;
    case 'asyncSelect': case 'multiAsync': control = <AsyncField field={f} value={value} onChange={set} form={form} id={id} />; break;
    case 'multiCheck':
      control = (
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {f.options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-black" checked={(value || []).includes(o.value)} onChange={() => set((value || []).includes(o.value) ? value.filter((v) => v !== o.value) : [...(value || []), o.value])} />
              {o.label}
            </label>
          ))}
        </div>
      );
      break;
    case 'image': control = <SingleImage value={value || ''} onChange={set} folder={f.folder} />; break;
    case 'rows': control = <RowsEditor value={value || []} onChange={set} columns={f.columns} addLabel={f.addLabel} />; break;
    case 'date': case 'dateEnd': control = <input id={id} type="date" className="ainput" value={value || ''} onChange={(e) => set(e.target.value)} />; break;
    case 'number': control = <input id={id} type="number" min={f.min ?? 0} max={f.max} step={f.step || 'any'} className="ainput" value={value ?? ''} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} />; break;
    default:
      control = <input id={id} type={f.type === 'email' || f.type === 'password' || f.type === 'url' ? f.type : 'text'} className={`ainput ${f.upper ? 'uppercase' : ''}`} value={value ?? ''} onChange={(e) => set(f.upper ? e.target.value.toUpperCase() : e.target.value)} placeholder={f.placeholder} maxLength={f.maxLength} disabled={f.readOnly} autoComplete="off" />;
  }
  return (
    <div className={span}>
      <label htmlFor={id} className="alabel">
        {f.label}
        {f.required && <span className="text-danger"> *</span>}
      </label>
      {control}
      {error ? <p className="mt-1 text-xs font-semibold text-danger">{error}</p> : f.hint ? <p className="ahint">{f.hint}</p> : null}
    </div>
  );
}

export default function FormFields({ fields, form, onChange, errors = {} }) {
  return (
    <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
      {fields
        .filter((f) => !f.showIf || f.showIf(form))
        .map((f) => (
          <FieldControl key={f.name || f.label} field={f} form={form} onChange={onChange} error={errors[f.name]} />
        ))}
    </div>
  );
}

export const SEO_FIELDS = [
  { type: 'heading', label: 'Search engine listing' },
  { name: 'seo.title', label: 'SEO title', maxLength: 160, hint: 'Shown as the blue link in Google. Leave empty to use the name.', full: true },
  { name: 'seo.description', label: 'SEO description', type: 'textarea', rows: 2, maxLength: 320, hint: 'One or two sentences. Aim for 150 characters.' },
  { name: 'seo.keywords', label: 'SEO keywords', full: true, hint: 'Comma separated' },
];
