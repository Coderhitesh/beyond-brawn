'use client';
import Field from '@/components/ui/Field';

export const EMPTY_ADDRESS = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' };

export const STATES = ['Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

// Client-side checks mirror the API's rules so most mistakes are caught before a round trip.
export function validateAddress(a) {
  const e = {};
  if (!a.fullName || a.fullName.trim().length < 2) e.fullName = 'Enter the full name';
  if (!/^[6-9]\d{9}$/.test(a.phone || '')) e.phone = 'Enter a valid 10-digit mobile number';
  if (!a.line1 || a.line1.trim().length < 3) e.line1 = 'Enter the address';
  if (!a.city || a.city.trim().length < 2) e.city = 'Enter the city';
  if (!a.state) e.state = 'Choose the state';
  if (!/^\d{6}$/.test(a.pincode || '')) e.pincode = 'Enter a valid 6-digit pincode';
  return e;
}

export default function AddressForm({ value, onChange, errors = {}, prefix = '' }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const err = (k) => errors[`${prefix}${k}`] || errors[k];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" value={value.fullName} onChange={set('fullName')} autoComplete="name" error={err('fullName')} required />
      <Field label="Mobile number" value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" autoComplete="tel-national" error={err('phone')} hint="10 digits, for delivery updates" required />
      <Field className="sm:col-span-2" label="Address" value={value.line1} onChange={set('line1')} autoComplete="address-line1" placeholder="House number, street, area" error={err('line1')} required />
      <Field className="sm:col-span-2" label="Apartment, suite, landmark (optional)" value={value.line2} onChange={set('line2')} autoComplete="address-line2" error={err('line2')} />
      <Field label="Pincode" value={value.pincode} onChange={(e) => onChange({ ...value, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" autoComplete="postal-code" error={err('pincode')} required />
      <Field label="City" value={value.city} onChange={set('city')} autoComplete="address-level2" error={err('city')} required />
      <Field as="select" label="State" value={value.state} onChange={set('state')} autoComplete="address-level1" error={err('state')} required>
        <option value="">Choose state</option>
        {STATES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Field>
      <Field label="Country" value={value.country || 'India'} disabled readOnly />
    </div>
  );
}
