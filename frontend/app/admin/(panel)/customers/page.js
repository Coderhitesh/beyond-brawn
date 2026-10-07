'use client';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Guard } from '@/components/admin/AdminShell';
import { ActiveBadge, Badge, DataTable, PageTitle, SearchBox, Select } from '@/components/admin/ui';
import useAdminList from '@/hooks/useAdminList';
import { exportUrl } from '@/services/admin';
import { formatDate, formatINR } from '@/utils/format';

function Customers() {
  const list = useAdminList('/customers');
  const columns = [
    { key: 'name', label: 'Customer', render: (r) => (<span><Link href={`/admin/customers/${r._id}`} className="font-semibold hover:underline">{r.name}</Link><span className="block text-xs text-mute">{r.email}</span></span>) },
    { key: 'phone', label: 'Phone' },
    { key: 'orders', label: 'Orders', align: 'right' },
    { key: 'spent', label: 'Spent', align: 'right', render: (r) => formatINR(Math.round(r.spent)) },
    { key: 'createdAt', label: 'Joined', render: (r) => formatDate(r.createdAt) },
    { key: 'isEmailVerified', label: 'Email', render: (r) => (r.isEmailVerified ? <Badge tone="outline">Verified</Badge> : <Badge>Unverified</Badge>) },
    { key: 'isActive', label: 'Status', render: (r) => <ActiveBadge on={r.isActive} no="Blocked" /> },
    { key: '_a', label: '', align: 'right', render: (r) => <Link href={`/admin/customers/${r._id}`} className="abtn abtn-ghost abtn-sm">Open</Link> },
  ];
  return (
    <>
      <PageTitle title="Customers" crumbs={[{ label: 'Customers' }]}>
        <a href={exportUrl('/customers', list.query)} className="abtn abtn-ghost"><Download className="size-4" aria-hidden />Export CSV</a>
      </PageTitle>
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchBox value={list.query.q} onChange={(q) => list.setQuery({ q })} placeholder="Search name, email or phone" className="w-full sm:w-72" />
        <Select label="Status" placeholder="Any status" value={list.query.status} onChange={(v) => list.setQuery({ status: v })} options={[{ value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }]} />
        <Select label="Email" placeholder="Any email state" value={list.query.verified} onChange={(v) => list.setQuery({ verified: v })} options={[{ value: 'true', label: 'Verified' }, { value: 'false', label: 'Unverified' }]} />
      </div>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} meta={list.meta} onPage={list.setPage} minWidth={860} empty="No customers match." />
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['customers.view', 'customers.manage']}>
      <Customers />
    </Guard>
  );
}
