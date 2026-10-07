'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Img from '@/components/ui/Img';
import { Guard } from '@/components/admin/AdminShell';
import { Badge, Btn, DataTable, PageTitle, SearchBox, Tabs } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import { adminApi, exportUrl } from '@/services/admin';
import { formatDateTime } from '@/utils/format';

const STATUS = { out: ['red', 'Out of stock'], low: ['amber', 'Low'], ok: ['green', 'In stock'] };
const MOVE = { initial: 'Opening stock', restock: 'Restock', adjustment: 'Adjustment', reserve: 'Order placed', release: 'Order released', return: 'Cancelled order' };

function AdjustModal({ row, onClose, onDone }) {
  const toast = useToast();
  const [mode, setMode] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  if (!row) return null;
  const q = Number(quantity) || 0;
  const result = mode === 'add' ? row.stock + q : mode === 'remove' ? row.stock - q : q;
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi('/inventory/adjust', { method: 'POST', body: { productId: row.productId, variantId: row.variantId || null, mode, quantity: q, note: note.trim() || undefined } });
      toast.success(res.message);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title="Adjust stock" width="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm">
          <span className="font-bold">{row.name}</span>
          {row.variantLabel ? ` (${row.variantLabel})` : ''}
          <span className="block text-mute">SKU {row.sku}. Currently {row.stock} in stock.</span>
        </p>
        <fieldset className="grid grid-cols-3 gap-2">
          <legend className="alabel">What happened?</legend>
          {[['add', 'Stock received'], ['remove', 'Stock removed'], ['set', 'Set exact count']].map(([v, l]) => (
            <label key={v} className={`cursor-pointer border px-2 py-2 text-center text-[13px] font-semibold ${mode === v ? 'border-black bg-black text-white' : 'border-line hover:border-black'}`}>
              <input type="radio" name="mode" className="sr-only" checked={mode === v} onChange={() => setMode(v)} />
              {l}
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="adj-qty" className="alabel">{mode === 'set' ? 'New stock count' : 'Quantity'}</label>
          <input id="adj-qty" type="number" min="0" step="1" required className="ainput" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          {quantity !== '' && <p className={`ahint font-semibold ${result < 0 ? 'text-danger' : ''}`}>{result < 0 ? 'You cannot remove more than is in stock.' : `Stock will be ${result}.`}</p>}
        </div>
        <div>
          <label htmlFor="adj-note" className="alabel">Note (optional)</label>
          <input id="adj-note" className="ainput" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Supplier invoice, damaged units, stock count" />
        </div>
        <Btn type="submit" variant="lime" loading={saving} disabled={quantity === '' || result < 0}>Update stock</Btn>
      </form>
    </Modal>
  );
}

function History() {
  const list = useAdminList('/inventory/history', {}, { limit: 30 });
  const columns = [
    { key: 'createdAt', label: 'When', render: (r) => formatDateTime(r.createdAt) },
    { key: 'product', label: 'Product', render: (r) => (<span><span className="font-semibold">{r.product ? r.product.name : 'Deleted product'}</span>{r.variant && <span className="text-mute"> ({r.variant.label})</span>}<span className="block text-xs text-mute">{r.sku}</span></span>) },
    { key: 'type', label: 'Movement', render: (r) => MOVE[r.type] || r.type },
    { key: 'quantity', label: 'Change', align: 'right', render: (r) => <span className={`font-bold ${r.quantity < 0 ? 'text-danger' : 'text-lime-deep'}`}>{r.quantity > 0 ? `+${r.quantity}` : r.quantity}</span> },
    { key: 'stockAfter', label: 'Stock after', align: 'right' },
    { key: 'note', label: 'Details', render: (r) => <span className="text-mute">{[r.order && r.order.orderNumber, r.note, r.admin && `by ${r.admin.name}`].filter(Boolean).join(', ')}</span> },
  ];
  return (
    <>
      <div className="mb-3">
        <select className="ainput w-auto" aria-label="Movement type" value={list.query.type || ''} onChange={(e) => list.setQuery({ type: e.target.value })}>
          <option value="">All movements</option>
          {Object.entries(MOVE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} empty="No stock movements recorded yet." />
    </>
  );
}

function Inventory() {
  const params = useSearchParams();
  const { can } = useAdmin();
  const [view, setView] = useState('stock');
  const list = useAdminList('/inventory', { filter: params.get('filter') || '' }, { limit: 25 });
  const [adjusting, setAdjusting] = useState(null);
  const summary = list.extra.summary || { total: 0, low: 0, out: 0 };

  const columns = [
    { key: 'name', label: 'Product', render: (r) => (<span className="flex items-center gap-3"><Img src={r.thumbnail} alt="" width={40} height={40} className="size-10 shrink-0 bg-bone object-cover" /><span><span className="block font-semibold">{r.name}</span>{r.variantLabel && <span className="text-xs text-mute">{r.variantLabel}</span>}</span></span>) },
    { key: 'sku', label: 'SKU' },
    { key: 'stock', label: 'In stock', align: 'right', render: (r) => <span className="text-base font-bold">{r.stock}</span> },
    { key: 'lowStockThreshold', label: 'Alert at', align: 'right' },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={STATUS[r.status][0]}>{STATUS[r.status][1]}</Badge> },
    ...(can('inventory.manage') ? [{ key: '_a', label: '', align: 'right', render: (r) => <Btn variant="ghost" size="sm" onClick={() => setAdjusting(r)}>Adjust stock</Btn> }] : []),
  ];

  return (
    <>
      <PageTitle title="Inventory" text="One row per sellable SKU. Every change is recorded in the history." crumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'Inventory' }]}>
        <a href={exportUrl('/inventory', list.query)} className="abtn abtn-ghost"><Download className="size-4" aria-hidden />Export CSV</a>
      </PageTitle>
      <Tabs className="mb-4" value={view} onChange={setView} tabs={[{ value: 'stock', label: 'Stock levels' }, { value: 'history', label: 'Stock history' }]} />
      {view === 'history' ? (
        <History />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchBox value={list.query.q} onChange={(q) => list.setQuery({ q })} placeholder="Search product or SKU" className="w-full sm:w-72" />
            {[['', `All (${summary.total})`], ['restock', `Needs restocking (${summary.low + summary.out})`], ['low', `Low (${summary.low})`], ['out', `Out of stock (${summary.out})`]].map(([v, l]) => (
              <button key={v} type="button" onClick={() => list.setQuery({ filter: v })} aria-pressed={(list.query.filter || '') === v} className={`abtn abtn-sm ${(list.query.filter || '') === v ? 'abtn-primary' : 'abtn-ghost'}`}>{l}</button>
            ))}
          </div>
          <DataTable columns={columns} rows={list.items} rowKey="sku" loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} empty="Nothing matches this filter." />
        </>
      )}
      <AdjustModal key={adjusting ? adjusting.sku : 'none'} row={adjusting} onClose={() => setAdjusting(null)} onDone={() => { setAdjusting(null); list.reload(); }} />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['inventory.view', 'inventory.manage']}>
      <Inventory />
    </Guard>
  );
}
