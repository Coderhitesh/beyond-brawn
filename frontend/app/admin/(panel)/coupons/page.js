'use client';
import ResourceManager from '@/components/admin/ResourceManager';
import { ActiveBadge, Badge } from '@/components/admin/ui';
import { formatDate, formatINR } from '@/utils/format';

const fields = [
  { name: 'code', label: 'Coupon code', required: true, upper: true, placeholder: 'WELCOME10', hint: 'Letters, numbers, - and _ only' },
  { name: 'isActive', label: 'Active', type: 'checkbox' },
  { name: 'description', label: 'Description', full: true, hint: 'Shown to the customer when the coupon is applied' },
  { name: 'discountType', label: 'Discount type', type: 'select', options: [{ value: 'percentage', label: 'Percentage off' }, { value: 'fixed', label: 'Fixed amount off (₹)' }], required: true },
  { name: 'value', label: 'Discount value', type: 'number', required: true, hint: 'Percent or rupees, depending on the type' },
  { name: 'minOrderAmount', label: 'Minimum order amount (₹)', type: 'number' },
  { name: 'maxDiscount', label: 'Maximum discount (₹)', type: 'number', hint: '0 means no cap. Useful for percentage coupons.' },
  { name: 'startDate', label: 'Start date', type: 'date' },
  { name: 'expiryDate', label: 'Expiry date', type: 'dateEnd', hint: 'Valid until the end of this day' },
  { name: 'usageLimit', label: 'Total usage limit', type: 'number', hint: '0 means unlimited' },
  { name: 'perUserLimit', label: 'Limit per customer', type: 'number', hint: '0 means unlimited' },
  { type: 'heading', label: 'Restrict to (leave both empty to apply to the whole cart)' },
  { name: 'applicableCategories', label: 'Categories', type: 'multiAsync', endpoint: '/categories' },
  { name: 'applicableProducts', label: 'Products', type: 'multiAsync', endpoint: '/products' },
];
const expired = (r) => r.expiryDate && new Date(r.expiryDate) < new Date();
const columns = [
  { key: 'code', label: 'Code', render: (r) => <span className="font-bold">{r.code}</span> },
  { key: 'value', label: 'Discount', render: (r) => (r.discountType === 'percentage' ? `${r.value}%${r.maxDiscount ? ` up to ${formatINR(r.maxDiscount)}` : ''}` : formatINR(r.value)) },
  { key: 'minOrderAmount', label: 'Min order', align: 'right', render: (r) => (r.minOrderAmount ? formatINR(r.minOrderAmount) : 'None') },
  { key: 'usedCount', label: 'Used', align: 'right', render: (r) => `${r.usedCount}${r.usageLimit ? ` / ${r.usageLimit}` : ''}` },
  { key: 'expiryDate', label: 'Expires', render: (r) => (r.expiryDate ? formatDate(r.expiryDate) : 'Never') },
  { key: 'isActive', label: 'Status', render: (r) => (expired(r) ? <Badge tone="red">Expired</Badge> : <ActiveBadge on={r.isActive} />) },
];

export default function Page() {
  return <ResourceManager title="Coupons" text="Discount codes customers enter in the cart." crumbs={[{ label: 'Coupons' }]} endpoint="/coupons" perm="coupons.manage" singular="coupon" columns={columns} fields={fields} defaults={{ isActive: true, discountType: 'percentage', perUserLimit: 1, usageLimit: 0, minOrderAmount: 0, maxDiscount: 0 }} filters={[{ key: 'isActive', label: 'Any status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] }]} />;
}
