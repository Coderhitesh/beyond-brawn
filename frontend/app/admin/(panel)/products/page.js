'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import Img from '@/components/ui/Img';
import { Guard } from '@/components/admin/AdminShell';
import { useOptions } from '@/components/admin/FormFields';
import { ActiveBadge, Badge, Btn, Confirm, DataTable, PageTitle, SearchBox, Select } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import useAdminList from '@/hooks/useAdminList';
import { adminApi, exportUrl } from '@/services/admin';
import { formatINR } from '@/utils/format';

const BULK = [
  { value: 'activate', label: 'Enable' }, { value: 'deactivate', label: 'Disable' },
  { value: 'feature', label: 'Mark featured' }, { value: 'unfeature', label: 'Remove featured' },
  { value: 'bestSeller', label: 'Mark best seller' }, { value: 'notBestSeller', label: 'Remove best seller' },
  { value: 'newArrival', label: 'Mark new arrival' }, { value: 'notNewArrival', label: 'Remove new arrival' },
  { value: 'delete', label: 'Delete' },
];

function Products() {
  const toast = useToast();
  const { can } = useAdmin();
  const manage = can('products.manage');
  const list = useAdminList('/products');
  const categories = useOptions('/categories');
  const [selected, setSelected] = useState([]);
  const [bulk, setBulk] = useState('');
  const [confirm, setConfirm] = useState(null); // { ids, action }
  const [working, setWorking] = useState(false);

  const runBulk = async (ids, action) => {
    setWorking(true);
    try {
      const res = action === 'delete' && ids.length === 1 ? await adminApi(`/products/${ids[0]}`, { method: 'DELETE' }) : await adminApi('/products/bulk', { method: 'POST', body: { ids, action } });
      toast.success(res.message);
      setSelected([]);
      setBulk('');
      setConfirm(null);
      list.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
    }
  };
  const applyBulk = () => (bulk === 'delete' ? setConfirm({ ids: selected, action: 'delete' }) : runBulk(selected, bulk));

  const columns = [
    {
      key: 'name', label: 'Product',
      render: (r) => (
        <span className="flex items-center gap-3">
          <Img src={r.thumbnail} alt="" width={44} height={44} className="size-11 shrink-0 bg-bone object-cover" />
          <span className="min-w-0">
            <Link href={`/admin/products/${r._id}`} className="block truncate font-semibold hover:underline">
              {r.name}
            </Link>
            <span className="text-xs text-mute">
              {r.sku}
              {r.hasVariants ? ', has variants' : ''}
            </span>
          </span>
        </span>
      ),
    },
    { key: 'category', label: 'Category', render: (r) => (r.category ? r.category.name : '') },
    { key: 'price', label: 'Price', align: 'right', render: (r) => (<span>{formatINR(r.price)}{r.mrp > r.price && <span className="block text-xs text-mute line-through">{formatINR(r.mrp)}</span>}</span>) },
    { key: 'stock', label: 'Stock', align: 'right', render: (r) => <span className={r.stock <= 0 ? 'font-bold text-danger' : r.stock <= r.lowStockThreshold ? 'font-bold text-[#8a6100]' : ''}>{r.stock}</span> },
    { key: 'soldCount', label: 'Sold', align: 'right' },
    {
      key: 'flags', label: 'Labels',
      render: (r) => (!(r.isFeatured || r.isBestSeller || r.isNewArrival) ? null : (
        <span className="flex flex-wrap gap-1">
          {r.isFeatured && <Badge tone="outline">Featured</Badge>}
          {r.isBestSeller && <Badge tone="outline">Best seller</Badge>}
          {r.isNewArrival && <Badge tone="outline">New</Badge>}
        </span>
      )),
    },
    { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} yes="Enabled" no="Disabled" /> },
    ...(manage
      ? [{
          key: '_a', label: '', align: 'right',
          render: (r) => (
            <span className="inline-flex gap-1">
              <Link href={`/admin/products/${r._id}`} aria-label={`Edit ${r.name}`} className="flex size-8 items-center justify-center hover:bg-bone"><Pencil className="size-4" /></Link>
              <button type="button" onClick={() => setConfirm({ ids: [r._id], action: 'delete', name: r.name })} aria-label={`Delete ${r.name}`} className="flex size-8 cursor-pointer items-center justify-center text-mute hover:text-danger"><Trash2 className="size-4" /></button>
            </span>
          ),
        }]
      : []),
  ];

  return (
    <>
      <PageTitle title="Products" crumbs={[{ label: 'Products' }]}>
        <a href={exportUrl('/products', list.query)} className="abtn abtn-ghost"><Download className="size-4" aria-hidden />Export CSV</a>
        {manage && <Link href="/admin/products/new" className="abtn abtn-lime"><Plus className="size-4" aria-hidden />Add product</Link>}
      </PageTitle>
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchBox value={list.query.q} onChange={(q) => list.setQuery({ q })} placeholder="Search name, SKU or tag" className="w-full sm:w-72" />
        <Select label="Category" placeholder="All categories" value={list.query.category} onChange={(v) => list.setQuery({ category: v })} options={categories} />
        <Select label="Status" placeholder="Any status" value={list.query.status} onChange={(v) => list.setQuery({ status: v })} options={[{ value: 'active', label: 'Enabled' }, { value: 'inactive', label: 'Disabled' }]} />
        <Select label="Stock" placeholder="Any stock" value={list.query.stock} onChange={(v) => list.setQuery({ stock: v })} options={[{ value: 'in', label: 'In stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }]} />
        <Select label="Sort" value={list.query.sort || 'newest'} onChange={(v) => list.setQuery({ sort: v })} options={[{ value: 'newest', label: 'Newest first' }, { value: 'name', label: 'Name A to Z' }, { value: 'price-asc', label: 'Price: low to high' }, { value: 'price-desc', label: 'Price: high to low' }, { value: 'stock-asc', label: 'Lowest stock' }, { value: 'sold', label: 'Most sold' }]} />
      </div>
      {manage && selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 bg-black px-3 py-2 text-white">
          <span className="text-sm font-semibold">{selected.length} selected</span>
          <Select label="Bulk action" placeholder="Choose action" value={bulk} onChange={setBulk} options={BULK} className="h-8 text-black" />
          <Btn variant="lime" size="sm" disabled={!bulk} loading={working} onClick={applyBulk}>Apply</Btn>
          <button type="button" onClick={() => setSelected([])} className="ml-auto cursor-pointer text-sm underline">Clear selection</button>
        </div>
      )}
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} selection={manage ? { ids: selected, onChange: setSelected } : undefined} minWidth={900} empty="No products match. Clear the filters or add a product." />
      <Confirm open={Boolean(confirm)} onClose={() => setConfirm(null)} loading={working} onConfirm={() => runBulk(confirm.ids, 'delete')} title={confirm && confirm.ids.length > 1 ? `Delete ${confirm.ids.length} products?` : 'Delete this product?'} text={`${confirm && confirm.name ? `"${confirm.name}" will be deleted. ` : ''}Products that appear in past orders are disabled instead of deleted, so order history and invoices stay intact.`} action="Delete" />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['products.view', 'products.manage']}>
      <Products />
    </Guard>
  );
}
