'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Plus, Trash2, Wand2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { GOALS } from '@/lib/config';
import { adminApi } from '@/services/admin';
import FormFields, { RowsEditor, SEO_FIELDS, useOptions } from './FormFields';
import { Gallery } from './ImageUpload';
import { Btn, Card, ErrorBox, Loading, PageTitle, Tabs, Toggle } from './ui';

const TABS = [
  { value: 'basics', label: 'Basics' },
  { value: 'pricing', label: 'Pricing and stock' },
  { value: 'images', label: 'Images' },
  { value: 'variants', label: 'Variants' },
  { value: 'details', label: 'Details' },
  { value: 'seo', label: 'SEO' },
];

const EMPTY = {
  name: '', slug: '', sku: '', brand: '', category: '', subCategory: '', shortDescription: '', description: '', tags: '', goals: [], productType: '', dietary: '',
  isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: false,
  mrp: '', price: '', costPrice: '', gstRate: 18, stock: 0, lowStockThreshold: 10, weightGrams: '',
  images: [], thumbnail: '', videoUrl: '',
  hasVariants: false, variantOptions: [],
  benefits: '', ingredients: '', directions: '', warnings: '', specifications: [], faqs: [],
  nutritionFacts: { servingSize: '', servingsPerContainer: '', rows: [] },
  seo: { title: '', description: '', keywords: '' },
};

const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || '';
const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
const skuPart = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

function fromApi(product) {
  const p = product;
  return {
    ...EMPTY,
    ...Object.fromEntries(Object.keys(EMPTY).filter((k) => p[k] !== undefined && p[k] !== null).map((k) => [k, p[k]])),
    brand: idOf(p.brand), category: idOf(p.category), subCategory: idOf(p.subCategory),
    tags: (p.tags || []).join(', '), dietary: (p.dietary || []).join(', '), benefits: (p.benefits || []).join('\n'),
    variantOptions: (p.variantOptions || []).map((o) => ({ name: o.name, values: (o.values || []).join(', ') })),
    nutritionFacts: { ...EMPTY.nutritionFacts, ...(p.nutritionFacts || {}), rows: (p.nutritionFacts && p.nutritionFacts.rows) || [] },
    seo: { ...EMPTY.seo, ...(p.seo || {}) },
    costPrice: p.costPrice ?? '', weightGrams: p.weightGrams ?? '',
  };
}

const splitList = (s, sep) => String(s || '').split(sep).map((x) => x.trim()).filter(Boolean);

function toApi(form, variants) {
  const options = form.variantOptions.map((o) => ({ name: o.name.trim(), values: splitList(o.values, ',') })).filter((o) => o.name && o.values.length);
  const body = {
    name: form.name.trim(), sku: form.sku.trim(), category: form.category, brand: form.brand || null, subCategory: form.subCategory || null,
    shortDescription: form.shortDescription, description: form.description,
    tags: splitList(form.tags, ','), goals: form.goals, productType: form.productType, dietary: splitList(form.dietary, ','),
    isActive: form.isActive, isFeatured: form.isFeatured, isBestSeller: form.isBestSeller, isNewArrival: form.isNewArrival,
    mrp: num(form.mrp) ?? 0, price: num(form.price) ?? 0, gstRate: num(form.gstRate) ?? 18, lowStockThreshold: num(form.lowStockThreshold) ?? 0,
    images: form.images.map((i) => ({ url: i.url, publicId: i.publicId || null, alt: i.alt || form.name })), thumbnail: form.thumbnail || (form.images[0] ? form.images[0].url : null), videoUrl: form.videoUrl || null,
    hasVariants: form.hasVariants, variantOptions: form.hasVariants ? options : [],
    benefits: splitList(form.benefits, '\n'), ingredients: form.ingredients, directions: form.directions, warnings: form.warnings,
    specifications: form.specifications.filter((s) => s.label && s.value), faqs: form.faqs.filter((f) => f.question && f.answer),
    nutritionFacts: { servingSize: form.nutritionFacts.servingSize, servingsPerContainer: form.nutritionFacts.servingsPerContainer, rows: form.nutritionFacts.rows.filter((r) => r.label) },
    seo: form.seo,
  };
  if (form.slug.trim()) body.slug = form.slug.trim();
  if (num(form.costPrice) !== undefined) body.costPrice = num(form.costPrice);
  if (num(form.weightGrams) !== undefined) body.weightGrams = num(form.weightGrams);
  if (form.hasVariants) {
    body.variants = variants.map((v, i) => ({
      ...(v._id ? { _id: v._id } : {}), sku: v.sku.trim(), options: v.options, label: Object.values(v.options).join(' / '),
      mrp: Math.max(num(v.mrp) ?? 0, num(v.price) ?? 0), price: num(v.price) ?? 0, stock: num(v.stock) ?? 0, isActive: v.isActive !== false, sortOrder: i,
      ...(num(v.costPrice) !== undefined ? { costPrice: num(v.costPrice) } : {}),
    }));
    // The product row mirrors its cheapest variant; the API recalculates this too.
    const cheapest = [...body.variants].sort((a, b) => a.price - b.price)[0];
    if (cheapest) {
      body.price = cheapest.price;
      body.mrp = cheapest.mrp;
    }
  } else body.stock = num(form.stock) ?? 0;
  return body;
}

function check(form, variants) {
  const e = [];
  if (form.name.trim().length < 2) e.push(['basics', 'Enter the product name']);
  if (form.sku.trim().length < 2) e.push(['basics', 'Enter a SKU']);
  if (!form.category) e.push(['basics', 'Choose a category']);
  if (form.hasVariants) {
    if (!variants.length) e.push(['variants', 'Add at least one variant, or turn variants off']);
    variants.forEach((v, i) => {
      if (!v.sku.trim()) e.push(['variants', `Variant ${i + 1} needs a SKU`]);
      if (!(Number(v.price) > 0)) e.push(['variants', `Variant ${i + 1} needs a selling price`]);
    });
    const skus = variants.map((v) => v.sku.trim().toUpperCase());
    if (new Set(skus).size !== skus.length) e.push(['variants', 'Each variant needs its own SKU']);
  } else {
    if (!(Number(form.price) > 0)) e.push(['pricing', 'Enter the selling price']);
    if (Number(form.price) > Number(form.mrp || 0)) e.push(['pricing', 'Selling price cannot be higher than MRP']);
  }
  return e;
}

export default function ProductForm({ id }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState('basics');
  const [form, setForm] = useState(EMPTY);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState([]);
  const [slug, setSlug] = useState('');
  const attributes = useOptions('/attributes');

  const apply = (data) => {
    setForm(fromApi(data.product));
    setVariants(data.variants.map((v) => ({ _id: v._id, sku: v.sku, options: v.options || {}, mrp: v.mrp, price: v.price, costPrice: v.costPrice ?? '', stock: v.stock, isActive: v.isActive })));
    setSlug(data.product.slug);
  };
  const load = () => {
    setLoading(true);
    setLoadError(null);
    adminApi(`/products/${id}`).then((r) => apply(r.data)).catch((e) => setLoadError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const off = Number(form.mrp) > Number(form.price) && Number(form.price) > 0 ? Math.round(((form.mrp - form.price) / form.mrp) * 100) : 0;
  const margin = Number(form.price) > 0 && form.costPrice !== '' ? Math.round(((form.price - form.costPrice) / form.price) * 100) : null;

  const basics = useMemo(
    () => [
      { name: 'name', label: 'Product name', required: true, full: true, maxLength: 160 },
      { name: 'sku', label: 'SKU', required: true, upper: true, hint: 'Your stock code. Must be unique.' },
      { name: 'slug', label: 'URL slug', hint: 'Leave empty to create it from the name' },
      { name: 'category', label: 'Category', type: 'asyncSelect', endpoint: '/categories', placeholder: 'Choose category', required: true },
      { name: 'subCategory', label: 'Subcategory', type: 'asyncSelect', endpoint: '/subcategories', placeholder: 'None', filterBy: { field: 'category', key: 'category' } },
      { name: 'brand', label: 'Brand', type: 'asyncSelect', endpoint: '/brands', placeholder: 'No brand' },
      { name: 'productType', label: 'Product form', type: 'select', placeholder: 'Not set', options: ['Powder', 'Capsule', 'Tablet', 'Liquid', 'Bar', 'Accessory'] },
      { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 2, maxLength: 300, hint: 'One or two lines shown on product cards and at the top of the product page' },
      { name: 'description', label: 'Full description', type: 'richtext' },
      { name: 'goals', label: 'Fitness goals', type: 'multiCheck', options: GOALS.map((g) => ({ value: g.slug, label: g.name })) },
      { name: 'tags', label: 'Tags', hint: 'Comma separated. Helps search, e.g. whey, protein, stack', full: true },
      { name: 'dietary', label: 'Dietary labels', hint: 'Comma separated, e.g. Vegetarian, Gluten Free, No Added Sugar', full: true },
    ],
    []
  );

  /* ----- variants ----- */
  const generate = () => {
    const opts = form.variantOptions.map((o) => ({ name: o.name.trim(), values: splitList(o.values, ',') })).filter((o) => o.name && o.values.length);
    if (!opts.length) return toast.error('Add at least one option with values first');
    const combos = opts.reduce((acc, o) => acc.flatMap((c) => o.values.map((v) => ({ ...c, [o.name]: v }))), [{}]);
    if (combos.length > 60) return toast.error('That makes more than 60 variants. Reduce the option values.');
    const key = (o) => opts.map((x) => o[x.name]).join('|');
    const existing = new Map(variants.map((v) => [key(v.options), v]));
    setVariants(combos.map((c) => existing.get(key(c)) || { sku: [form.sku.trim().toUpperCase(), ...Object.values(c).map(skuPart)].filter(Boolean).join('-'), options: c, mrp: form.mrp, price: form.price, costPrice: form.costPrice, stock: 0, isActive: true }));
    return toast.success(`${combos.length} variants ready. Set price and stock for each.`);
  };
  const setVariant = (i, patch) => setVariants((vs) => vs.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  const save = async () => {
    const errs = check(form, variants);
    setProblems(errs.map((x) => x[1]));
    if (errs.length) {
      setTab(errs[0][0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const body = toApi(form, variants);
      const res = id ? await adminApi(`/products/${id}`, { method: 'PUT', body }) : await adminApi('/products', { method: 'POST', body });
      toast.success(res.message);
      if (id) apply(res.data);
      else router.replace(`/admin/products/${res.data.product._id}`);
    } catch (err) {
      setProblems(Array.isArray(err.details) ? err.details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)) : [err.message]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (loadError) return <ErrorBox message={loadError} onRetry={load} />;

  return (
    <>
      <PageTitle title={id ? form.name || 'Edit product' : 'Add product'} crumbs={[{ label: 'Products', href: '/admin/products' }, { label: id ? 'Edit' : 'Add' }]}>
        {id && slug && form.isActive && (
          <a href={`/products/${slug}`} target="_blank" rel="noopener noreferrer" className="abtn abtn-ghost">
            View on store
            <ExternalLink className="size-4" aria-hidden />
          </a>
        )}
        <Link href="/admin/products" className="abtn abtn-ghost">Cancel</Link>
        <Btn variant="lime" loading={saving} onClick={save}>{id ? 'Save changes' : 'Create product'}</Btn>
      </PageTitle>

      {problems.length > 0 && (
        <div className="mb-4 border-2 border-danger bg-white px-4 py-3 text-sm" role="alert">
          <p className="font-bold text-danger">Fix these before saving:</p>
          <ul className="mt-1 list-disc pl-5">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
          <div className="acard border-t-0 p-4 sm:p-5">
            {tab === 'basics' && <FormFields fields={basics} form={form} onChange={(next) => setForm(next.category !== form.category ? { ...next, subCategory: '' } : next)} />}

            {tab === 'pricing' && (
              <div className="space-y-5">
                {form.hasVariants && <p className="bg-bone px-3 py-2 text-sm">This product has variants. Price and stock are set per variant in the Variants tab. The values here are only used as defaults for new variants.</p>}
                <FormFields
                  form={form} onChange={setForm}
                  fields={[
                    { name: 'mrp', label: 'MRP (₹)', type: 'number', required: !form.hasVariants, hint: 'Maximum retail price printed on the pack' },
                    { name: 'price', label: 'Selling price (₹)', type: 'number', required: !form.hasVariants, hint: off ? `Customers see ${off}% off` : 'What the customer pays, including GST' },
                    { name: 'costPrice', label: 'Cost price (₹)', type: 'number', hint: margin !== null ? `Margin ${margin}%. Never shown to customers.` : 'Optional. Never shown to customers.' },
                    { name: 'gstRate', label: 'GST rate (%)', type: 'number', max: 40 },
                    ...(form.hasVariants ? [] : [{ name: 'stock', label: 'Stock on hand', type: 'number', step: 1, hint: id ? 'Changing this records a stock adjustment' : 'Opening stock' }]),
                    { name: 'lowStockThreshold', label: 'Low-stock alert at', type: 'number', step: 1, hint: 'You are notified when stock falls to this number' },
                    { name: 'weightGrams', label: 'Shipping weight (g)', type: 'number' },
                  ]}
                />
              </div>
            )}

            {tab === 'images' && (
              <div className="space-y-5">
                <Gallery images={form.images} onChange={(images) => set({ images })} thumbnail={form.thumbnail} onThumbnail={(thumbnail) => set({ thumbnail })} />
                <FormFields form={form} onChange={setForm} fields={[{ name: 'videoUrl', label: 'Product video URL (optional)', full: true, placeholder: 'https://www.youtube.com/watch?v=...' }]} />
              </div>
            )}

            {tab === 'variants' && (
              <div className="space-y-5">
                <Toggle checked={form.hasVariants} onChange={(v) => set({ hasVariants: v })} label="This product comes in different options" hint="For example flavours or sizes, each with its own SKU, price and stock" />
                {form.hasVariants && (
                  <>
                    <div>
                      <h3 className="mb-2 text-sm font-bold">1. Options</h3>
                      <div className="space-y-2">
                        {form.variantOptions.map((o, i) => (
                          <div key={i} className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
                            <input className="ainput" list="attribute-names" placeholder="Option name, e.g. Flavor" value={o.name} aria-label="Option name"
                              onChange={(e) => {
                                const attr = attributes.find((a) => a.label === e.target.value);
                                set({ variantOptions: form.variantOptions.map((x, k) => (k === i ? { name: e.target.value, values: attr && !x.values ? attr.raw.values.join(', ') : x.values } : x)) });
                              }} />
                            <input className="ainput" placeholder="Values, comma separated, e.g. Chocolate, Vanilla" value={o.values} aria-label="Option values" onChange={(e) => set({ variantOptions: form.variantOptions.map((x, k) => (k === i ? { ...x, values: e.target.value } : x)) })} />
                            <button type="button" aria-label="Remove option" onClick={() => set({ variantOptions: form.variantOptions.filter((_, k) => k !== i) })} className="flex size-10 cursor-pointer items-center justify-center text-mute hover:text-danger"><Trash2 className="size-4" /></button>
                          </div>
                        ))}
                        <datalist id="attribute-names">{attributes.map((a) => <option key={a.value} value={a.label} />)}</datalist>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.variantOptions.length < 3 && <Btn variant="ghost" size="sm" onClick={() => set({ variantOptions: [...form.variantOptions, { name: '', values: '' }] })}><Plus className="size-3.5" aria-hidden />Add option</Btn>}
                        <Btn size="sm" onClick={generate}><Wand2 className="size-3.5" aria-hidden />Build variants from options</Btn>
                      </div>
                      <p className="ahint">Typing a saved attribute name fills in its values. Building keeps the variants you already have.</p>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-bold">2. Variants ({variants.length})</h3>
                      {variants.length > 0 ? (
                        <>
                        <ul className="space-y-2 md:hidden">
                          {variants.map((v, i) => (
                            <li key={v._id || i} className="border border-line p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold">{Object.values(v.options).join(' / ') || 'Default'}</span>
                                <button type="button" aria-label="Remove variant" onClick={() => setVariants(variants.filter((_, k) => k !== i))} className="flex size-9 cursor-pointer items-center justify-center text-mute hover:text-danger"><Trash2 className="size-4" /></button>
                              </div>
                              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2">
                                <label className="col-span-2 text-xs font-semibold text-mute">SKU<input className="ainput mt-0.5 uppercase" value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })} /></label>
                                {[['mrp', 'MRP (₹)'], ['price', 'Price (₹)'], ['costPrice', 'Cost (₹)'], ['stock', 'Stock']].map(([k, l]) => (
                                  <label key={k} className="text-xs font-semibold text-mute">{l}<input type="number" min="0" className="ainput mt-0.5" value={v[k] ?? ''} onChange={(e) => setVariant(i, { [k]: e.target.value })} /></label>
                                ))}
                                <label className="col-span-2 flex cursor-pointer items-center gap-2 text-[13px] font-semibold"><input type="checkbox" className="size-4 accent-black" checked={v.isActive !== false} onChange={(e) => setVariant(i, { isActive: e.target.checked })} />Active</label>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="hidden overflow-x-auto border border-line md:block">
                          <table className="atable min-w-[760px]">
                            <thead>
                              <tr><th>Variant</th><th>SKU</th><th>MRP (₹)</th><th>Price (₹)</th><th>Cost (₹)</th><th>Stock</th><th>Active</th><th /></tr>
                            </thead>
                            <tbody>
                              {variants.map((v, i) => (
                                <tr key={v._id || i}>
                                  <td className="font-semibold">{Object.values(v.options).join(' / ') || 'Default'}</td>
                                  <td><input className="ainput h-9 w-44 uppercase" value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })} aria-label="Variant SKU" /></td>
                                  {['mrp', 'price', 'costPrice', 'stock'].map((k) => (
                                    <td key={k}><input type="number" min="0" className="ainput h-9 w-24" value={v[k] ?? ''} onChange={(e) => setVariant(i, { [k]: e.target.value })} aria-label={k} /></td>
                                  ))}
                                  <td><input type="checkbox" className="size-4 accent-black" checked={v.isActive !== false} onChange={(e) => setVariant(i, { isActive: e.target.checked })} aria-label="Active" /></td>
                                  <td><button type="button" aria-label="Remove variant" onClick={() => setVariants(variants.filter((_, k) => k !== i))} className="flex size-8 cursor-pointer items-center justify-center text-mute hover:text-danger"><Trash2 className="size-4" /></button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        </>
                      ) : (
                        <p className="border border-dashed border-line px-4 py-8 text-center text-sm text-mute">No variants yet. Add options above, then build the variants.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'details' && (
              <div className="space-y-5">
                <FormFields
                  form={form} onChange={setForm}
                  fields={[
                    { name: 'benefits', label: 'Benefits', type: 'list', hint: 'One benefit per line. Shown as a tick list.' },
                    { name: 'ingredients', label: 'Ingredients', type: 'textarea', rows: 3 },
                    { name: 'directions', label: 'Directions for use', type: 'textarea', rows: 3 },
                    { name: 'warnings', label: 'Warnings', type: 'textarea', rows: 3 },
                    { type: 'heading', label: 'Nutrition facts' },
                    { name: 'nutritionFacts.servingSize', label: 'Serving size', placeholder: '1 scoop (33 g)' },
                    { name: 'nutritionFacts.servingsPerContainer', label: 'Servings per container', placeholder: '30' },
                  ]}
                />
                <RowsEditor value={form.nutritionFacts.rows} onChange={(rows) => set({ nutritionFacts: { ...form.nutritionFacts, rows } })} addLabel="Add nutrient" columns={[{ name: 'label', label: 'Nutrient', placeholder: 'Protein' }, { name: 'amount', label: 'Amount per serving', placeholder: '24 g', width: 170 }, { name: 'dailyValue', label: '% RDA (optional)', placeholder: '48%', width: 140 }]} />
                <div>
                  <h3 className="mb-2 border-b border-black pb-1 text-sm font-bold">Specifications</h3>
                  <RowsEditor value={form.specifications} onChange={(specifications) => set({ specifications })} addLabel="Add specification" columns={[{ name: 'label', label: 'Label', placeholder: 'Shelf life', width: 220 }, { name: 'value', label: 'Value', placeholder: '18 months' }]} />
                </div>
                <div>
                  <h3 className="mb-2 border-b border-black pb-1 text-sm font-bold">Product questions and answers</h3>
                  <RowsEditor value={form.faqs} onChange={(faqs) => set({ faqs })} addLabel="Add question" columns={[{ name: 'question', label: 'Question', type: 'textarea' }, { name: 'answer', label: 'Answer', type: 'textarea' }]} />
                </div>
              </div>
            )}

            {tab === 'seo' && <FormFields fields={SEO_FIELDS} form={form} onChange={setForm} />}
          </div>
        </div>

        <aside className="space-y-4">
          <Card title="Visibility">
            <div className="space-y-3">
              <Toggle checked={form.isActive} onChange={(v) => set({ isActive: v })} label="Enabled" hint="Disabled products are hidden from the store" />
              <Toggle checked={form.isFeatured} onChange={(v) => set({ isFeatured: v })} label="Featured" hint="Shown in Featured products on the homepage" />
              <Toggle checked={form.isBestSeller} onChange={(v) => set({ isBestSeller: v })} label="Best seller" />
              <Toggle checked={form.isNewArrival} onChange={(v) => set({ isNewArrival: v })} label="New arrival" />
            </div>
          </Card>
          <Card title="Summary">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-mute">Price</dt><dd className="font-semibold">{form.hasVariants ? `${variants.length} variants` : form.price ? `₹${form.price}` : 'Not set'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mute">Stock</dt><dd className="font-semibold">{form.hasVariants ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : form.stock || 0}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-mute">Images</dt><dd className="font-semibold">{form.images.length}</dd></div>
            </dl>
          </Card>
          <Btn variant="lime" className="w-full" loading={saving} onClick={save}>{id ? 'Save changes' : 'Create product'}</Btn>
        </aside>
      </div>
    </>
  );
}
