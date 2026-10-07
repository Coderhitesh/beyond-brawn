'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import Chart from '@/components/admin/Charts';
import { Guard } from '@/components/admin/AdminShell';
import { Card, DataTable, ErrorBox, Loading, PageTitle, Stat, Tabs } from '@/components/admin/ui';
import useFetch from '@/hooks/useFetch';
import { adminApi, exportUrl, qs } from '@/services/admin';
import { formatDate, formatINR } from '@/utils/format';

const iso = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
const daysAgo = (n) => iso(new Date(Date.now() - n * 864e5));
const PRESETS = [['Last 7 days', 6], ['Last 30 days', 29], ['Last 90 days', 89], ['Last 12 months', 364]];
const money = (k, label) => ({ key: k, label, align: 'right', render: (r) => formatINR(r[k]) });
const cap = (s) => String(s || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function Sales({ range }) {
  const groupBy = (new Date(range.to) - new Date(range.from)) / 864e5 > 100 ? 'month' : 'day';
  const { data, loading, error, reload } = useFetch(() => adminApi(`/reports/sales${qs({ ...range, groupBy })}`), [range.from, range.to]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const t = data.totals;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Revenue" value={formatINR(Math.round(t.revenue))} />
        <Stat label="Orders" value={t.orders} />
        <Stat label="Average order" value={formatINR(Math.round(t.averageOrderValue))} />
        <Stat label="Coupon discounts" value={formatINR(Math.round(t.discounts))} />
        <Stat label="Refunded" value={formatINR(Math.round(t.refunded))} />
      </div>
      <Card title={`Revenue by ${groupBy}`}>
        <Chart type={data.rows.length > 45 ? 'area' : 'bars'} data={data.rows.map((r) => ({ label: r.period, short: groupBy === 'day' ? r.period.slice(5) : r.period, value: r.revenue }))} format={formatINR} label={`Revenue by ${groupBy}`} />
      </Card>
      <DataTable rowKey="period" rows={[...data.rows].reverse()} empty="No paid orders in this period."
        columns={[{ key: 'period', label: groupBy === 'day' ? 'Date' : 'Month' }, { key: 'orders', label: 'Orders', align: 'right' }, { key: 'items', label: 'Items', align: 'right' }, money('gross', 'Product sales'), money('discounts', 'Coupons'), money('shipping', 'Shipping'), money('tax', 'GST'), money('revenue', 'Revenue'), money('refunded', 'Refunded')]} />
    </div>
  );
}

function OrdersReport({ range }) {
  const { data, loading, error, reload } = useFetch(() => adminApi(`/reports/orders${qs(range)}`), [range.from, range.to]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const small = (title, rows, key, label) => (
    <Card title={title} pad={false}>
      <DataTable minWidth={300} rowKey={key} rows={rows} empty="No data." columns={[{ key, label, render: (r) => cap(r[key] || 'Unknown') }, { key: 'orders', label: 'Orders', align: 'right' }, money('value', 'Value')]} />
    </Card>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2 [&_.acard_.acard]:border-0">
      {small('By order status', data.rows, 'status', 'Status')}
      {small('By payment status', data.byPayment, 'paymentStatus', 'Payment')}
      {small('By payment method', data.byMethod, 'method', 'Method')}
      {small('Top states', data.byState, 'state', 'State')}
    </div>
  );
}

function ProductsReport({ range }) {
  const { data, loading, error, reload } = useFetch(() => adminApi(`/reports/products${qs(range)}`), [range.from, range.to]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return <DataTable rowKey="sku" rows={data.rows} empty="Nothing sold in this period." columns={[{ key: 'name', label: 'Product', render: (r) => (<span><span className="font-semibold">{r.name}</span>{r.variant && <span className="text-mute"> ({r.variant})</span>}</span>) }, { key: 'sku', label: 'SKU' }, { key: 'units', label: 'Units sold', align: 'right' }, { key: 'orders', label: 'Orders', align: 'right' }, money('revenue', 'Revenue')]} />;
}

function CustomersReport({ range }) {
  const { data, loading, error, reload } = useFetch(() => adminApi(`/reports/customers${qs(range)}`), [range.from, range.to]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const s = data.summary;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="New sign-ups" value={s.newCustomers} />
        <Stat label="Buyers" value={s.buyers} />
        <Stat label="Repeat buyers" value={s.repeatBuyers} sub={s.buyers ? `${Math.round((s.repeatBuyers / s.buyers) * 100)}% of buyers` : undefined} />
        <Stat label="Guest orders" value={s.guestOrders} />
      </div>
      <DataTable rowKey="email" rows={data.rows} empty="No buyers in this period." columns={[{ key: 'name', label: 'Customer', render: (r) => (<span><span className="font-semibold">{r.name}</span><span className="block text-xs text-mute">{r.email}</span></span>) }, { key: 'phone', label: 'Phone' }, { key: 'orders', label: 'Orders', align: 'right' }, money('spent', 'Spent'), { key: 'lastOrder', label: 'Last order', render: (r) => formatDate(r.lastOrder) }]} />
    </div>
  );
}

const VIEWS = { sales: Sales, orders: OrdersReport, products: ProductsReport, customers: CustomersReport };

function Reports() {
  const [tab, setTab] = useState('sales');
  const [range, setRange] = useState({ from: daysAgo(29), to: daysAgo(0) });
  const View = VIEWS[tab];
  const valid = range.from && range.to && range.from <= range.to;
  return (
    <>
      <PageTitle title="Reports" text="Paid orders only. Dates are India Standard Time." crumbs={[{ label: 'Reports' }]}>
        <a href={exportUrl(`/reports/${tab}`, range)} className="abtn abtn-ghost"><Download className="size-4" aria-hidden />Export CSV</a>
      </PageTitle>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {PRESETS.map(([label, n]) => {
          const on = range.from === daysAgo(n) && range.to === daysAgo(0);
          return <button key={label} type="button" aria-pressed={on} onClick={() => setRange({ from: daysAgo(n), to: daysAgo(0) })} className={`abtn abtn-sm ${on ? 'abtn-primary' : 'abtn-ghost'}`}>{label}</button>;
        })}
        <label className="flex items-center gap-1.5 text-[13px] text-mute">From<input type="date" className="ainput w-auto" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
        <label className="flex items-center gap-1.5 text-[13px] text-mute">To<input type="date" className="ainput w-auto" value={range.to} min={range.from} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
      </div>
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'sales', label: 'Sales' }, { value: 'orders', label: 'Orders' }, { value: 'products', label: 'Products' }, { value: 'customers', label: 'Customers' }]} />
      {valid ? <View range={range} /> : <ErrorBox message="Choose a start date that is before the end date." />}
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['reports.view']}>
      <Reports />
    </Guard>
  );
}
